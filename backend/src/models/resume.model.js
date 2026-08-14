const db = require('../config/db');

/**
 * resume data access object / model methods
 */
class ResumeModel {
  /**
   * insert new resume record into postgresql
   */
  static async createResume({ userId, fileName, filePath, fileType, extractedText }) {
    const queryText = `
      INSERT INTO resumes (user_id, file_name, file_path, file_type, extracted_text)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, user_id, file_name, file_path, file_type, extracted_text, created_at;
    `;
    const values = [userId, fileName, filePath, fileType, extractedText];
    const { rows } = await db.query(queryText, values);
    return rows[0];
  }

  /**
   * find resumes for specific user
   */
  static async findByUserId(userId) {
    const queryText = `
      SELECT id, user_id, file_name, file_path, file_type, 
             LEFT(extracted_text, 200) as preview_text, created_at
      FROM resumes
      WHERE user_id = $1
      ORDER BY created_at DESC;
    `;
    const { rows } = await db.query(queryText, [userId]);
    return rows;
  }

  /**
   * find single resume by primary key id
   */
  static async findById(id) {
    const queryText = `
      SELECT id, user_id, file_name, file_path, file_type, extracted_text, created_at
      FROM resumes
      WHERE id = $1;
    `;
    const { rows } = await db.query(queryText, [id]);
    return rows[0] || null;
  }
}

module.exports = ResumeModel;
