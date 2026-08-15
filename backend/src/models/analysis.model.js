const db = require('../config/db');

/**
 * analysis data access object / model methods
 */
class AnalysisModel {
  /**
   * insert a new analysis record into postgresql (within a transaction)
   */
  static async createAnalysis(client, {
    userId, resumeId, jobId, jobTitle, jobDescription,
    overallScore, atsScore, skillsScore, experienceScore, educationScore
  }) {
    // ensure tables exist on-the-fly
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE match_type AS ENUM ('MATCHED', 'MISSING');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      CREATE TABLE IF NOT EXISTS analyses (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        resume_id INT REFERENCES resumes(id) ON DELETE SET NULL,
        job_id INT REFERENCES jobs(id) ON DELETE SET NULL,
        job_title VARCHAR(150),
        job_description TEXT,
        overall_score INT NOT NULL CHECK (overall_score BETWEEN 0 AND 100),
        ats_score INT NOT NULL CHECK (ats_score BETWEEN 0 AND 100),
        skills_score INT NOT NULL CHECK (skills_score BETWEEN 0 AND 100),
        experience_score INT NOT NULL CHECK (experience_score BETWEEN 0 AND 100),
        education_score INT NOT NULL CHECK (education_score BETWEEN 0 AND 100),
        status VARCHAR(50) DEFAULT 'COMPLETED',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS skills (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        category VARCHAR(50) DEFAULT 'General'
      );

      CREATE TABLE IF NOT EXISTS analysis_skills (
        id SERIAL PRIMARY KEY,
        analysis_id INT NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
        skill_id INT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
        match_status match_type NOT NULL,
        confidence NUMERIC(4, 2) DEFAULT 1.00
      );

      CREATE TABLE IF NOT EXISTS recommendations (
        id SERIAL PRIMARY KEY,
        analysis_id INT NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
        recommendation TEXT NOT NULL,
        priority VARCHAR(20) DEFAULT 'MEDIUM',
        category VARCHAR(50) DEFAULT 'General'
      );
    `);

    const queryText = `
      INSERT INTO analyses (
        user_id, resume_id, job_id, job_title, job_description,
        overall_score, ats_score, skills_score, experience_score, education_score, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'COMPLETED')
      RETURNING id, user_id, resume_id, job_id, job_title,
                overall_score, ats_score, skills_score, experience_score, education_score,
                status, created_at;
    `;
    const values = [
      userId, resumeId || null, jobId || null, jobTitle || null, jobDescription,
      overallScore, atsScore, skillsScore, experienceScore, educationScore
    ];
    const { rows } = await client.query(queryText, values);
    return rows[0];
  }

  /**
   * fetch or create a skill record in skills table
   */
  static async upsertSkill(client, skillName) {
    const queryText = `
      INSERT INTO skills (name) VALUES ($1)
      ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
      RETURNING id;
    `;
    const { rows } = await client.query(queryText, [skillName]);
    return rows[0].id;
  }

  /**
   * insert a skill match record for an analysis
   */
  static async insertAnalysisSkill(client, { analysisId, skillId, matchStatus, confidence = 1.0 }) {
    const queryText = `
      INSERT INTO analysis_skills (analysis_id, skill_id, match_status, confidence)
      VALUES ($1, $2, $3, $4);
    `;
    await client.query(queryText, [analysisId, skillId, matchStatus, confidence]);
  }

  /**
   * insert a recommendation record for an analysis
   */
  static async insertRecommendation(client, { analysisId, recommendation, priority = 'MEDIUM', category = 'General' }) {
    const queryText = `
      INSERT INTO recommendations (analysis_id, recommendation, priority, category)
      VALUES ($1, $2, $3, $4);
    `;
    await client.query(queryText, [analysisId, recommendation, priority, category]);
  }

  /**
   * fetch all analyses for a user with pagination
   */
  static async findByUserId(userId) {
    const queryText = `
      SELECT
        a.id, a.job_title, a.overall_score, a.ats_score, a.skills_score,
        a.experience_score, a.education_score, a.status, a.created_at,
        r.file_name AS resume_file_name, r.file_type AS resume_file_type
      FROM analyses a
      LEFT JOIN resumes r ON a.resume_id = r.id
      WHERE a.user_id = $1
      ORDER BY a.created_at DESC;
    `;
    const { rows } = await db.query(queryText, [userId]);
    return rows;
  }

  /**
   * fetch detailed analysis by id including skills and recommendations
   */
  static async findByIdDetailed(analysisId) {
    const { rows: analyses } = await db.query(`
      SELECT
        a.id, a.user_id, a.job_title, a.job_description,
        a.overall_score, a.ats_score, a.skills_score,
        a.experience_score, a.education_score, a.status, a.created_at,
        r.file_name AS resume_file_name, r.file_type AS resume_file_type
      FROM analyses a
      LEFT JOIN resumes r ON a.resume_id = r.id
      WHERE a.id = $1;
    `, [analysisId]);

    if (!analyses[0]) return null;
    const analysis = analyses[0];

    // fetch matched/missing skills
    const { rows: skillRows } = await db.query(`
      SELECT s.name, ansk.match_status, ansk.confidence
      FROM analysis_skills ansk
      JOIN skills s ON ansk.skill_id = s.id
      WHERE ansk.analysis_id = $1
      ORDER BY ansk.match_status, s.name;
    `, [analysisId]);

    // fetch recommendations with priority and category
    const { rows: recRows } = await db.query(`
      SELECT recommendation, priority, category
      FROM recommendations
      WHERE analysis_id = $1
      ORDER BY
        CASE priority WHEN 'HIGH' THEN 1 WHEN 'MEDIUM' THEN 2 ELSE 3 END,
        id ASC;
    `, [analysisId]);

    analysis.matched_skills  = skillRows.filter(s => s.match_status === 'MATCHED').map(s => s.name);
    analysis.missing_skills  = skillRows.filter(s => s.match_status === 'MISSING').map(s => s.name);
    analysis.recommendations = recRows.map(r => ({
      text:     r.recommendation,
      priority: r.priority,
      category: r.category || 'General'
    }));

    return analysis;
  }

  /**
   * get aggregate dashboard statistics for a user
   */
  static async getDashboardStats(userId) {
    const { rows } = await db.query(`
      SELECT
        COUNT(*) AS total_analyses,
        ROUND(AVG(overall_score), 1) AS average_score,
        MAX(overall_score) AS best_score
      FROM analyses
      WHERE user_id = $1;
    `, [userId]);
    return rows[0];
  }
}

module.exports = AnalysisModel;
