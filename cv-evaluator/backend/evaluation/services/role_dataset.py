import json
import os
import re
from typing import Dict, Any, List

CRITERIA_FILE = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'roles_criteria.json')

KEYWORD_ALIASES: Dict[str, List[str]] = {
    "kubernetes": ["k8s", "kubernetes"],
    "postgresql": ["postgres", "postgresql", "psql"],
    "javascript": ["js", "javascript"],
    "typescript": ["ts", "typescript"],
    "python": ["python", "python3"],
    "machine learning": ["ml", "machine learning"],
    "deep learning": ["dl", "deep learning"],
    "natural language processing": ["nlp", "natural language processing"],
    "object-oriented programming": ["oop", "object-oriented programming", "object oriented"],
    "ci/cd": ["ci/cd", "ci-cd", "continuous integration", "continuous deployment"],
    "test driven development": ["tdd", "test driven development", "test-driven development"],
    "system design": ["system design", "distributed systems", "software architecture"],
    "rest api": ["rest api", "restful", "rest apis", "restful api"],
    "large language models": ["llm", "llms", "large language models"],
    "retrieval-augmented generation": ["rag", "retrieval-augmented generation", "retrieval augmented generation"],
    "exploratory data analysis": ["eda", "exploratory data analysis"],
    "aws": ["aws", "amazon web services"],
    "gcp": ["gcp", "google cloud platform", "google cloud"],
    "azure": ["azure", "microsoft azure"],
    "docker": ["docker", "containerization", "containers"],
    "data structures": ["data structures", "dsa"],
    "algorithms": ["algorithms", "algo"],
}


def load_roles_criteria() -> Dict[str, Any]:
    with open(CRITERIA_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def match_keyword(keyword: str, text: str) -> bool:
    """
    Case-insensitive regex matching with special handling for C++, C#, .NET,
    single letter languages, and industry abbreviations.
    """
    k_lower = keyword.lower().strip()

    # Check alias dictionary first
    if k_lower in KEYWORD_ALIASES:
        for alias in KEYWORD_ALIASES[k_lower]:
            if match_single_pattern(alias, text):
                return True

    return match_single_pattern(keyword, text)


def match_single_pattern(pattern_str: str, text: str) -> bool:
    p_lower = pattern_str.lower().strip()

    if p_lower == "c++":
        pat = r'(?<![a-zA-Z0-9])c\+\+(?![a-zA-Z0-9])'
    elif p_lower == "c#":
        pat = r'(?<![a-zA-Z0-9])c\#(?![a-zA-Z0-9])'
    elif p_lower == "r":
        pat = r'(?<![a-zA-Z0-9])\bR\b(?![a-zA-Z0-9])'
    elif p_lower == "go":
        pat = r'\b(golang|go\s+programming|go\s+language)\b|(?<![a-zA-Z0-9])go(?![a-zA-Z0-9])'
    elif p_lower == ".net":
        pat = r'(?<![a-zA-Z0-9])\.net\b'
    elif p_lower == "ci/cd":
        pat = r'\b(ci/cd|ci-cd|continuous\s+integration)\b'
    else:
        escaped = re.escape(pattern_str)
        pat = rf'\b{escaped}\b'

    return bool(re.search(pat, text, re.IGNORECASE))


def evaluate_against_role(text: str, role_id: str) -> Dict[str, Any]:
    criteria = load_roles_criteria()
    if role_id not in criteria:
        raise ValueError(f"Unknown role ID: {role_id}. Supported roles: {list(criteria.keys())}")

    role = criteria[role_id]

    core_skills = role.get("core_skills", [])
    tools = role.get("frameworks_and_tools", [])
    concepts = role.get("concepts_and_methodologies", [])
    bonus = role.get("bonus_skills", [])
    signals = role.get("experience_signals", [])

    matched_core = [k for k in core_skills if match_keyword(k, text)]
    missing_core = [k for k in core_skills if k not in matched_core]

    matched_tools = [k for k in tools if match_keyword(k, text)]
    missing_tools = [k for k in tools if k not in matched_tools]

    matched_concepts = [k for k in concepts if match_keyword(k, text)]
    missing_concepts = [k for k in concepts if k not in matched_concepts]

    matched_bonus = [k for k in bonus if match_keyword(k, text)]
    matched_signals = [k for k in signals if match_keyword(k, text)]

    # Scoring weights:
    # Core skills: 45%
    # Tools & Frameworks: 30%
    # Concepts & Methodologies: 15%
    # Experience signals & bonus: 10%
    core_ratio = len(matched_core) / max(len(core_skills), 1)
    tools_ratio = len(matched_tools) / max(len(tools), 1)
    concepts_ratio = len(matched_concepts) / max(len(concepts), 1)
    signals_ratio = (len(matched_signals) + len(matched_bonus)) / max((len(signals) + len(bonus)), 1)
    signals_ratio = min(signals_ratio, 1.0)

    total_score = (
        (core_ratio * 45.0) +
        (tools_ratio * 30.0) +
        (concepts_ratio * 15.0) +
        (signals_ratio * 10.0)
    )

    return {
        "role_id": role["id"],
        "role_title": role["title"],
        "total_score": round(total_score, 1),
        "core_skills_matched": matched_core,
        "core_skills_missing": missing_core,
        "tools_matched": matched_tools,
        "tools_missing": missing_tools,
        "concepts_matched": matched_concepts,
        "concepts_missing": missing_concepts,
        "experience_signals_found": matched_signals,
        "breakdown_percentages": {
            "core_skills": round(core_ratio * 100, 1),
            "frameworks_and_tools": round(tools_ratio * 100, 1),
            "concepts_and_methodologies": round(concepts_ratio * 100, 1),
            "experience_signals": round(signals_ratio * 100, 1)
        }
    }
