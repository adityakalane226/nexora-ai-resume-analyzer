const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// check if connecting to a cloud database (neon, supabase, render, etc.)
const isRemoteDb = Boolean(
  process.env.DATABASE_URL ||
  process.env.DB_SSL === 'true' ||
  process.env.NODE_ENV === 'production' ||
  (process.env.DB_HOST && !['localhost', '127.0.0.1'].includes(process.env.DB_HOST))
);

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: isRemoteDb ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'nexora_resume_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      ssl: isRemoteDb ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    };

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('[PostgreSQL Pool Error]', err.message);
});

const query = (text, params) => pool.query(text, params);

const initDatabase = async () => {
  try {
    // ensure custom enum exists
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE match_type AS ENUM ('MATCHED', 'MISSING');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 1. users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `);

    // 2. resumes table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS resumes (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        file_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_type VARCHAR(50) NOT NULL,
        extracted_text TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_resumes_user ON resumes(user_id);
    `);

    // 3. jobs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS jobs (
        id SERIAL PRIMARY KEY,
        title VARCHAR(150) NOT NULL,
        company VARCHAR(150) NOT NULL DEFAULT 'Target Role',
        description TEXT NOT NULL,
        required_skills TEXT[] DEFAULT '{}',
        experience_years INT DEFAULT 0,
        education_level VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. analyses table
    await pool.query(`
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
      CREATE INDEX IF NOT EXISTS idx_analyses_user ON analyses(user_id);
    `);

    // 5. skills table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS skills (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        category VARCHAR(50) DEFAULT 'General'
      );
      CREATE INDEX IF NOT EXISTS idx_skills_name ON skills(name);
    `);

    // 6. analysis_skills table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS analysis_skills (
        id SERIAL PRIMARY KEY,
        analysis_id INT NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
        skill_id INT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
        match_status match_type NOT NULL,
        confidence NUMERIC(4, 2) DEFAULT 1.00
      );
      CREATE INDEX IF NOT EXISTS idx_analysis_skills_analysis ON analysis_skills(analysis_id);
    `);

    // 7. recommendations table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS recommendations (
        id SERIAL PRIMARY KEY,
        analysis_id INT NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
        recommendation TEXT NOT NULL,
        priority VARCHAR(20) DEFAULT 'MEDIUM',
        category VARCHAR(50) DEFAULT 'General'
      );
      CREATE INDEX IF NOT EXISTS idx_recommendations_analysis ON recommendations(analysis_id);
    `);

    // auto-seed default demo accounts (password: demo123)
    await pool.query(`
      INSERT INTO users (name, email, password_hash) VALUES
      ('Demo Candidate', 'demo@nexora.ai', '$2a$10$VWOUKphhj8ryD6Asdc0HEuTaRRjrmMH9t5X462QqcnfWPFQJrhDtG'),
      ('Aditya Sharma', 'candidate@nexora.ai', '$2a$10$VWOUKphhj8ryD6Asdc0HEuTaRRjrmMH9t5X462QqcnfWPFQJrhDtG'),
      ('Demo User', 'demo@gmail.com', '$2a$10$VWOUKphhj8ryD6Asdc0HEuTaRRjrmMH9t5X462QqcnfWPFQJrhDtG')
      ON CONFLICT (email) DO NOTHING;
    `);

    console.log('[PostgreSQL] Database schema tables verified and ready.');
  } catch (err) {
    console.error('[PostgreSQL Schema Init Error]', err.message);
  }
};

module.exports = {
  pool,
  query,
  initDatabase
};
