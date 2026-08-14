const db = require('../config/db');

/**
 * user data access object / model methods
 */
class UserModel {
  /**
   * finds a user by email address
   */
  static async findByEmail(email) {
    const queryText = `
      SELECT id, name, email, password_hash, created_at
      FROM users
      WHERE email = $1;
    `;
    const { rows } = await db.query(queryText, [email.toLowerCase().trim()]);
    return rows[0] || null;
  }

  /**
   * finds a user by primary key id (excluding sensitive password hash)
   */
  static async findById(id) {
    const queryText = `
      SELECT id, name, email, created_at, updated_at
      FROM users
      WHERE id = $1;
    `;
    const { rows } = await db.query(queryText, [id]);
    return rows[0] || null;
  }

  /**
   * creates a new user record
   */
  static async createUser({ name, email, passwordHash }) {
    const queryText = `
      INSERT INTO users (name, email, password_hash)
      VALUES ($1, $2, $3)
      RETURNING id, name, email, created_at;
    `;
    const values = [name.trim(), email.toLowerCase().trim(), passwordHash];
    const { rows } = await db.query(queryText, values);
    return rows[0];
  }
}

module.exports = UserModel;
