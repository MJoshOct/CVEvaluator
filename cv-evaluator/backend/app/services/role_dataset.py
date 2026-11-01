import json
import os
import re
from typing import Dict, Any, List

CRITERIA_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "roles_criteria.json")

def load_roles_criteria() -> Dict[str, Any]:
    with open(CRITERIA_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def match_keyword(keyword: str, text: str) -> bool:
    """
    Case-insensitive regex matching handling special characters like C++, C#, .NET.
    """
    # Special escapes for programming language names with symbols
    if keyword.lower() == "c++":
        pattern = r'(?<![a-zA-Z0-9])c\+\+(?![a-zA-Z0-9])'
    elif keyword.lower() == "c#":
        pattern = r'(?<![a-zA-Z0-9])c\#(?![a-zA-Z0-9])'
    elif keyword.lower() == "r":
        pattern = r'(?<![a-zA-Z0-9])r(?![a-zA-Z0-9])'
    elif keyword.lower() == "go":
        pattern = r'\b(golang|go\s+programming|go\s+language)\b|(?<![a-zA-Z0-9])go(?![a-zA-Z0-9])'
    elif keyword.lower() == "ci/cd":
        pattern = r'\b(ci/cd|ci-cd|continuous\s+integration)\b'
    elif keyword.lower() == ".net":
        pattern = r'(?<![a-zA-Z0-9])\.net\b'
    else:
        escaped = re.escape(keyword)
        pattern = rf'\b{escaped}\b'
        
    return bool(re.search(pattern, text, re.IGNORECASE))

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
