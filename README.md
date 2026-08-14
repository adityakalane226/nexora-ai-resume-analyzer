# Nexora — AI Resume Analyzer

A full-stack, enterprise-grade AI-powered resume analysis and candidate intelligence platform. Nexora evaluates candidate resumes against target job descriptions using a trained Machine Learning model (Gradient Boosting Regressor) combined with natural language processing (NLP) feature extraction.

---

## 📌 Project Overview

Nexora is designed to help job seekers, students, and professionals optimize their resumes specifically for target job descriptions. The system parses uploaded resumes (PDF / DOCX), extracts key sections, detects technical skills, evaluates experience and education alignment, computes ATS-compatibility metrics, and generates match scores with categorized, prioritized recommendations.

### Core Goals:
- **Objective Fit Evaluation**: Determine candidate compatibility with specific job postings using an ML regressor trained on 9,500+ candidate-job pairs.
- **Actionable Gap Analysis**: Identify missing technical skills, keyword mismatches, experience duration gaps, and section deficiencies.
- **ATS Visibility**: Score resume readability, keyword mirroring, action verb density, and metric quantification to maximize ATS visibility.
- **Candidate-Centric Experience**: Provide an intuitive, modern dashboard with interactive reports, score visualizations, and analysis history.

---

## ✨ Key Features & Functionality

### 1. 🔐 User Authentication & Session Management
- Secure user registration and login with bcrypt password hashing (10 salt rounds).
- Stateless JWT-based authentication with expiration handling and protected API/Route middleware.
- Dedicated user dashboard displaying lifetime stats, latest analysis scores, and recent activity.

### 2. 📄 Resume Upload & Document Parsing
- Multi-format document ingestion supporting **PDF** (`pdf-parse`) and **DOCX** (`mammoth`).
- In-memory/disk buffer handling via Multer with MIME-type and size validation (up to 10MB).
- Text extraction pipeline normalizing characters, handling multi-column layouts, and preserving section flow.
- Saved resume repository allowing candidates to reuse existing uploaded resumes across multiple job analyses.

### 3. 🎯 Job Description Ingestion & Customization
- Built-in job role templates with pre-defined skills and descriptions.
- Custom job description input: candidates can paste any real-world job posting text.
- Automated extraction of required skills, experience thresholds, and education levels directly from JD text.

### 4. 🤖 AI / ML Match Engine & Scoring
- **Gradient Boosting Regressor (GBR)**: Trained on 9,544 pairs to predict overall fit based on semantic similarity, skill overlap, and text length ratios.
- **Detailed Sub-Scores (0–100)**:
  - **Overall Match Score**: Predictive candidate fit score derived from ML inference or weighted NLP fallback.
  - **ATS Compatibility Score**: Evaluates vocabulary alignment, JD key phrase mirroring, and optimal word length (200–1200 words).
  - **Skills Match Score**: Quantitative intersection of candidate skills vs. JD required skills.
  - **Experience Alignment Score**: Compares detected candidate experience duration against JD requirements (supports entry-level / fresh graduate roles with 0 years baseline).
  - **Education Score**: Analyzes degree hierarchy (Bachelor's, Master's, PhD) vs. job qualifications.

### 5. 💡 Prioritized & Categorized Recommendations
- Generates categorized action items classified by priority (`HIGH`, `MEDIUM`, `LOW`):
  - **Job Skill Gap**: Explicit missing tools and technologies required by the role.
  - **JD Keyword Alignment**: Missing domain terms and low semantic similarity warnings.
  - **Experience Alignment**: Guidance on bridging experience duration or highlighting academic projects.
  - **ATS & Formatting**: Word count warnings and section completeness checks.
  - **Impact & Metrics**: Prompts to quantify achievements with numbers, percentages, and metrics.
  - **Profile Summary & Contact Info**: Flags missing summary headers, email, or LinkedIn profiles.

### 6. 📊 Analytics, History & Reports
- Interactive score dials and progress bars with color-coded qualification badges.
- Matched vs. Missing skill badge grids.
- Historical analysis records with instant report reload and PDF print capability.

---

## ⚙️ Tech Stack & System Architecture

| Tier | Technology | Purpose |
|------|-----------|---------|
| **Frontend** | React 18, Vite, React Router 6, Axios, Vanilla CSS | Fast, responsive single-page candidate application |
| **Backend** | Node.js 18+, Express 5, JWT, Multer, pg | REST API server, authentication, text parsing, database transactions |
| **Database** | PostgreSQL 14+ | Relational persistence for users, resumes, analyses, skills, and recommendations |
| **ML Microservice** | Python 3.10+, FastAPI, Uvicorn, scikit-learn, joblib | Microservice for TF-IDF vectorization, feature extraction, and ML model inference |
| **ML Model** | Gradient Boosting Regressor (`resume_score_model.joblib`) | Pre-trained regression model evaluated on 9,544 dataset pairs (R² = 0.42, MAE = 9.82 pts) |

---

## 📌 Assumptions & Design Decisions

1. **Candidate-Focused Architecture**:
   - The platform is purposefully architected as a candidate self-service tool. Recruiter/admin functionalities are intentionally omitted to maintain a clean, candidate-first experience.
2. **Deterministic & Model-Driven Scores**:
   - All scores and feedback are mathematically derived from the trained Gradient Boosting model and NLP algorithms. No mock AI or randomized score generation is used.
3. **Graceful Degradation / Fallback**:
   - If the ML model binary is missing or cannot be loaded, the microservice automatically falls back to an algorithmic weighted scoring formula without failing user requests.
4. **Document Language & Format**:
   - Assumes English-language resumes and job descriptions.
   - Text parsing works on selectable text PDFs. Scanned / image-only PDFs require OCR before processing.
5. **Entry-Level & Fresh Graduate Handling**:
   - Roles specifying "fresh graduate", "trainee", "entry-level", or "0-1 year" baseline require 0 years of experience, ensuring qualified freshers receive fair experience alignment scores (90+).

---

## 📁 Repository Structure

```
Nexora_ai_resume_analyzer/
├── frontend/                  # React 18 + Vite frontend application
│   ├── src/
│   │   ├── components/        # Navigation, ProtectedLayout, Sidebar
│   │   ├── context/           # AuthContext (JWT auth state)
│   │   ├── pages/             # Login, Register, Dashboard, Analyze, Result, History, Resumes
│   │   ├── services/          # Axios API client
│   │   ├── App.jsx            # Application routes
│   │   └── main.jsx           # Entry point
│   ├── index.html
│   ├── vite.config.js         # Proxy configuration (/api → backend)
│   └── package.json
│
├── backend/                   # Node.js + Express REST API
│   ├── src/
│   │   ├── config/            # PostgreSQL connection pool (db.js)
│   │   ├── controllers/       # Auth, Resume, Job, Analysis controllers
│   │   ├── middleware/        # JWT auth verify, Multer upload, Error handler
│   │   ├── models/            # Data Access Layer (User, Resume, Job, Analysis models)
│   │   ├── routes/            # Express route routers
│   │   ├── services/          # Document text extractors & ML HTTP client
│   │   └── app.js             # Express application initialization
│   ├── uploads/               # Temporary resume file storage
│   ├── .env.example           # Backend environment template
│   └── package.json
│
├── ml-service/                # Python FastAPI AI microservice
│   ├── app/
│   │   ├── routes/            # POST /api/v1/analyze route
│   │   ├── schemas/           # Pydantic request/response schemas
│   │   ├── services/          # MLAnalyzerService & Pipeline wrapper
│   │   └── main.py            # FastAPI entry point
│   ├── models/                # resume_score_model.joblib binary
│   └── requirements.txt       # Python dependencies
│
├── ml-model/                  # Model training & notebook artifacts
│   ├── datasets/              # 17MB ranking dataset (9,544 rows)
│   ├── models/                # Serialized model export
│   ├── train_user_dataset.py  # Model training & evaluation script
│   └── resume_scoring_model_pipeline.ipynb # Master Jupyter notebook
│
├── database/                  # PostgreSQL SQL scripts
│   ├── schema.sql             # Table schemas, constraints, and indexes
│   └── seed.sql               # Starter job templates and taxonomy
│
├── docs/                      # Subsystem documentation
│   ├── architecture.md
│   ├── api.md
│   ├── database.md
│   ├── ml-model.md
│   └── evaluation.md
│
├── API_DOCUMENTATION.md       # Complete REST API endpoint reference
├── DATABASE_SCHEMA.md         # Database schema with Mermaid ER diagram
├── ML_EVALUATION_REPORT.md    # Real ML model performance evaluation report
├── LIMITATIONS_AND_ENHANCEMENTS.md # Known limitations & future roadmap
├── .gitignore
└── README.md
```

---

## 📋 Prerequisites

Ensure the following runtimes and tools are installed on your development system:

- **Node.js**: v18.0.0 or higher (`node -v`)
- **Python**: v3.10.0 or higher (`python --version`)
- **PostgreSQL**: v14.0 or higher (`psql --version`)
- **Git**: `git --version`

---

## 🚀 Setup & Execution Guide

### Step 1: Clone the Repository

```bash
git clone https://github.com/adityakalane226/sl2.git
cd sl2
```

---

### Step 2: Database Setup (PostgreSQL)

#### Option A: Using pgAdmin 4 (GUI)
1. Open **pgAdmin 4** and connect to your local PostgreSQL server.
2. Create a new database named **`nexora_resume_db`**.
3. Open the **Query Tool** on `nexora_resume_db`.
4. Open and execute [`database/schema.sql`](database/schema.sql) (Press `F5`).
5. Open and execute [`database/seed.sql`](database/seed.sql) (Press `F5`).

#### Option B: Using psql CLI
```bash
psql -U postgres -c "CREATE DATABASE nexora_resume_db;"
psql -U postgres -d nexora_resume_db -f database/schema.sql
psql -U postgres -d nexora_resume_db -f database/seed.sql
```

---

### Step 3: Configure Environment Variables

#### Backend (`backend/.env`):
Create `backend/.env` based on `backend/.env.example`:
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=nexora_super_secret_jwt_key_2026
JWT_EXPIRES_IN=7d

DB_HOST=localhost
DB_PORT=5432
DB_NAME=nexora_resume_db
DB_USER=postgres
DB_PASSWORD=your_postgres_password

ML_SERVICE_URL=http://localhost:8000
CLIENT_URL=http://localhost:5173
```

#### Frontend (`frontend/.env`):
In development, Vite proxies requests via `vite.config.js`. Leave `VITE_API_URL` empty or set:
```env
VITE_API_URL=
```

---

### Step 4: Install Dependencies & Run Services

Open **3 separate terminal windows** to run the 3 tiers:

#### 🪟 Terminal 1 — Python FastAPI ML Microservice
```bash
cd ml-service
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
- **ML Service URL**: `http://localhost:8000`
- **Interactive Swagger Docs**: `http://localhost:8000/docs`
- **Health Check**: `http://localhost:8000/health`

#### 🪟 Terminal 2 — Node.js Express Backend
```bash
cd backend
npm install
npm run dev
```
- **Backend API URL**: `http://localhost:5000`
- **Health Check**: `http://localhost:5000/api/health`

#### 🪟 Terminal 3 — React Frontend (Vite)
```bash
cd frontend
npm install
npm run dev
```
- **Web Application URL**: **`http://localhost:5173`**

---

## 🧪 Model Training & Retraining

To train the machine learning models or retrain with updated candidate-job pairs:

```bash
cd ml-model
python train_user_dataset.py
```

The script automatically:
1. Loads `ml-model/datasets/resume_data_for_ranking.csv` (9,544 rows).
2. Performs TF-IDF text vectorization and feature matrix construction.
3. Evaluates Ridge Regression, Random Forest, and Gradient Boosting Regressor across 5-fold cross-validation.
4. Selects the winning model and exports the serialized pipeline (`resume_score_model.joblib`) directly into `ml-service/models/`.

---

## 📊 Evaluation Summary

From actual benchmark runs on 9,544 samples (80% train / 20% test split):

| Model | MAE (Mean Absolute Error) | RMSE | Test R² | 5-Fold CV R² | Selected |
|-------|--------------------------|------|---------|--------------|:--------:|
| Ridge Regression | 11.68 pts | 14.77 pts | 0.2112 | 0.1954 ± 0.0079 | ❌ |
| Random Forest | 9.88 pts | 12.95 pts | 0.3940 | 0.3360 ± 0.0102 | ❌ |
| **Gradient Boosting Regressor (GBR)** | **9.82 pts** | **12.69 pts** | **0.4174** | **0.3657 ± 0.0074** | **✅ Winner** |

- **60.1%** of all test predictions are within **±10 points** of true match score.
- **79.2%** of all test predictions are within **±15 points**.
- **Model Bias**: −0.009 points (near zero systematic error).

Full details are documented in [`ML_EVALUATION_REPORT.md`](ML_EVALUATION_REPORT.md).

---

## 📚 Complete Documentation Index

| Document | Content Description |
|----------|---------------------|
| [**DATABASE_SCHEMA.md**](DATABASE_SCHEMA.md) | Complete PostgreSQL table definitions, data types, constraints, and Mermaid ER diagram |
| [**API_DOCUMENTATION.md**](API_DOCUMENTATION.md) | Complete REST API endpoint reference with sample requests, responses, and status codes |
| [**ML_EVALUATION_REPORT.md**](ML_EVALUATION_REPORT.md) | In-depth ML model performance report, metrics breakdown, feature importances, and error distributions |
| [**LIMITATIONS_AND_ENHANCEMENTS.md**](LIMITATIONS_AND_ENHANCEMENTS.md) | Known system limitations, technical trade-offs, and future enhancement roadmap |

---

## 📄 License

This project is licensed under the **MIT License**.
