import re
from typing import Dict, Any, List
from .role_dataset import load_roles_criteria

WEAK_PHRASES = [
    "responsible for",
    "worked on",
    "helped with",
    "assisted",
    "team player",
    "hard worker",
    "detail oriented",
    "duties included",
]

FILLER_WORDS = ["nice", "great", "excellent", "strong", "good"]


def count_keyword_occurrences(keyword: str, text: str) -> int:
    """
    Counts occurrences of a keyword in text with regex support for programming languages.
    """
    k_lower = keyword.lower()
    if k_lower == "c++":
        pattern = r'(?<![a-zA-Z0-9])c\+\+(?![a-zA-Z0-9])'
    elif k_lower == "c#":
        pattern = r'(?<![a-zA-Z0-9])c\#(?![a-zA-Z0-9])'
    elif k_lower == "r":
        pattern = r'(?<![a-zA-Z0-9])r(?![a-zA-Z0-9])'
    elif k_lower == "go":
        pattern = r'\b(golang|go\s+programming|go\s+language)\b|(?<![a-zA-Z0-9])go(?![a-zA-Z0-9])'
    elif k_lower == "ci/cd":
        pattern = r'\b(ci/cd|ci-cd|continuous\s+integration)\b'
    elif k_lower == ".net":
        pattern = r'(?<![a-zA-Z0-9])\.net\b'
    else:
        escaped = re.escape(keyword)
        pattern = rf'\b{escaped}\b'
        
    return len(re.findall(pattern, text, re.IGNORECASE))


def analyze_keywords(text: str, role_id: str) -> Dict[str, Any]:
    """
    Keyword intelligence using roles_criteria.json.
    Analyzes core skills, tools, and concepts against resume text.
    """
    criteria = load_roles_criteria()
    role = criteria.get(role_id)
    if not role:
        # Fallback to software_development if unknown role
        role = criteria.get("software_development", list(criteria.values())[0])

    core_skills = role.get("core_skills", [])
    frameworks_and_tools = role.get("frameworks_and_tools", [])
    concepts = role.get("concepts_and_methodologies", [])

    # Order preserved: core first, then tools, then concepts
    target_keywords: List[str] = []
    for k in core_skills + frameworks_and_tools + concepts:
        if k not in target_keywords:
            target_keywords.append(k)

    present_keywords: List[str] = []
    missing_keywords: List[str] = []
    weak_keywords: List[str] = []
    strong_keywords: List[str] = []

    for kw in target_keywords:
        cnt = count_keyword_occurrences(kw, text)
        if cnt >= 2:
            present_keywords.append(kw)
            strong_keywords.append(kw)
        elif cnt == 1:
            present_keywords.append(kw)
            weak_keywords.append(kw)
        else:
            missing_keywords.append(kw)

    # Detect weak phrases
    weak_phrases_found = [
        phrase for phrase in WEAK_PHRASES
        if re.search(r'\b' + re.escape(phrase) + r'\b', text, re.IGNORECASE)
    ]

    # Detect overused filler words (5+ occurrences)
    overused_found = []
    for word in FILLER_WORDS:
        cnt = len(re.findall(r'\b' + re.escape(word) + r'\b', text, re.IGNORECASE))
        if cnt >= 5:
            overused_found.append(f"'{word}' ({cnt} times)")

    # Score calculation (0-100)
    match_ratio = len(present_keywords) / max(len(target_keywords), 1)
    base_score = match_ratio * 100.0
    penalty = min(len(weak_phrases_found) * 2.0, 10.0)
    keyword_score = round(max(0.0, min(100.0, base_score - penalty)), 1)

    suggested_keywords = missing_keywords[:10]

    return {
        "keyword_score": keyword_score,
        "present_keywords": present_keywords,
        "missing_keywords": missing_keywords,
        "weak_keywords": weak_keywords,
        "suggested_keywords": suggested_keywords,
        "weak_phrases": weak_phrases_found,
    }
