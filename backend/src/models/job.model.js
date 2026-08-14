const db = require('../config/db');

/**
 * job description data access object / model methods
 */
class JobModel {
  /**
   * fetch all active job description templates
   */
  static async findAll() {
    const queryText = `
      SELECT id, title, company, description, required_skills, 
             experience_years, education_level, created_at
      FROM jobs
      ORDER BY id ASC;
    `;
    const { rows } = await db.query(queryText);
    return rows;
  }

  /**
   * fetch job details by primary key id
   */
  static async findById(id) {
    const queryText = `
      SELECT id, title, company, description, required_skills, 
             experience_years, education_level, created_at
      FROM jobs
      WHERE id = $1;
    `;
    const { rows } = await db.query(queryText, [id]);
    return rows[0] || null;
  }

  /**
   * create a new custom target job description
   */
  static async createJob({ title, company = 'Custom Target Role', description, requiredSkills = [], experienceYears = 0, educationLevel = 'Bachelor' }) {
    const queryText = `
      INSERT INTO jobs (title, company, description, required_skills, experience_years, education_level)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, title, company, description, required_skills, experience_years, education_level, created_at;
    `;
    const values = [
      title.trim(),
      company.trim(),
      description.trim(),
      requiredSkills,
      experienceYears,
      educationLevel
    ];
    const { rows } = await db.query(queryText, values);
    return rows[0];
  }
}

module.exports = JobModel;
