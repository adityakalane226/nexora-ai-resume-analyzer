const AnalysisService = require('../services/analysis.service');
const AnalysisModel = require('../models/analysis.model');
const MLClient = require('../services/ml.client');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * analysis controller handling ai resume evaluation endpoints
 */
class AnalysisController {
  /**
   * trigger a full ai resume analysis
   * post /api/analyses
   */
  static async createAnalysis(req, res, next) {
    try {
      const userId = req.user.id;
      const { resumeId, jobId, jobDescription, jobTitle } = req.body;

      if (!resumeId) {
        return errorResponse(res, 400, 'Resume ID is required to perform analysis.', 'MISSING_RESUME_ID');
      }

      if (!jobId && !jobDescription) {
        return errorResponse(
          res, 400,
          'Either a Job ID (from saved templates) or a Job Description text is required.',
          'MISSING_JOB_INPUT'
        );
      }

      const result = await AnalysisService.runAnalysis({
        userId,
        resumeId: parseInt(resumeId, 10),
        jobId: jobId ? parseInt(jobId, 10) : null,
        manualJobDescription: jobDescription || '',
        manualJobTitle: jobTitle || 'Target Role'
      });

      return successResponse(res, 201, 'Resume analysis completed successfully', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * retrieve all analyses for the authenticated user
   * get /api/analyses
   */
  static async getMyAnalyses(req, res, next) {
    try {
      const analyses = await AnalysisModel.findByUserId(req.user.id);
      return successResponse(res, 200, 'Analysis history fetched successfully', { analyses });
    } catch (error) {
      next(error);
    }
  }

  /**
   * get detailed analysis report by id
   * get /api/analyses/:id
   */
  static async getAnalysisById(req, res, next) {
    try {
      const analysisId = parseInt(req.params.id, 10);
      const analysis = await AnalysisModel.findByIdDetailed(analysisId);

      if (!analysis) {
        return errorResponse(res, 404, 'Analysis record not found.', 'NOT_FOUND');
      }

      if (analysis.user_id !== req.user.id) {
        return errorResponse(res, 403, 'Unauthorized access to this analysis report.', 'FORBIDDEN');
      }

      return successResponse(res, 200, 'Analysis report fetched successfully', { analysis });
    } catch (error) {
      next(error);
    }
  }

  /**
   * get dashboard summary statistics for authenticated user
   * get /api/analyses/stats
   */
  static async getDashboardStats(req, res, next) {
    try {
      const stats = await AnalysisModel.getDashboardStats(req.user.id);
      const recent = await AnalysisModel.findByUserId(req.user.id);
      return successResponse(res, 200, 'Dashboard statistics fetched', {
        totalAnalyses: parseInt(stats.total_analyses, 10) || 0,
        averageScore: parseFloat(stats.average_score) || 0,
        bestScore: parseInt(stats.best_score, 10) || 0,
        recentAnalyses: recent.slice(0, 5)
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * get /api/analyses/ml-health — check fastapi ml service health
   */
  static async checkMLHealth(req, res, next) {
    try {
      const health = await MLClient.checkHealth();
      return successResponse(res, 200, 'ML Service health status', health);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AnalysisController;
