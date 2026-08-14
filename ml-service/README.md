# FastAPI Machine Learning Service

High-performance Python microservice serving resume analysis predictions and NLP text processing.

## Endpoints

- `GET /health`: Health check and model status.
- `POST /api/v1/analyze`: Core analysis endpoint accepting `resume_text`, `job_description`, and `required_skills`.

## Setup & Execution

```bash
# Create virtual environment
python -m venv venv

# Activate environment (Windows)
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start Uvicorn web server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
