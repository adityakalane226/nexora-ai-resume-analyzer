from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class AnalysisRequest(BaseModel):
    resume_text:     str            = Field(..., min_length=20)
    job_description: str            = Field(..., min_length=20)
    required_skills: Optional[List[str]] = Field(default=[])

class ScoreBreakdown(BaseModel):
    overall:    int = Field(..., ge=0, le=100)
    ats:        int = Field(..., ge=0, le=100)
    skills:     int = Field(..., ge=0, le=100)
    experience: int = Field(..., ge=0, le=100)
    education:  int = Field(..., ge=0, le=100)

class RecommendationItem(BaseModel):
    text:     str
    priority: str   # high | medium | low
    category: str   # skill gap | ats optimization | content & formatting | ...

class AnalysisResponse(BaseModel):
    success:                  bool
    score:                    ScoreBreakdown
    matched_skills:           List[str]
    missing_skills:           List[str]
    recommendations:          List[str]               # plain list for backward compat
    recommendations_detailed: List[RecommendationItem]
    detailed_analysis:        Dict[str, Any]
    model_version:            str = "2.0.0"
