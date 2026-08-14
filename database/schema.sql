DROP TABLE IF EXISTS recommendations CASCADE;
DROP TABLE IF EXISTS analysis_skills CASCADE;
DROP TABLE IF EXISTS skills CASCADE;
DROP TABLE IF EXISTS analyses CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS resumes CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP TYPE IF EXISTS match_type;
CREATE TYPE match_type AS ENUM ('MATCHED', 'MISSING');

-- 1. user table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);

-- 2. resume table
CREATE TABLE resumes (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    extracted_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_resumes_user ON resumes(user_id);

-- 3. jobs table
CREATE TABLE jobs (
    id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    company VARCHAR(150) NOT NULL DEFAULT 'Target Role',
    description TEXT NOT NULL,
    required_skills TEXT[] DEFAULT '{}',
    experience_years INT DEFAULT 0,
    education_level VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. analysis table
CREATE TABLE analyses (
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

CREATE INDEX idx_analyses_user ON analyses(user_id);

-- 5. skills table
CREATE TABLE skills (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50) DEFAULT 'General'
);

CREATE INDEX idx_skills_name ON skills(name);

-- 6. analysis_skills table (to link analyses with skills and their match status)
CREATE TABLE analysis_skills (
    id SERIAL PRIMARY KEY,
    analysis_id INT NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
    skill_id INT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    match_status match_type NOT NULL,
    confidence NUMERIC(4, 2) DEFAULT 1.00
);

CREATE INDEX idx_analysis_skills_analysis ON analysis_skills(analysis_id);

-- 7. recommendations table
CREATE TABLE recommendations (
    id SERIAL PRIMARY KEY,
    analysis_id INT NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
    recommendation TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'MEDIUM', -- high, medium, low
    category VARCHAR(50) DEFAULT 'General'
);

CREATE INDEX idx_recommendations_analysis ON recommendations(analysis_id);
