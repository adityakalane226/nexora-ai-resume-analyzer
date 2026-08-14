# REST API Documentation

## Authentication Endpoints (`/api/auth`)
- `POST /api/auth/register`: Register new user account.
- `POST /api/auth/login`: Authenticate credentials, return JWT token.
- `GET /api/auth/me`: Get current authenticated user profile.

## Resume Endpoints (`/api/resumes`)
- `POST /api/resumes/upload`: Upload PDF/DOCX resume file & perform text extraction.
- `GET /api/resumes`: Fetch user's uploaded resumes.

## Job Template Endpoints (`/api/jobs`)
- `GET /api/jobs`: List target job description templates.
- `GET /api/jobs/:id`: Fetch specific target job template details.

## Analysis Endpoints (`/api/analyses`)
- `POST /api/analyses`: Trigger resume evaluation against job description (calls FastAPI ML service).
- `GET /api/analyses`: Retrieve personal analysis history.
- `GET /api/analyses/:id`: Detailed analysis report with breakdown and recommendations.

## FastAPI ML Service Endpoints (`:8000`)
- `GET /health`: Microservice health check.
- `POST /api/v1/analyze`: Accept text payload, compute TF-IDF similarity, matched skills, sub-scores, and recommendations.
