import os
import logging
from typing import Dict, Any, Optional

from django.conf import settings
from django.db import connection
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import EvaluationRecord
from .serializers import (
    RoleInfoSerializer,
    EvaluationResponseSerializer,
    HistoryItemSerializer,
    JDMatchResponseSerializer,
    BulletRewriteResponseSerializer,
    InterviewPrepResponseSerializer,
)
from .services.parser import extract_text_from_bytes
from .services.legitimacy_checker import evaluate_legitimacy
from .services.ats_scorer import score_ats
from .services.resume_parser import parse_resume
from .services.role_dataset import load_roles_criteria, evaluate_against_role
from .services.keyword_analyzer import analyze_keywords
from .services.career_recommender import recommend_careers
from .services.ai_evaluator import (
    evaluate_with_ai,
    match_job_description,
    generate_bullets,
    generate_interview_questions,
)

logger = logging.getLogger(__name__)


def get_effective_api_key(request) -> str:
    key = (
        request.data.get("api_key")
        or request.headers.get("X-AI-API-Key")
        or getattr(settings, "AI_API_KEY", "")
    )
    return (key or "").strip()


def get_effective_provider(request) -> Optional[str]:
    provider = request.data.get("provider") or getattr(settings, "AI_PROVIDER", None)
    return provider.strip() if provider else None


def process_evaluation(
    raw_text: str,
    candidate_name: Optional[str],
    target_role: str,
    api_key: Optional[str],
    provider: Optional[str],
    file_ext: str = ".txt",
) -> Dict[str, Any]:
    # 1. Legitimacy check
    legitimacy_data = evaluate_legitimacy(raw_text)
    is_legitimate = legitimacy_data.get("is_legitimate", False)

    # 2. ATS Scorer
    ats_data = score_ats(raw_text, file_ext)

    # 3. Resume Parser
    parsed_data = parse_resume(raw_text)
    effective_name = candidate_name or parsed_data.get("name")

    predefined_res = None
    keywords_res = None
    career_recs = []
    ai_res = None

    if is_legitimate:
        # 4a. Role matching (predefined)
        try:
            predefined_res = evaluate_against_role(raw_text, target_role)
        except Exception as e:
            logger.error(f"Error during role evaluation: {e}")
            predefined_res = {
                "role_id": target_role,
                "role_title": target_role.replace("_", " ").title(),
                "total_score": 0.0,
                "core_skills_matched": [],
                "core_skills_missing": [],
                "tools_matched": [],
                "tools_missing": [],
                "concepts_matched": [],
                "concepts_missing": [],
                "experience_signals_found": [],
                "breakdown_percentages": {},
            }

        # 4b. Keyword analysis
        try:
            keywords_res = analyze_keywords(raw_text, target_role)
        except Exception as e:
            logger.error(f"Error during keyword analysis: {e}")
            keywords_res = None

        # 4c. Career recommendations (auto-run against all roles)
        try:
            career_recs = recommend_careers(raw_text)
        except Exception as e:
            logger.error(f"Error during career recommendations: {e}")
            career_recs = []

        # 4d. AI evaluation
        try:
            ai_res = evaluate_with_ai(
                cv_text=raw_text,
                role_title=predefined_res.get("role_title", target_role),
                predefined_info=predefined_res,
                api_key=api_key,
                provider=provider,
            )
        except Exception as e:
            logger.error(f"Error during AI evaluation: {e}")
            ai_res = {
                "status": "error",
                "error_message": str(e),
                "ai_score": None,
                "summary": None,
                "strengths": [],
                "weaknesses": [],
                "improvement_recommendations": [],
                "suggested_project_ideas": [],
                "suggested_bullet_rewrites": [],
            }
    else:
        ai_res = {
            "status": "skipped",
            "error_message": "Document did not pass the legitimate CV check. AI evaluation was skipped.",
            "ai_score": None,
            "summary": None,
            "strengths": [],
            "weaknesses": [],
            "improvement_recommendations": [],
            "suggested_project_ideas": [],
            "suggested_bullet_rewrites": [],
        }

    # 5. Save EvaluationRecord to DB
    record = EvaluationRecord(
        candidate_name=effective_name,
        target_role=target_role,
        is_legitimate=is_legitimate,
        legitimacy_score=legitimacy_data.get("score", 0.0),
        legitimacy_reasons=legitimacy_data.get("notes", []),
        ats_score=ats_data.get("ats_score"),
        ats_grade=ats_data.get("ats_grade"),
        ats_formatting_issues=ats_data.get("formatting_issues", []),
        ats_tips=ats_data.get("ats_tips", []),
        parsed_name=parsed_data.get("name"),
        parsed_email=parsed_data.get("email"),
        parsed_skills=parsed_data.get("skills", []),
        predefined_score=predefined_res.get("total_score", 0.0) if predefined_res else 0.0,
        matched_skills=(predefined_res.get("core_skills_matched", []) + predefined_res.get("tools_matched", [])) if predefined_res else [],
        missing_skills=(predefined_res.get("core_skills_missing", []) + predefined_res.get("tools_missing", [])) if predefined_res else [],
        rubric_breakdown=predefined_res.get("breakdown_percentages", {}) if predefined_res else {},
        keyword_score=keywords_res.get("keyword_score") if keywords_res else None,
        career_recommendations=career_recs,
        ai_evaluated=(ai_res.get("status") == "completed") if ai_res else False,
        ai_score=ai_res.get("ai_score") if ai_res else None,
        ai_summary=ai_res.get("summary") if ai_res else None,
        ai_strengths=ai_res.get("strengths", []) if ai_res else [],
        ai_weaknesses=ai_res.get("weaknesses", []) if ai_res else [],
        ai_improvement_tips=ai_res.get("improvement_recommendations", []) if ai_res else [],
        raw_text_snippet=raw_text[:500],
    )

    record_id = None
    created_at = timezone.now()
    try:
        record.save()
        record_id = record.id
        created_at = record.created_at
    except Exception as e:
        logger.warning(f"Could not persist EvaluationRecord to database: {e}")

    return {
        "id": record_id,
        "created_at": created_at,
        "candidate_name": effective_name,
        "target_role": target_role,
        "legitimacy": legitimacy_data,
        "ats": ats_data,
        "ats_report": ats_data,
        "parsed_resume": parsed_data,
        "keyword_analysis": keywords_res,
        "predefined_evaluation": predefined_res,
        "career_recommendations": career_recs,
        "ai_evaluation": ai_res,
    }


@api_view(["GET"])
def health_check(request):
    """Returns application status and database connectivity check."""
    db_status = "connected"
    try:
        connection.ensure_connection()
    except Exception as e:
        db_status = f"error: {str(e)}"
    return Response({"status": "ok", "database": db_status})


@api_view(["GET"])
def get_roles(request):
    """Reads roles_criteria.json and returns all configured job rubrics."""
    criteria = load_roles_criteria()
    roles = []
    for role_id, role in criteria.items():
        roles.append({
            "id": role["id"],
            "title": role["title"],
            "description": role["description"],
            "core_skills": role.get("core_skills", []),
            "frameworks_and_tools": role.get("frameworks_and_tools", []),
            "concepts_and_methodologies": role.get("concepts_and_methodologies", []),
            "bonus_skills": role.get("bonus_skills", []),
            "experience_signals": role.get("experience_signals", []),
        })
    return Response(roles)


@api_view(["POST"])
def evaluate_upload(request):
    """Handles CV upload evaluation (multipart/form-data)."""
    upload_file = request.FILES.get("file")
    if not upload_file:
        return Response(
            {"error": "No file uploaded. Please supply a file under the 'file' field."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    target_role = request.data.get("target_role", "software_development")
    api_key = get_effective_api_key(request)
    provider = get_effective_provider(request)

    file_bytes = upload_file.read()
    if not file_bytes:
        return Response(
            {"error": "Uploaded file is empty."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    text, inferred_name = extract_text_from_bytes(upload_file.name, file_bytes)
    if not text.strip():
        return Response(
            {"error": "Could not extract readable text from the uploaded file."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    _, ext = os.path.splitext(upload_file.name)
    file_ext = ext if ext else ".txt"
    candidate_name = request.data.get("candidate_name") or inferred_name

    try:
        res = process_evaluation(
            raw_text=text,
            candidate_name=candidate_name,
            target_role=target_role,
            api_key=api_key,
            provider=provider,
            file_ext=file_ext,
        )
        return Response(res)
    except Exception as e:
        logger.exception(f"Error during CV upload evaluation: {e}")
        return Response(
            {"error": f"Evaluation error: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
def evaluate_text(request):
    """Handles plain-text CV evaluation (JSON)."""
    raw_text = request.data.get("text", "").strip()
    if not raw_text:
        return Response(
            {"error": "CV text cannot be empty."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    target_role = request.data.get("target_role", "software_development")
    api_key = get_effective_api_key(request)
    provider = get_effective_provider(request)
    candidate_name = request.data.get("candidate_name")

    try:
        res = process_evaluation(
            raw_text=raw_text,
            candidate_name=candidate_name,
            target_role=target_role,
            api_key=api_key,
            provider=provider,
            file_ext=".txt",
        )
        return Response(res)
    except Exception as e:
        logger.exception(f"Error during CV text evaluation: {e}")
        return Response(
            {"error": f"Evaluation error: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
def get_history(request):
    """Returns the last 20 evaluation records."""
    limit = int(request.GET.get("limit", 20))
    try:
        records = EvaluationRecord.objects.all().order_by("-created_at")[:limit]
        serializer = HistoryItemSerializer(records, many=True)
        return Response(serializer.data)
    except Exception as e:
        logger.warning(f"Error fetching history: {e}")
        return Response([])


@api_view(["GET"])
def get_history_detail(request, pk: int):
    """Returns single evaluation record with full details."""
    record = get_object_or_404(EvaluationRecord, pk=pk)
    response_data = {
        "id": record.id,
        "created_at": record.created_at,
        "candidate_name": record.candidate_name,
        "target_role": record.target_role,
        "is_legitimate": record.is_legitimate,
        "legitimacy_score": record.legitimacy_score,
        "legitimacy_reasons": record.legitimacy_reasons,
        "ats_score": record.ats_score,
        "ats_grade": record.ats_grade,
        "ats_formatting_issues": record.ats_formatting_issues,
        "ats_tips": record.ats_tips,
        "parsed_name": record.parsed_name,
        "parsed_email": record.parsed_email,
        "parsed_skills": record.parsed_skills,
        "predefined_score": record.predefined_score,
        "matched_skills": record.matched_skills,
        "missing_skills": record.missing_skills,
        "rubric_breakdown": record.rubric_breakdown,
        "keyword_score": record.keyword_score,
        "career_recommendations": record.career_recommendations,
        "ai_evaluated": record.ai_evaluated,
        "ai_score": record.ai_score,
        "ai_summary": record.ai_summary,
        "ai_strengths": record.ai_strengths,
        "ai_weaknesses": record.ai_weaknesses,
        "ai_improvement_tips": record.ai_improvement_tips,
        "raw_text_snippet": record.raw_text_snippet,
        "legitimacy": {
            "is_legitimate": record.is_legitimate,
            "score": record.legitimacy_score,
            "detected_sections": [],
            "missing_sections": [],
            "has_contact_info": bool(record.parsed_email),
            "word_count": len(record.raw_text_snippet.split()) if record.raw_text_snippet else 0,
            "notes": record.legitimacy_reasons or [],
        },
        "ats": {
            "ats_score": record.ats_score or 0.0,
            "ats_grade": record.ats_grade or "",
            "detected_sections": [],
            "missing_sections": [],
            "formatting_issues": record.ats_formatting_issues or [],
            "ats_tips": record.ats_tips or [],
            "weak_phrases_found": [],
            "word_count": len(record.raw_text_snippet.split()) if record.raw_text_snippet else 0,
        },
        "parsed_resume": {
            "name": record.parsed_name,
            "email": record.parsed_email,
            "skills": record.parsed_skills or [],
            "phone": None,
            "linkedin": None,
            "github": None,
            "portfolio": None,
            "education": [],
            "certifications": [],
            "total_experience_years": 0.0,
        },
        "keyword_analysis": {
            "keyword_score": record.keyword_score or 0.0,
            "present_keywords": record.matched_skills or [],
            "missing_keywords": record.missing_skills or [],
            "weak_keywords": [],
            "suggested_keywords": (record.missing_skills or [])[:10],
            "weak_phrases": [],
        },
        "predefined_evaluation": {
            "role_id": record.target_role,
            "role_title": record.target_role.replace("_", " ").title(),
            "total_score": record.predefined_score,
            "core_skills_matched": record.matched_skills or [],
            "core_skills_missing": record.missing_skills or [],
            "tools_matched": [],
            "tools_missing": [],
            "concepts_matched": [],
            "concepts_missing": [],
            "experience_signals_found": [],
            "breakdown_percentages": record.rubric_breakdown or {},
        },
        "ai_evaluation": {
            "status": "completed" if record.ai_evaluated else "skipped",
            "error_message": None,
            "ai_score": record.ai_score,
            "summary": record.ai_summary,
            "strengths": record.ai_strengths or [],
            "weaknesses": record.ai_weaknesses or [],
            "improvement_recommendations": record.ai_improvement_tips or [],
            "suggested_project_ideas": [],
            "suggested_bullet_rewrites": [],
        },
    }
    return Response(response_data)


@api_view(["POST"])
def jd_match_text(request):
    """Job description matching against raw CV text."""
    cv_text = request.data.get("cv_text", "").strip()
    job_description = request.data.get("job_description", "").strip()
    if not cv_text:
        return Response(
            {"error": "cv_text cannot be empty."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if not job_description:
        return Response(
            {"error": "job_description cannot be empty."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    api_key = get_effective_api_key(request)
    provider = get_effective_provider(request)

    res = match_job_description(
        cv_text=cv_text,
        job_description=job_description,
        api_key=api_key,
        provider=provider,
    )
    return Response(res)


@api_view(["POST"])
def jd_match_upload(request):
    """Job description matching against uploaded CV file."""
    upload_file = request.FILES.get("file")
    if not upload_file:
        return Response(
            {"error": "No file uploaded. Supply a file under the 'file' parameter."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    job_description = request.data.get("job_description", "").strip()
    if not job_description:
        return Response(
            {"error": "job_description cannot be empty."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    file_bytes = upload_file.read()
    if not file_bytes:
        return Response(
            {"error": "Uploaded file is empty."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    text, _ = extract_text_from_bytes(upload_file.name, file_bytes)
    if not text.strip():
        return Response(
            {"error": "Could not extract readable text from file."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    api_key = get_effective_api_key(request)
    provider = get_effective_provider(request)

    res = match_job_description(
        cv_text=text,
        job_description=job_description,
        api_key=api_key,
        provider=provider,
    )
    return Response(res)


@api_view(["POST"])
def bullet_rewrite(request):
    """STAR bullet point rewrite endpoint."""
    bullets = request.data.get("bullets", [])
    if isinstance(bullets, str):
        bullets = [bullets] if bullets.strip() else []
    if not bullets:
        return Response(
            {"error": "bullets list cannot be empty."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    role = request.data.get("role", "Software Engineer")
    api_key = get_effective_api_key(request)
    provider = get_effective_provider(request)

    res = generate_bullets(
        weak_bullets=bullets,
        role_title=role,
        api_key=api_key,
        provider=provider,
    )
    return Response(res)


@api_view(["POST"])
def interview_prep(request):
    """Interview question generation endpoint."""
    cv_text = request.data.get("cv_text", "").strip()
    upload_file = request.FILES.get("file")
    if not cv_text and upload_file:
        file_bytes = upload_file.read()
        if file_bytes:
            extracted, _ = extract_text_from_bytes(upload_file.name, file_bytes)
            cv_text = extracted.strip()

    if not cv_text:
        return Response(
            {"error": "CV text cannot be empty. Please provide text or upload a file."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    role = request.data.get("role", "Software Engineer")
    api_key = get_effective_api_key(request)
    provider = get_effective_provider(request)

    res = generate_interview_questions(
        cv_text=cv_text,
        role_title=role,
        api_key=api_key,
        provider=provider,
    )
    return Response(res)


@api_view(["GET", "POST"])
def api_root(request):
    """Root endpoint for status and ingress probe."""
    return Response({"status": "ok", "message": "CV Evaluator API"})
