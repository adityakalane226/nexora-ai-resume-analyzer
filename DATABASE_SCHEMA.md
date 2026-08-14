# Nexora Database Schema & ER Diagram Specification

Database Name: `nexora_resume_db`


# Entity-Relationship (ER) Diagram
--> Exists in root directory


# Detailed Table Specifications

1. users
Stores registered user accounts and bcrypt-hashed password credentials.

| Column          | Type           | Constraints                 | Description                              |
|--------         |------          |-------------                |-------------                             |
| `id`            | `SERIAL`       | `PRIMARY KEY`               | Auto-incrementing unique user identifier |
| `name`          | `VARCHAR(100)` | `NOT NULL`                  | Full name of the user                    |
| `email`         | `VARCHAR(150)` | `UNIQUE`, `NOT NULL`        | User email address (login credential)    |
| `password_hash` | `VARCHAR(255)` | `NOT NULL`                  | Bcrypt password hash                     |
| `created_at`    | `TIMESTAMPTZ`  | `DEFAULT CURRENT_TIMESTAMP` | Account creation timestamp               |



2. resumes
Stores file metadata and extracted plain text from uploaded PDF/DOCX resume documents.

| Column           | Type          | Constraints                                | Description                      |
|--------          |------         |-------------                               |-------------                     |
| `id`             | `SERIAL`      | `PRIMARY KEY`                              | Unique resume file identifier    |
| `user_id`        | `INT`         | `FOREIGN KEY (users.id) ON DELETE CASCADE` | Owner user ID                    |
| `file_name`      | `VARCHAR(255)`| `NOT NULL`                                 | Original filename                |
| `file_path`      | `VARCHAR(500)`| `NOT NULL`                                 | Storage path on server disk      |
| `file_type`      | `VARCHAR(50)` | `NOT NULL`                                 | File extension (`pdf` or `docx`) |
| `extracted_text` | `TEXT`        | `NOT NULL`                                 | Extracted plain text string      |
| `created_at`     | `TIMESTAMPTZ` | `DEFAULT CURRENT_TIMESTAMP`                | Upload timestamp                 |


# 3. jobs
Stores reusable target job templates.

| Column             | Type           | Constraints             | Description                      |
|--------            |------          |-------------            |-------------                     |
| `id`               | `SERIAL`       | `PRIMARY KEY`           | Unique job template identifier   |
| `title`            | `VARCHAR(150)` | `NOT NULL`              | Job role title                   |
| `company`          | `VARCHAR(150)` | `DEFAULT 'Target Role'` | Company name                     |
| `description`      | `TEXT`         | `NOT NULL`              | Full job description text        |
| `required_skills`  | `TEXT[]`       | `DEFAULT '{}'`          | Array of core skill names        |
| `experience_years` | `INT`          | `DEFAULT 0`             | Target experience years required |
| `education_level`  | `VARCHAR(100)` | -                       | Preferred degree level           |

---

# 4. analyses
Central evaluation table storing overall and sub-scores for each analysis run.

| Column            | Type          | Constraints                                   | Description                                 |
|--------           |------         |-------------                                  |-------------                                |
| `id`              | `SERIAL`      | `PRIMARY KEY`                                 | Unique analysis record identifier           |
| `user_id`         | `INT`         | `FOREIGN KEY (users.id) ON DELETE CASCADE`    | User who ran the analysis                   |
| `resume_id`       | `INT`         | `FOREIGN KEY (resumes.id) ON DELETE SET NULL` | Resume evaluated                            |
| `job_id`          | `INT`         | `FOREIGN KEY (jobs.id) ON DELETE SET NULL`    | Optional job template evaluated             |
| `job_title`       | `VARCHAR(150)`| -                                             | Evaluated job title                         |
| `job_description` | `TEXT`        | -                                             | Evaluated job description text              |
| `overall_score`   | `INT`         | `CHECK (0..100)`                              | Final AI match score predicted by GBR model |
| `ats_score`       | `INT`         | `CHECK (0..100)`                              | ATS keyword & structural format score       |
| `skills_score`    | `INT`         | `CHECK (0..100)`                              | Skills coverage ratio score                 |
| `experience_score`| `INT`         | `CHECK (0..100)`                              | Experience alignment score                  |
| `education_score` | `INT`         | `CHECK (0..100)`                              | Academic qualification score                |
| `status`          | `VARCHAR(50)` | `DEFAULT 'COMPLETED'`                         | Status flag                                 |


# 5. skills
Lookup dictionary of technical skills.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `SERIAL` | `PRIMARY KEY` | Unique skill identifier |
| `name` | `VARCHAR(100)` | `UNIQUE`, `NOT NULL` | Skill name (e.g. `Python`, `React`) |
| `category` | `VARCHAR(50)` | `DEFAULT 'General'` | Skill classification |


# 6. analysis_skills (Junction Table)
Links analysis records to skills, indicating matched vs missing status.

| Column        | Type           | Constraints                                   | Description                                       |
|--------       |------          |-------------                                  |-------------                                      |
| `id`          | `SERIAL`       | `PRIMARY KEY`                                 | Unique entry identifier                           |
| `analysis_id` | `INT`          | `FOREIGN KEY (analyses.id) ON DELETE CASCADE` | Analysis report ID                                |
| `skill_id`    | `INT`          | `FOREIGN KEY (skills.id) ON DELETE CASCADE`   | Skill ID                                          |
| `match_status`| `ENUM`         | `'MATCHED'                                    | 'MISSING'` | Whether skill was present or missing |
| `confidence`  | `NUMERIC(4,2)` | `DEFAULT 1.00`                                | Match confidence rating                           |


### 7. recommendations
Stores prioritized improvement suggestions generated for an analysis.

| Column           | Type          | Constraints                                   | Description                        |
|--------          |------         |-------------                                  |-------------                       |
| `id`             | `SERIAL`      | `PRIMARY KEY`                                 | Unique recommendation identifier   |
| `analysis_id`    | `INT`         | `FOREIGN KEY (analyses.id) ON DELETE CASCADE` | Analysis report ID                 |
| `recommendation` | `TEXT`        | `NOT NULL`                                    | Advice text                        |
| `priority`       | `VARCHAR(20)` | `DEFAULT 'MEDIUM'`                            | Priority (`HIGH`, `MEDIUM`, `LOW`) |
| `category`       | `VARCHAR(50)` | `DEFAULT 'General'`                           | Category classification            |
