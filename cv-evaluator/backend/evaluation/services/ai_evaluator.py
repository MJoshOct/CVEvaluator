import json
import logging
import re
from typing import Dict, Any, Optional, List
import httpx
from django.conf import settings

logger = logging.getLogger(__name__)

EVALUATION_SYSTEM_PROMPT = """You are an elite Senior Technical Recruiter and Engineering Hiring Manager.
Your role is to deeply evaluate a candidate's CV/resume against a target role, identify genuine strengths and weaknesses, and provide an actionable, high-impact roadmap for how they can improve their CV to land high-paying offers in that role.

You MUST respond strictly with valid JSON conforming to the following structure:
{
  "ai_score": 85.0,
  "summary": "Executive summary of the candidate's profile and overall readiness for the target role.",
  "strengths": [
    "Specific technical or domain strength 1",
    "Specific technical or domain strength 2"
  ],
  "weaknesses": [
    "Identified critical gap or missing depth in skill 1",
    "Identified critical gap or missing depth in skill 2"
  ],
  "improvement_recommendations": [
    "Direct actionable suggestion 1 on what to add or adjust",
    "Direct actionable suggestion 2 on skills or credentials to acquire"
  ],
  "suggested_project_ideas": [
    "Portfolio project idea 1 demonstrating target role competencies",
    "Portfolio project idea 2 solving a real-world enterprise problem"
  ],
  "suggested_bullet_rewrites": [
    {
      "original_example": "Typical weak phrasing found in this resume or similar resumes",
      "improved_version": "Rewritten bullet using STAR/XYZ formula (Accomplished [X] measured by [Y] by doing [Z]) with strong action verbs and quantified impact"
    }
  ]
}
"""

IMPROVE_RESUME_SYSTEM_PROMPT = """You are an elite Resume Strategist and Executive Career Coach.
Analyze the provided CV against the target role.
Rewrite the professional summary to be compelling and achievement-oriented.
Identify 3 weak bullet points from the CV and rewrite them using the STAR format (Accomplished [X] measured by [Y] by doing [Z]).
Identify specific grammatical, structural, or stylistic mistakes.
Convert 3 passive responsibility statements into strong, achievement-oriented statements.

You MUST respond strictly with valid JSON conforming to this schema:
{
  "improved_summary": "Compelling rewritten summary...",
  "rewritten_bullets": [
    {"original": "Original weak bullet", "improved": "STAR format improved bullet"}
  ],
  "grammar_issues": [
    "Grammar or style issue description..."
  ],
  "achievement_rewrites": [
    {"original": "Passive responsibility...", "improved": "Active achievement statement..."}
  ]
}
"""

JD_MATCH_SYSTEM_PROMPT = """You are an ATS algorithms expert and hiring director.
Compare the candidate's CV against the target Job Description.
Calculate an accurate compatibility percentage (0 to 100).
Extract matching requirements and missing requirements.
Provide a detailed side-by-side skill comparison.
Provide 5 high-impact, specific recommendations to improve alignment.

You MUST respond strictly with valid JSON conforming to this schema:
{
  "compatibility_score": 85.0,
  "matching_requirements": ["Requirement 1", "Requirement 2"],
  "missing_requirements": ["Requirement 3", "Requirement 4"],
  "skill_comparison": [
    {"skill": "Skill Name", "in_cv": true, "in_jd": true}
  ],
  "recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3", "Recommendation 4", "Recommendation 5"],
  "summary": "Executive alignment assessment..."
}
"""

BULLET_REWRITE_SYSTEM_PROMPT = """You are an expert Executive Resume Writer.
Rewrite each bullet point using the STAR format (Accomplished [X] measured by [Y] by doing [Z]).
Use strong action verbs, eliminate passive filler phrases, and quantify impact wherever possible.

You MUST respond strictly with valid JSON conforming to this schema:
{
  "rewrites": [
    {
      "original": "Original bullet text",
      "improved": "STAR-formatted high impact rewritten bullet",
      "action_verb_used": "Action verb (e.g. Architected, Spearheaded, Accelerated)"
    }
  ]
}
"""

INTERVIEW_PREP_SYSTEM_PROMPT = """You are a Senior Technical Interviewer and Engineering Manager.
Review the candidate's CV and the target role.
Generate:
- 4 Technical questions tailored to the candidate's stack and target role (with model answers and difficulty: Easy, Medium, or Hard)
- 3 Project-based in-depth questions targeting specific achievements/technologies mentioned in the CV (with model answers)
- 3 Behavioral/HR questions assessing culture fit and leadership (with model answers)

You MUST respond strictly with valid JSON conforming to this schema:
{
  "technical_questions": [
    {"question": "...", "answer": "...", "difficulty": "Medium"}
  ],
  "project_questions": [
    {"question": "...", "answer": "..."}
  ],
  "hr_questions": [
    {"question": "...", "answer": "..."}
  ]
}
"""


def parse_json_safely(raw_str: str) -> Dict[str, Any]:
    """Parses JSON cleanly even if wrapped inside markdown code blocks."""
    cleaned = raw_str.strip()
    match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', cleaned, re.DOTALL)
    if match:
        cleaned = match.group(1)
    return json.loads(cleaned)


def detect_provider(api_key: str, requested_provider: Optional[str] = None) -> str:
    if requested_provider in ["groq", "gemini", "openai"]:
        return requested_provider
    if api_key.startswith("gsk_"):
        return "groq"
    if api_key.startswith("AIza"):
        return "gemini"
    if api_key.startswith("sk-"):
        return "openai"
    return getattr(settings, "AI_PROVIDER", "groq")


def get_available_groq_models(client: httpx.Client, headers: Dict[str, str]) -> List[str]:
    """Dynamically queries Groq for the exact models currently enabled on this API key."""
    try:
        res = client.get("https://api.groq.com/openai/v1/models", headers=headers, timeout=10.0)
        if res.status_code == 200:
            data = res.json().get("data", [])
            valid_ids = [
                m["id"] for m in data
                if m.get("id") and not any(skip in m["id"].lower() for skip in ["whisper", "tts", "audio", "guard", "embed"])
            ]
            if valid_ids:
                logger.info(f"Discovered active Groq models for account: {valid_ids}")
                return valid_ids
    except Exception as e:
        logger.warning(f"Could not dynamically fetch Groq models: {e}")
    return []


def _call_groq(system_prompt: str, user_prompt: str, api_key: str) -> Dict[str, Any]:
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    fallback_candidates = [
        "llama-3.1-8b-instant",
        "llama-3.3-70b-versatile",
        "llama3-8b-8192",
        "llama3-70b-8192",
        "gemma2-9b-it",
    ]

    last_error = None
    with httpx.Client(timeout=45.0) as client:
        discovered = get_available_groq_models(client, headers)
        all_models = []
        for m in (discovered + fallback_candidates):
            if m not in all_models:
                all_models.append(m)

        for model_name in all_models:
            payload = {
                "model": model_name,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                "response_format": {"type": "json_object"},
                "temperature": 0.2
            }

            try:
                logger.info(f"Attempting Groq call with model: {model_name}")
                response = client.post(url, headers=headers, json=payload)

                # Fallback if response_format unsupported
                if response.status_code == 400 and "response_format" in response.text.lower():
                    payload.pop("response_format", None)
                    response = client.post(url, headers=headers, json=payload)

                if response.status_code == 200:
                    data = response.json()
                    raw_content = data["choices"][0]["message"]["content"]
                    logger.info(f"Groq call successfully completed with model: {model_name}")
                    return parse_json_safely(raw_content)

                if response.status_code in [404, 400, 403] and any(k in response.text.lower() for k in ["model", "access", "decommissioned"]):
                    logger.warning(f"Groq model {model_name} not accessible: {response.text}. Trying next...")
                    last_error = response.text
                    continue
                else:
                    raise RuntimeError(f"Groq API error ({response.status_code}): {response.text}")
            except httpx.RequestError as e:
                last_error = str(e)
                continue

    raise RuntimeError(f"Groq evaluation failed with all available models. Last error: {last_error}")


def _call_gemini(system_prompt: str, user_prompt: str, api_key: str) -> Dict[str, Any]:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": f"{system_prompt}\n\n{user_prompt}"}
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.2,
            "responseMimeType": "application/json"
        }
    }

    with httpx.Client(timeout=45.0) as client:
        response = client.post(url, json=payload)
        if response.status_code != 200:
            logger.error(f"Gemini API returned error: {response.status_code} - {response.text}")
            raise RuntimeError(f"Gemini API error ({response.status_code}): {response.text}")

        data = response.json()
        candidates = data.get("candidates", [])
        if not candidates:
            raise RuntimeError("Gemini returned no candidates.")

        content_text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "{}")
        return parse_json_safely(content_text)


def _call_openai(system_prompt: str, user_prompt: str, api_key: str) -> Dict[str, Any]:
    url = "https://api.openai.com/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "gpt-4o-mini",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "response_format": {"type": "json_object"},
        "temperature": 0.2
    }

    with httpx.Client(timeout=45.0) as client:
        response = client.post(url, headers=headers, json=payload)
        if response.status_code != 200:
            logger.error(f"OpenAI API returned error: {response.status_code} - {response.text}")
            raise RuntimeError(f"OpenAI API error ({response.status_code}): {response.text}")

        data = response.json()
        raw_content = data["choices"][0]["message"]["content"]
        return parse_json_safely(raw_content)


def _call_provider(
    system_prompt: str,
    user_prompt: str,
    api_key: str,
    provider: Optional[str] = None
) -> Dict[str, Any]:
    """Unified sync dispatcher to Groq, Gemini, or OpenAI."""
    resolved = detect_provider(api_key, provider)
    if resolved == "groq":
        return _call_groq(system_prompt, user_prompt, api_key)
    elif resolved == "openai":
        return _call_openai(system_prompt, user_prompt, api_key)
    else:
        return _call_gemini(system_prompt, user_prompt, api_key)


def evaluate_with_ai(
    cv_text: str,
    role_title: str,
    predefined_info: Dict[str, Any],
    api_key: Optional[str] = None,
    provider: Optional[str] = None
) -> Dict[str, Any]:
    """
    Synchronous evaluation of CV using LLM against predefined rubric baselines.
    """
    effective_key = (api_key or getattr(settings, "AI_API_KEY", "") or "").strip()

    if not effective_key:
        return {
            "status": "skipped",
            "error_message": "No AI API Key provided. Provide an API key in the UI or backend environment to unlock AI analysis.",
            "ai_score": None,
            "summary": None,
            "strengths": [],
            "weaknesses": [],
            "improvement_recommendations": [],
            "suggested_project_ideas": [],
            "suggested_bullet_rewrites": []
        }

    user_prompt = f"""Target Role: {role_title}

Baseline Predefined Evaluation Results:
- Match Score: {predefined_info.get('total_score')}%
- Matched Core Skills: {', '.join(predefined_info.get('core_skills_matched', [])) or 'None'}
- Missing Core Skills: {', '.join(predefined_info.get('core_skills_missing', [])) or 'None'}
- Matched Tools: {', '.join(predefined_info.get('tools_matched', [])) or 'None'}
- Missing Tools: {', '.join(predefined_info.get('tools_missing', [])) or 'None'}

Candidate CV Text:
\"\"\"
{cv_text[:8000]}
\"\"\"

Please evaluate this CV thoroughly for the '{role_title}' role and output only the required JSON.
"""

    try:
        result = _call_provider(EVALUATION_SYSTEM_PROMPT, user_prompt, effective_key, provider)
        return {
            "status": "completed",
            "error_message": None,
            "ai_score": float(result.get("ai_score", 70.0)),
            "summary": result.get("summary", ""),
            "strengths": result.get("strengths", []),
            "weaknesses": result.get("weaknesses", []),
            "improvement_recommendations": result.get("improvement_recommendations", []),
            "suggested_project_ideas": result.get("suggested_project_ideas", []),
            "suggested_bullet_rewrites": result.get("suggested_bullet_rewrites", [])
        }
    except Exception as e:
        logger.exception(f"AI evaluation failed: {e}")
        return {
            "status": "error",
            "error_message": str(e),
            "ai_score": None,
            "summary": None,
            "strengths": [],
            "weaknesses": [],
            "improvement_recommendations": [],
            "suggested_project_ideas": [],
            "suggested_bullet_rewrites": []
        }


def improve_resume(
    cv_text: str,
    role_title: str,
    predefined_info: Dict[str, Any],
    api_key: Optional[str] = None,
    provider: Optional[str] = None
) -> Dict[str, Any]:
    """
    Sync improvement suggestions: summary rewrite, STAR bullet points, grammar, and active phrasing.
    """
    effective_key = (api_key or getattr(settings, "AI_API_KEY", "") or "").strip()
    if not effective_key:
        return {
            "improved_summary": "Please provide an API key to generate an AI-enhanced professional summary.",
            "rewritten_bullets": [],
            "grammar_issues": [],
            "achievement_rewrites": []
        }

    user_prompt = f"""Target Role: {role_title}
Baseline Match Score: {predefined_info.get('total_score', 0)}%

Candidate CV Text:
\"\"\"
{cv_text[:8000]}
\"\"\"

Please provide resume improvement suggestions conforming strictly to the requested JSON schema.
"""

    try:
        res = _call_provider(IMPROVE_RESUME_SYSTEM_PROMPT, user_prompt, effective_key, provider)
        return {
            "improved_summary": res.get("improved_summary", ""),
            "rewritten_bullets": res.get("rewritten_bullets", []),
            "grammar_issues": res.get("grammar_issues", []),
            "achievement_rewrites": res.get("achievement_rewrites", [])
        }
    except Exception as e:
        logger.exception(f"Resume improvement failed: {e}")
        return {
            "improved_summary": f"Could not generate suggestions: {str(e)}",
            "rewritten_bullets": [],
            "grammar_issues": [],
            "achievement_rewrites": []
        }


def match_job_description(
    cv_text: str,
    job_description: str,
    api_key: Optional[str] = None,
    provider: Optional[str] = None
) -> Dict[str, Any]:
    """
    Sync ATS job description matching.
    """
    effective_key = (api_key or getattr(settings, "AI_API_KEY", "") or "").strip()
    if not effective_key:
        return {
            "compatibility_score": 0.0,
            "matching_requirements": [],
            "missing_requirements": [],
            "skill_comparison": [],
            "recommendations": ["Please supply an API key to perform automated JD matching."],
            "summary": "AI API Key required for job description matching."
        }

    user_prompt = f"""Candidate CV Text:
\"\"\"
{cv_text[:8000]}
\"\"\"

Target Job Description:
\"\"\"
{job_description[:8000]}
\"\"\"

Compare the candidate against this job description and output only the required JSON.
"""

    try:
        res = _call_provider(JD_MATCH_SYSTEM_PROMPT, user_prompt, effective_key, provider)
        return {
            "compatibility_score": float(res.get("compatibility_score", 0.0)),
            "matching_requirements": res.get("matching_requirements", []),
            "missing_requirements": res.get("missing_requirements", []),
            "skill_comparison": res.get("skill_comparison", []),
            "recommendations": res.get("recommendations", []),
            "summary": res.get("summary", "")
        }
    except Exception as e:
        logger.exception(f"Job description matching failed: {e}")
        return {
            "compatibility_score": 0.0,
            "matching_requirements": [],
            "missing_requirements": [],
            "skill_comparison": [],
            "recommendations": [f"Error occurred during analysis: {str(e)}"],
            "summary": f"Job description match failed: {str(e)}"
        }


def generate_bullets(
    weak_bullets: List[str],
    role_title: str = "Software Engineer",
    api_key: Optional[str] = None,
    provider: Optional[str] = None
) -> Dict[str, Any]:
    """
    Sync bullet points STAR rewriter.
    """
    effective_key = (api_key or getattr(settings, "AI_API_KEY", "") or "").strip()
    if not effective_key:
        return {
            "rewrites": [
                {
                    "original": b,
                    "improved": "Please provide an API key to generate STAR-formatted bullets.",
                    "action_verb_used": ""
                }
                for b in weak_bullets
            ]
        }

    user_prompt = f"""Target Role: {role_title}

Weak Bullets to rewrite:
{json.dumps(weak_bullets, indent=2)}

Please rewrite each bullet using STAR format and output only the required JSON.
"""

    try:
        res = _call_provider(BULLET_REWRITE_SYSTEM_PROMPT, user_prompt, effective_key, provider)
        return {
            "rewrites": res.get("rewrites", [])
        }
    except Exception as e:
        logger.exception(f"Bullet rewrite failed: {e}")
        return {
            "rewrites": [
                {
                    "original": b,
                    "improved": f"Error during rewrite: {str(e)}",
                    "action_verb_used": ""
                }
                for b in weak_bullets
            ]
        }


def generate_interview_questions(
    cv_text: str,
    role_title: str,
    api_key: Optional[str] = None,
    provider: Optional[str] = None
) -> Dict[str, Any]:
    """
    Sync interview question generator (4 technical, 3 project, 3 HR).
    """
    effective_key = (api_key or getattr(settings, "AI_API_KEY", "") or "").strip()
    if not effective_key:
        return {
            "technical_questions": [],
            "project_questions": [],
            "hr_questions": []
        }

    user_prompt = f"""Target Role: {role_title}

Candidate CV Text:
\"\"\"
{cv_text[:8000]}
\"\"\"

Please generate 4 technical, 3 project, and 3 HR interview questions with model answers conforming strictly to the requested JSON schema.
"""

    try:
        res = _call_provider(INTERVIEW_PREP_SYSTEM_PROMPT, user_prompt, effective_key, provider)
        return {
            "technical_questions": res.get("technical_questions", []),
            "project_questions": res.get("project_questions", []),
            "hr_questions": res.get("hr_questions", [])
        }
    except Exception as e:
        logger.exception(f"Interview prep generation failed: {e}")
        return {
            "technical_questions": [],
            "project_questions": [],
            "hr_questions": []
        }
