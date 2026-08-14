const { pool } = require('../config/db');
const ResumeModel = require('../models/resume.model');
const JobModel = require('../models/job.model');
const AnalysisModel = require('../models/analysis.model');
const MLClient = require('./ml.client');

/**
 * core analysis orchestration service
 * coordinates resume text -> ml service -> postgresql persistence
 */
class AnalysisService {
  /**
   * run a complete resume analysis workflow:
   * 1. fetch resume text and job description
   * 2. call fastapi ml service
   * 3. save analysis results, skills, and recommendations in a postgresql transaction
   */
  static async runAnalysis({ userId, resumeId, jobId, manualJobDescription, manualJobTitle }) {
    // 1. fetch resume extracted text
    const resume = await ResumeModel.findById(resumeId);
    if (!resume) {
      const err = new Error('Resume record not found. Please upload a resume first.');
      err.statusCode = 404;
      err.errorCode = 'RESUME_NOT_FOUND';
      throw err;
    }

    if (resume.user_id !== userId) {
      const err = new Error('Unauthorized: You do not own this resume.');
      err.statusCode = 403;
      err.errorCode = 'FORBIDDEN';
      throw err;
    }

    if (!resume.extracted_text || resume.extracted_text.length < 20) {
      const err = new Error('Resume text could not be read. Please upload a valid text-based PDF or DOCX.');
      err.statusCode = 400;
      err.errorCode = 'INVALID_RESUME_TEXT';
      throw err;
    }

    // 2. fetch or compose job description
    let jobDescription = manualJobDescription || '';
    let jobTitle = manualJobTitle || 'Target Role';
    let requiredSkills = [];
    let resolvedJobId = jobId || null;

    if (jobId) {
      const job = await JobModel.findById(jobId);
      if (!job) {
        const err = new Error('Job description template not found.');
        err.statusCode = 404;
        err.errorCode = 'JOB_NOT_FOUND';
        throw err;
      }
      jobDescription = job.description;
      jobTitle = job.title;
      requiredSkills = job.required_skills || [];
    }

    if (!jobDescription || jobDescription.trim().length < 15) {
      const err = new Error('A valid job description (minimum 15 characters) is required.');
      err.statusCode = 400;
      err.errorCode = 'INVALID_JOB_DESCRIPTION';
      throw err;
    }

    // 3. call fastapi ml microservice
    const mlResult = await MLClient.analyze(
      resume.extracted_text,
      jobDescription,
      requiredSkills
    );

    if (!mlResult || !mlResult.score) {
      const err = new Error('Received an invalid or empty response from the AI analysis service.');
      err.statusCode = 502;
      err.errorCode = 'INVALID_ML_RESPONSE';
      throw err;
    }

    // 4. persist results in postgresql using a transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // insert main analysis record
      const analysis = await AnalysisModel.createAnalysis(client, {
        userId,
        resumeId,
        jobId: resolvedJobId,
        jobTitle,
        jobDescription,
        overallScore: mlResult.score.overall,
        atsScore: mlResult.score.ats,
        skillsScore: mlResult.score.skills,
        experienceScore: mlResult.score.experience,
        educationScore: mlResult.score.education
      });

      // insert matched skills
      for (const skillName of (mlResult.matched_skills || [])) {
        if (skillName && skillName.trim()) {
          const skillId = await AnalysisModel.upsertSkill(client, skillName.trim());
          await AnalysisModel.insertAnalysisSkill(client, {
            analysisId: analysis.id,
            skillId,
            matchStatus: 'MATCHED',
            confidence: 0.95
          });
        }
      }

      // insert missing skills
      for (const skillName of (mlResult.missing_skills || [])) {
        if (skillName && skillName.trim()) {
          const skillId = await AnalysisModel.upsertSkill(client, skillName.trim());
          await AnalysisModel.insertAnalysisSkill(client, {
            analysisId: analysis.id,
            skillId,
            matchStatus: 'MISSING',
            confidence: 0.90
          });
        }
      }

      // insert detailed recommendations with real priorities and categories
      const detailedRecs = mlResult.recommendations_detailed || [];
      const plainRecs    = mlResult.recommendations || [];

      if (detailedRecs.length > 0) {
        for (const rec of detailedRecs) {
          if (rec && rec.text && rec.text.trim()) {
            await AnalysisModel.insertRecommendation(client, {
              analysisId: analysis.id,
              recommendation: rec.text.trim(),
              priority: rec.priority || 'MEDIUM',
              category: rec.category || 'General'
            });
          }
        }
      } else {
        // fallback to plain list
        for (const rec of plainRecs) {
          if (rec && rec.trim()) {
            await AnalysisModel.insertRecommendation(client, {
              analysisId: analysis.id,
              recommendation: rec.trim(),
              priority: 'MEDIUM',
              category: 'General'
            });
          }
        }
      }

      await client.query('COMMIT');

      return {
        analysisId:               analysis.id,
        score:                    mlResult.score,
        matched_skills:           mlResult.matched_skills || [],
        missing_skills:           mlResult.missing_skills || [],
        recommendations:          mlResult.recommendations || [],
        recommendations_detailed: mlResult.recommendations_detailed || [],
        detailed_analysis:        mlResult.detailed_analysis || {},
        jobTitle,
        resumeFileName:           resume.file_name,
        createdAt:                analysis.created_at
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

module.exports = AnalysisService;
