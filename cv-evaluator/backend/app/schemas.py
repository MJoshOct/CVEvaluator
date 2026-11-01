from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class RoleInfo(BaseModel):
    id: str
    title: str
    description: str
    core_skills: List[str]
    frameworks_and_tools: List[str]
    concepts_and_methodologies: List[str]
    bonus_skills: List[str]

class LegitimacyDetails(BaseModel):
    is_legitimate: bool
    score: float
    detected_sections: List[str]
    missing_sections: List[str]
    has_contact_info: bool
    word_count: int
    notes: List[str]

class PredefinedRoleEvaluation(BaseModel):
    role_id: str
    role_title: str
    total_score: float # 0 - 100
    core_skills_matched: List[str]
    core_skills_missing: List[str]
    tools_matched: List[str]
    tools_missing: List[str]
    concepts_matched: List[str]
    concepts_missing: List[str]
    experience_signals_found: List[str]
    breakdown_percentages: Dict[str, float]

class AiEvaluationDetails(BaseModel):
    status: str # "completed", "skipped", "error"
    error_message: Optional[str] = None
    ai_score: Optional[float] = None # 0 - 100
    summary: Optional[str] = None
    strengths: List[str] = []
    weaknesses: List[str] = []
    improvement_recommendations: List[str] = []
    suggested_project_ideas: List[str] = []
    suggested_bullet_rewrites: List[Dict[str, str]] = []

class EvaluationResponse(BaseModel):
    id: Optional[int] = None
    created_at: Optional[datetime] = None
    candidate_name: Optional[str] = None
    target_role: str
    legitimacy: LegitimacyDetails
    predefined_evaluation: Optional[PredefinedRoleEvaluation] = None
    ai_evaluation: Optional[AiEvaluationDetails] = None

class HistoryItem(BaseModel):
    id: int
    created_at: datetime
    candidate_name: Optional[str]
    target_role: str
    is_legitimate: bool
    predefined_score: float
    ai_evaluated: bool
    ai_score: Optional[float]
