
TRUNCATE TABLE recommendations, analysis_skills, skills, analyses, jobs, resumes, users RESTART IDENTITY CASCADE;


INSERT INTO users (name, email, password_hash) VALUES
('Aditya Sharma', 'aditya@example.com', '$2a$10$wT03s6QJkZ/nMLYmJ5e.Oer.y5h8C/zH/.9gK5R/S9OaJ6Q1b4w2.'),
('Sneha Kulkarni', 'sneha@example.com', '$2a$10$wT03s6QJkZ/nMLYmJ5e.Oer.y5h8C/zH/.9gK5R/S9OaJ6Q1b4w2.');

INSERT INTO jobs (title, company, description, required_skills, experience_years, education_level) VALUES
('Machine Learning Engineer', 'Tech Corp', 'Seeking an ML Engineer experienced in Python, scikit-learn, FastAPI, SQL, Docker, and AWS model deployment.', ARRAY['Python', 'SQL', 'Machine Learning', 'FastAPI', 'Docker', 'AWS'], 3, 'Bachelor'),
('Data Scientist', 'Analytics Corp', 'Looking for a Data Scientist skilled in pandas, NumPy, Data Analysis, Regression, and Statistics.', ARRAY['Python', 'Data Science', 'Pandas', 'NumPy', 'Statistics', 'SQL'], 2, 'Master'),
('Full Stack Developer', 'Web Solutions', 'Fullstack engineer needed for Node.js, Express, React, PostgreSQL, and REST API development.', ARRAY['JavaScript', 'Node.js', 'Express', 'React', 'PostgreSQL', 'Git'], 3, 'Bachelor');

INSERT INTO skills (name, category) VALUES
('Python', 'Programming'),
('SQL', 'Database'),
('Machine Learning', 'AI/ML'),
('FastAPI', 'Backend'),
('Docker', 'DevOps'),
('AWS', 'Cloud'),
('JavaScript', 'Programming'),
('React', 'Frontend'),
('Node.js', 'Backend'),
('Express', 'Backend'),
('PostgreSQL', 'Database'),
('Git', 'DevOps');

INSERT INTO resumes (user_id, file_name, file_path, file_type, extracted_text) VALUES
(1, 'Aditya_Resume.pdf', '/uploads/aditya_resume.pdf', 'pdf', 'Aditya Sharma - Machine Learning & Software Engineer. Skilled in Python, SQL, Machine Learning, scikit-learn, Node.js, React, PostgreSQL, and Git.');

INSERT INTO analyses (user_id, resume_id, job_id, job_title, job_description, overall_score, ats_score, skills_score, experience_score, education_score) VALUES
(1, 1, 1, 'Machine Learning Engineer', 'Seeking an ML Engineer experienced in Python, scikit-learn, FastAPI, SQL, Docker, and AWS model deployment.', 82, 91, 78, 85, 90);

INSERT INTO analysis_skills (analysis_id, skill_id, match_status, confidence) VALUES
(1, 1, 'MATCHED', 0.98),
(1, 2, 'MATCHED', 0.95),
(1, 3, 'MATCHED', 0.92),
(1, 5, 'MISSING', 0.85),
(1, 6, 'MISSING', 0.85);

INSERT INTO recommendations (analysis_id, recommendation, priority) VALUES
(1, 'Add hands-on containerization experience (Docker) to increase match score.', 'HIGH'),
(1, 'Include cloud service deployment project details (AWS / Azure).', 'HIGH');
