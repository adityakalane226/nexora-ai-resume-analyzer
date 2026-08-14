import os
from fastapi import APIRouter, HTTPException, status
from app.schemas.analysis import (
    AnalysisRequest, AnalysisResponse, ScoreBreakdown, RecommendationItem
)
from app.services.ml_service import MLAnalyzerService

router = APIRouter(prefix="/api/v1", tags=["Analysis"])

model_path = os.path.join(
    os.path.dirname(__file__), "..", "..", "models", "resume_score_model.joblib"
)
analyzer_service = MLAnalyzerService(model_path=model_path)

@router.post("/analyze", response_model=AnalysisResponse, status_code=status.HTTP_200_OK)
def analyze_resume(request: AnalysisRequest):
    """
    Deep AI Resume Analysis Endpoint.
    Runs TF-IDF similarity, skill gap analysis, section detection, content quality
    signals, and produces up to 12 prioritized recommendations across 8 categories.
    """
    try:
        result = analyzer_service.analyze(
            resume_text     = request.resume_text,
            job_description = request.job_description,
            explicit_skills = request.required_skills
        )

        return AnalysisResponse(
            success = True,
            score   = ScoreBreakdown(
                overall    = result["overall_score"],
                ats        = result["ats_score"],
                skills     = result["skills_score"],
                experience = result["experience_score"],
                education  = result["education_score"],
            ),
            matched_skills           = result["matched_skills"],
            missing_skills           = result["missing_skills"],
            recommendations          = result["recommendations"],
            recommendations_detailed = [
                RecommendationItem(**r)
                for r in result.get("recommendations_detailed", [])
            ],
            detailed_analysis = result.get("detailed_analysis", {}),
            model_version     = "2.0.0"
        )
    except Exception as e:
        raise HTTPException(
            status_code = status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail      = f"Analysis processing error: {str(e)}"
        )
