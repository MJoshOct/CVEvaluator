import json
import logging
import re
from typing import Dict, Any, Optional, List
import httpx
from app.config import settings

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are an elite Senior Technical Recruiter and Engineering Hiring Manager.
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
    return settings.AI_PROVIDER

async def get_available_groq_models(client: httpx.AsyncClient, headers: Dict[str, str]) -> List[str]:
    """Dynamically queries Groq for the exact models currently enabled on this API key."""
    try:
        res = await client.get("https://api.groq.com/openai/v1/models", headers=headers, timeout=10.0)
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

async def call_groq(cv_text: str, role_title: str, predefined_info: Dict[str, Any], api_key: str) -> Dict[str, Any]:
    url = "https://api.groq.com/openai/v1/chat/completions"
    
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

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    last_error = None
    async with httpx.AsyncClient(timeout=45.0) as client:
        # Step 1: Query Groq dynamically for models available on this specific user's plan
        discovered_models = await get_available_groq_models(client, headers)
        
        # Priority fallback candidates — verified Groq model IDs (as of late 2026)
        # Always prefer dynamically discovered models first; these are last-resort fallbacks.
        fallback_candidates = [
            "llama-3.1-8b-instant",       # fastest, universally available on free tier
            "llama-3.3-70b-versatile",     # best quality on free tier (may require approval)
            "llama3-8b-8192",              # stable alias, widely available
            "llama3-70b-8192",             # larger stable alias
            "gemma2-9b-it",               # Google Gemma 2 on Groq, widely available
        ]
        
        # Prioritize discovered models first, then fallbacks
        all_models = []
        for m in (discovered_models + fallback_candidates):
            if m not in all_models:
                all_models.append(m)

        for model_name in all_models:
            payload = {
                "model": model_name,
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt}
                ],
                "response_format": {"type": "json_object"},
                "temperature": 0.2
            }

            try:
                logger.info(f"Attempting Groq evaluation with model: {model_name}")
                response = await client.post(url, headers=headers, json=payload)
                
                # If json_object format is rejected by a specific model, try standard prompt mode
                if response.status_code == 400 and "response_format" in response.text.lower():
                    payload.pop("response_format", None)
                    response = await client.post(url, headers=headers, json=payload)

                if response.status_code == 200:
                    data = response.json()
                    raw_content = data["choices"][0]["message"]["content"]
                    logger.info(f"Groq evaluation successfully completed with model: {model_name}")
                    return parse_json_safely(raw_content)
                
                # If model not found, decommissioned, or forbidden, proceed to next model
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

async def call_gemini(cv_text: str, role_title: str, predefined_info: Dict[str, Any], api_key: str) -> Dict[str, Any]:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
    
    prompt = f"""Target Role: {role_title}

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

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": SYSTEM_PROMPT + "\n\n" + prompt}
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.2,
            "responseMimeType": "application/json"
        }
    }

    async with httpx.AsyncClient(timeout=45.0) as client:
        response = await client.post(url, json=payload)
        if response.status_code != 200:
            logger.error(f"Gemini API returned error: {response.status_code} - {response.text}")
            raise RuntimeError(f"Gemini API error ({response.status_code}): {response.text}")
        
        data = response.json()
        candidates = data.get("candidates", [])
        if not candidates:
            raise RuntimeError("Gemini returned no candidates.")
        
        content_text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "{}")
        return json.loads(content_text)

async def call_openai(cv_text: str, role_title: str, predefined_info: Dict[str, Any], api_key: str) -> Dict[str, Any]:
    url = "https://api.openai.com/v1/chat/completions"
    
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

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "gpt-4o-mini",
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt}
        ],
        "response_format": {"type": "json_object"},
        "temperature": 0.2
    }

    async with httpx.AsyncClient(timeout=45.0) as client:
        response = await client.post(url, headers=headers, json=payload)
        if response.status_code != 200:
            logger.error(f"OpenAI API returned error: {response.status_code} - {response.text}")
            raise RuntimeError(f"OpenAI API error ({response.status_code}): {response.text}")
        
        data = response.json()
        raw_content = data["choices"][0]["message"]["content"]
        return json.loads(raw_content)

async def evaluate_with_ai(
    cv_text: str,
    role_title: str,
    predefined_info: Dict[str, Any],
    api_key: Optional[str] = None,
    provider: Optional[str] = None
) -> Dict[str, Any]:
    effective_key = (api_key or settings.AI_API_KEY or "").strip()
    
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

    resolved_provider = detect_provider(effective_key, provider)
    
    try:
        if resolved_provider == "groq":
            result = await call_groq(cv_text, role_title, predefined_info, effective_key)
        elif resolved_provider == "openai":
            result = await call_openai(cv_text, role_title, predefined_info, effective_key)
        else:
            result = await call_gemini(cv_text, role_title, predefined_info, effective_key)
            
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
