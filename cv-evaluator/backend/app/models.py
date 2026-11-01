import datetime
from sqlalchemy import Column, Integer, String, Boolean, Float, Text, DateTime, JSON
from app.database import Base

class EvaluationRecord(Base):
    __tablename__ = "evaluations"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    
    candidate_name = Column(String(255), nullable=True)
    target_role = Column(String(100), nullable=False)
    
    # Legitimacy check
    is_legitimate = Column(Boolean, default=False)
    legitimacy_score = Column(Float, default=0.0)
    legitimacy_reasons = Column(JSON, default=list) # e.g. ["Missing contact info", "No experience section"]
    
    # Predefined dataset scoring
    predefined_score = Column(Float, default=0.0) # 0 to 100
    matched_skills = Column(JSON, default=list)
    missing_skills = Column(JSON, default=list)
    rubric_breakdown = Column(JSON, default=dict)
    
    # AI evaluation
    ai_evaluated = Column(Boolean, default=False)
    ai_score = Column(Float, nullable=True)
    ai_summary = Column(Text, nullable=True)
    ai_strengths = Column(JSON, default=list)
    ai_weaknesses = Column(JSON, default=list)
    ai_improvement_tips = Column(JSON, default=list)
    
    raw_text_snippet = Column(Text, nullable=True)
