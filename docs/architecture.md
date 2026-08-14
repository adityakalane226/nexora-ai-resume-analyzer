# System Architecture Specification

## Overview

The AI Resume Score Analyzer is built on a 4-tier micro-service architecture focused on candidate resume optimization:

```text
[ Client Layer ]          React (Vite) SPA (Port 5173)
                                │ HTTP / JSON / Multipart
                                ▼
[ Gateway / API Layer ]   Node.js + Express (Port 5000)
                                │               │
            SQL Query (pg)      │               │ HTTP REST
                                ▼               ▼
[ Storage Layer ]         PostgreSQL (5432)   FastAPI ML Microservice (8000)
                                                │
                                                ▼
[ ML Model Layer ]                        scikit-learn (.joblib pipeline)
```

## Key Components

1. **Frontend**: Vite + React 18 SPA. Renders Candidate Dashboard, Resume Upload Form, Analysis Breakdown, History views, and ATS score displays.
2. **Backend**: Express REST API. Manages user authentication (JWT + bcrypt), file persistence (`multer`), resume text extraction (`pdf-parse`, `mammoth`), business logic, and orchestrates calls to the ML service.
3. **Database**: PostgreSQL 12+ relational database enforcing constraints, indexed queries, and cascade relationships across users, resumes, jobs, analyses, skills, and recommendations.
4. **ML Service**: Python FastAPI service hosting serialized `.joblib` pipelines for TF-IDF cosine similarity, skill feature extraction, sub-score logic, and recommendation generation.
