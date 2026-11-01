import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, Header, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import EvaluationRecord
from app.schemas import (
    EvaluationResponse,
    RoleInfo,
    HistoryItem,
    LegitimacyDetails,
    PredefinedRoleEvaluation,
    AiEvaluationDetails
)
from app.services.parser import extract_text_from_bytes
from app.services.legitimacy_checker import evaluate_legitimacy
from app.services.role_dataset import load_roles_criteria, evaluate_against_role
from app.services.ai_evaluator import evaluate_with_ai

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["Evaluation"])

@router.get("/")
@router.post("/")
def api_root():
    """Root API handler — silences Swarm ingress health probes."""
    return {"status": "ok", "message": "CV Evaluator API"}

@router.get("/roles", response_model=List[RoleInfo])
def get_available_roles():
    criteria = load_roles_criteria()
    roles = []
    for role_id, role in criteria.items():
        roles.append(RoleInfo(
            id=role["id"],
            title=role["title"],
            description=role["description"],
            core_skills=role.get("core_skills", []),
            frameworks_and_tools=role.get("frameworks_and_tools", []),
            concepts_and_methodologies=role.get("concepts_and_methodologies", []),
            bonus_skills=role.get("bonus_skills", [])
        ))
    return roles

async def process_cv_evaluation(
    raw_text: str,
    candidate_name: Optional[str],
    target_role: str,
    api_key: Optional[str],
    provider: Optional[str],
    db: Session
) -> EvaluationResponse:
    # 1. Legitimacy check
    legitimacy_data = evaluate_legitimacy(raw_text)
    is_legitimate = legitimacy_data["is_legitimate"]
    
    predefined_res = None
    ai_res = None
    
    # 2. If legitimate, run predefined role evaluation
    if is_legitimate:
        try:
            predefined_dict = evaluate_against_role(raw_text, target_role)
            predefined_res = PredefinedRoleEvaluation(**predefined_dict)
            
            # 3. If passed checks for a legitimate CV, evaluate via AI model
            ai_dict = await evaluate_with_ai(
                cv_text=raw_text,
                role_title=predefined_dict["role_title"],
                predefined_info=predefined_dict,
                api_key=api_key,
                provider=provider
            )
            ai_res = AiEvaluationDetails(**ai_dict)
        except Exception as e:
            logger.error(f"Error during role/ai evaluation: {e}")
            raise HTTPException(status_code=400, detail=str(e))
    else:
        # Not legitimate: skip AI evaluation as required
        ai_res = AiEvaluationDetails(
            status="skipped",
            error_message="Document did not pass the legitimate CV check. AI evaluation was skipped."
        )

    # 4. Save to Database
    record = EvaluationRecord(
        candidate_name=candidate_name,
        target_role=target_role,
        is_legitimate=is_legitimate,
        legitimacy_score=legitimacy_data["score"],
        legitimacy_reasons=legitimacy_data["notes"],
        predefined_score=predefined_res.total_score if predefined_res else 0.0,
        matched_skills=(predefined_res.core_skills_matched + predefined_res.tools_matched) if predefined_res else [],
        missing_skills=(predefined_res.core_skills_missing + predefined_res.tools_missing) if predefined_res else [],
        rubric_breakdown=predefined_res.breakdown_percentages if predefined_res else {},
        ai_evaluated=(ai_res.status == "completed") if ai_res else False,
        ai_score=ai_res.ai_score if ai_res else None,
        ai_summary=ai_res.summary if ai_res else None,
        ai_strengths=ai_res.strengths if ai_res else [],
        ai_weaknesses=ai_res.weaknesses if ai_res else [],
        ai_improvement_tips=ai_res.improvement_recommendations if ai_res else [],
        raw_text_snippet=raw_text[:500]
    )
    
    try:
        db.add(record)
        db.commit()
        db.refresh(record)
        record_id = record.id
        created_at = record.created_at
    except Exception as e:
        logger.warning(f"Could not save record to database: {e}")
        db.rollback()
        record_id = None
        created_at = None

    return EvaluationResponse(
        id=record_id,
        created_at=created_at,
        candidate_name=candidate_name,
        target_role=target_role,
        legitimacy=LegitimacyDetails(**legitimacy_data),
        predefined_evaluation=predefined_res,
        ai_evaluation=ai_res
    )

@router.post("/evaluate/upload", response_model=EvaluationResponse)
async def evaluate_cv_upload(
    file: UploadFile = File(...),
    target_role: str = Form("software_development"),
    api_key: Optional[str] = Form(None),
    provider: Optional[str] = Form(None),
    x_ai_api_key: Optional[str] = Header(None, alias="X-AI-API-Key"),
    db: Session = Depends(get_db)
):
    effective_key = api_key or x_ai_api_key
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
        
    text, candidate_name = extract_text_from_bytes(file.filename, content)
    if not text.strip():
        raise HTTPException(status_code=400, detail="Could not extract readable text from the uploaded file.")
        
    return await process_cv_evaluation(
        raw_text=text,
        candidate_name=candidate_name,
        target_role=target_role,
        api_key=effective_key,
        provider=provider,
        db=db
    )

@router.post("/evaluate/text", response_model=EvaluationResponse)
async def evaluate_cv_text(
    payload: dict,
    x_ai_api_key: Optional[str] = Header(None, alias="X-AI-API-Key"),
    db: Session = Depends(get_db)
):
    raw_text = payload.get("text", "").strip()
    target_role = payload.get("target_role", "software_development")
    api_key = payload.get("api_key") or x_ai_api_key
    provider = payload.get("provider")
    candidate_name = payload.get("candidate_name")

    if not raw_text:
        raise HTTPException(status_code=400, detail="CV text cannot be empty.")

    return await process_cv_evaluation(
        raw_text=raw_text,
        candidate_name=candidate_name,
        target_role=target_role,
        api_key=api_key,
        provider=provider,
        db=db
    )

@router.get("/history", response_model=List[HistoryItem])
def get_evaluation_history(limit: int = 20, db: Session = Depends(get_db)):
    records = db.query(EvaluationRecord).order_by(EvaluationRecord.created_at.desc()).limit(limit).all()
    history = []
    for r in records:
        history.append(HistoryItem(
            id=r.id,
            created_at=r.created_at,
            candidate_name=r.candidate_name,
            target_role=r.target_role,
            is_legitimate=r.is_legitimate,
            predefined_score=r.predefined_score,
            ai_evaluated=r.ai_evaluated,
            ai_score=r.ai_score
        ))
    return history

@router.get("/history/{evaluation_id}")
def get_evaluation_details(evaluation_id: int, db: Session = Depends(get_db)):
    record = db.query(EvaluationRecord).filter(EvaluationRecord.id == evaluation_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Evaluation record not found.")
    return record
