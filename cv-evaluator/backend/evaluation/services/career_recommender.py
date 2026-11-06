from typing import Dict, Any, List
from .role_dataset import load_roles_criteria, evaluate_against_role


def _determine_fit_level(score: float) -> str:
    if score >= 75.0:
        return "Strong Fit"
    elif score >= 55.0:
        return "Good Fit"
    elif score >= 35.0:
        return "Moderate Fit"
    return "Low Fit"


def recommend_careers(text: str) -> List[Dict[str, Any]]:
    """
    Evaluates the input CV text across all available roles defined in roles_criteria.json.
    Returns a sorted list of career matches from highest score to lowest.
    """
    criteria = load_roles_criteria()
    recommendations: List[Dict[str, Any]] = []

    for role_id, role_data in criteria.items():
        try:
            eval_result = evaluate_against_role(text, role_id)
            score = float(eval_result.get("total_score", 0.0))
            fit_level = _determine_fit_level(score)
            
            # Extract top matched and missing core skills (up to 5 each)
            top_matched = eval_result.get("core_skills_matched", [])[:5]
            top_missing = eval_result.get("core_skills_missing", [])[:5]

            recommendations.append({
                "role_id": role_id,
                "role_title": role_data.get("title", eval_result.get("role_title", role_id)),
                "score": score,
                "fit_level": fit_level,
                "top_missing_skills": top_missing,
                "top_matched_skills": top_matched,
            })
        except Exception:
            continue

    # Sort descending by score
    recommendations.sort(key=lambda r: r["score"], reverse=True)
    return recommendations
