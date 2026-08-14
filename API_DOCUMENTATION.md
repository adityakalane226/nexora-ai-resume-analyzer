# Nexora API Documentation

Complete REST API reference for the Nexora AI Resume Analyzer application.


# Base URLs

- Express Node.js Backend: `http://localhost:5000/api`
- FastAPI Python ML Service: `http://localhost:8000/api/v1`


# Authentication Header

Protected endpoints require a JWT Bearer token passed in the HTTP Authorization header:
http
Authorization: Bearer <your_jwt_token_here>



# 1. Authentication Endpoints (`/api/auth`)

### 1.1 User Registration
- **Method**: `POST`
- **Path**: `/api/auth/register`
- **Auth Required**: No
- **Request Body**:
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "securepassword123"
}
```
- **Response** `(201 Created)`:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsIn...",
    "user": {
      "id": 1,
      "name": "Jane Doe",
      "email": "jane@example.com",
      "created_at": "2026-08-14T10:00:00Z"
    }
  }
}
```

### 1.2 User Login
- **Method**: `POST`
- **Path**: `/api/auth/login`
- **Auth Required**: No
- **Request Body**:
```json
{
  "email": "jane@example.com",
  "password": "securepassword123"
}
```
- **Response** `(200 OK)`:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsIn...",
    "user": {
      "id": 1,
      "name": "Jane Doe",
      "email": "jane@example.com"
    }
  }
}
```

### 1.3 Get Current User Profile
- **Method**: `GET`
- **Path**: `/api/auth/me`
- **Auth Required**: Yes (`Bearer <token>`)
- **Response** `(200 OK)`:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "name": "Jane Doe",
      "email": "jane@example.com",
      "created_at": "2026-08-14T10:00:00Z"
    }
  }
}
```

---

## 2. Resume Endpoints (`/api/resumes`)

### 2.1 Upload Resume File
- **Method**: `POST`
- **Path**: `/api/resumes/upload`
- **Auth Required**: Yes (`Bearer <token>`)
- **Content-Type**: `multipart/form-data`
- **Form Data**:
  - `resume`: File (`.pdf` or `.docx`, max 5MB)
- **Response** `(201 Created)`:
```json
{
  "success": true,
  "message": "Resume uploaded and text extracted successfully",
  "data": {
    "resume": {
      "id": 5,
      "user_id": 1,
      "file_name": "Jane_Doe_Resume.pdf",
      "file_type": "pdf",
      "extracted_text_length": 1420,
      "created_at": "2026-08-14T10:15:00Z"
    }
  }
}
```

### 2.2 List User Resumes
- **Method**: `GET`
- **Path**: `/api/resumes`
- **Auth Required**: Yes
- **Response** `(200 OK)`:
```json
{
  "success": true,
  "data": {
    "resumes": [
      {
        "id": 5,
        "file_name": "Jane_Doe_Resume.pdf",
        "file_type": "pdf",
        "extracted_text": "Experienced Full Stack Developer...",
        "created_at": "2026-08-14T10:15:00Z"
      }
    ]
  }
}
```

### 2.3 Delete Resume
- **Method**: `DELETE`
- **Path**: `/api/resumes/:id`
- **Auth Required**: Yes
- **Response** `(200 OK)`:
```json
{
  "success": true,
  "message": "Resume deleted successfully"
}
```

---

## 3. Job Endpoints (`/api/jobs`)

### 3.1 List Job Templates
- **Method**: `GET`
- **Path**: `/api/jobs`
- **Auth Required**: Yes
- **Response** `(200 OK)`:
```json
{
  "success": true,
  "data": {
    "jobs": [
      {
        "id": 1,
        "title": "Full Stack Software Engineer",
        "company": "TechCorp Solutions",
        "description": "Looking for a Full Stack Engineer proficient in React, Node.js...",
        "required_skills": ["React", "Node.js", "PostgreSQL", "Docker"],
        "experience_years": 3
      }
    ]
  }
}
```

---

## 4. Analysis Endpoints (`/api/analyses`)

### 4.1 Run AI Resume Analysis
- **Method**: `POST`
- **Path**: `/api/analyses`
- **Auth Required**: Yes
- **Request Body** (Using Job Template):
```json
{
  "resumeId": 5,
  "jobId": 1
}
```
- **Request Body** (Using Custom Pasted Job Description):
```json
{
  "resumeId": 5,
  "jobTitle": "Senior Backend Developer",
  "jobDescription": "We need a Python developer with 3+ years experience in FastAPI, PostgreSQL..."
}
```
- **Response** `(201 Created)`:
```json
{
  "success": true,
  "message": "Resume analysis completed successfully",
  "data": {
    "analysisId": 12,
    "score": {
      "overall": 78,
      "ats": 82,
      "skills": 74,
      "experience": 70,
      "education": 90
    },
    "matched_skills": ["Python", "PostgreSQL", "REST API"],
    "missing_skills": ["FastAPI", "Docker", "Redis"],
    "recommendations": [
      "Add missing technical skills: FastAPI, Docker, Redis.",
      "Quantify bullet points with metrics (e.g. % improvements)."
    ],
    "jobTitle": "Senior Backend Developer",
    "createdAt": "2026-08-14T10:30:00Z"
  }
}
```

### 4.2 Get Analysis History
- **Method**: `GET`
- **Path**: `/api/analyses`
- **Auth Required**: Yes
- **Response** `(200 OK)`: Returns array of past candidate analysis records.

### 4.3 Get Detailed Analysis Report
- **Method**: `GET`
- **Path**: `/api/analyses/:id`
- **Auth Required**: Yes
- **Response** `(200 OK)`: Returns full breakdown, matched/missing skills, metrics, and prioritized recommendations.

### 4.4 Get Dashboard Statistics
- **Method**: `GET`
- **Path**: `/api/analyses/stats`
- **Auth Required**: Yes
- **Response** `(200 OK)`:
```json
{
  "success": true,
  "data": {
    "totalAnalyses": 12,
    "averageScore": 68.5,
    "bestScore": 89,
    "recentAnalyses": [...]
  }
}
```

---

## 5. FastAPI Python ML Service Endpoints (`:8000`)

### 5.1 Service Health Check
- **Method**: `GET`
- **Path**: `/health`
- **Response** `(200 OK)`:
```json
{
  "status": "healthy",
  "model_loaded": true,
  "version": "2.0.0"
}
```

### 5.2 Microservice Inference Endpoint
- **Method**: `POST`
- **Path**: `/api/v1/analyze`
- **Request Body**:
```json
{
  "resume_text": "Full stack developer with 3 years experience...",
  "job_description": "Looking for React Node.js engineer...",
  "required_skills": ["React", "Node.js"]
}
```
- **Response** `(200 OK)`: Returns score breakdown, skill arrays, content quality metrics, and categorized recommendations.
