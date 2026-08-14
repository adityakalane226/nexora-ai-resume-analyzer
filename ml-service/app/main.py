from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from app.routes.analysis_routes import router as analysis_router, analyzer_service

app = FastAPI(
    title="Nexora AI Resume Analyzer ML Microservice",
    description="FastAPI service for resume scoring, TF-IDF feature extraction, and skill gap identification.",
    version="1.0.0"
)

# enable cors for node.js express backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# register api routers
app.include_router(analysis_router)

@app.get("/", status_code=status.HTTP_200_OK)
def root():
    """root welcome endpoint"""
    return {
        "status": "online",
        "service": "Nexora AI Resume Analyzer ML Microservice",
        "model_loaded": analyzer_service.model is not None,
        "docs_url": "/docs",
        "health_url": "/health"
    }

@app.get("/health", status_code=status.HTTP_200_OK)
def health_check():
    """microservice health & model status endpoint"""
    return {
        "status": "online",
        "service": "FastAPI ML Inference Service",
        "model_loaded": analyzer_service.model is not None,
        "version": "1.0.0"
    }
