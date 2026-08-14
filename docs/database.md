# Database Schema Specification

## PostgreSQL Entity Relationship (ER) Summary

- `users`: Stores candidate user accounts with hashed credentials (`bcrypt`).
- `resumes`: Stores uploaded PDF/DOCX file paths and extracted text strings linked to candidates.
- `jobs`: Stores target job description templates with required skills array and experience parameters.
- `analyses`: Core evaluation record linking candidate resume + job description + 5 sub-scores (`overall`, `ats`, `skills`, `experience`, `education`).
- `skills`: Tech skill lookup repository.
- `analysis_skills`: Junction table indicating whether each skill was `MATCHED` or `MISSING`.
- `recommendations`: Actionable feedback list tied to specific analysis records.

## Indexes & Performance Optimization
- `idx_users_email`: B-tree index on user email.
- `idx_resumes_user`: Index for fast user resume lookup.
- `idx_analyses_user`: Indexing for quick personal analysis history queries.
