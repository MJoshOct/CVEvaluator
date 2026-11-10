import re
from typing import Dict, Any, List

# Standard ATS-expected section headers
ATS_REQUIRED_SECTIONS = {
    "summary":        r'\b(summary|professional\s+summary|profile|about\s+me|career\s+objective|executive\s+summary)\b',
    "experience":     r'\b(experience|work\s+experience|employment|professional\s+experience|work\s+history|career\s+history)\b',
    "education":      r'\b(education|academic|degree|university|college|b\.tech|m\.tech|bachelor|master|phd|diploma)\b',
    "skills":         r'\b(skills|technical\s+skills|core\s+competencies|technologies|proficiencies|tools|languages\s+and\s+frameworks)\b',
    "projects":       r'\b(projects|key\s+projects|project\s+experience|personal\s+projects|academic\s+projects|portfolio)\b',
    "certifications": r'\b(certifications?|certificates?|credentials?|licenses?|courses?|training)\b',
}

# Weak phrases flagged by ATS / modern recruiters
WEAK_PHRASES = [
    "responsible for", "duties included", "worked on", "helped with",
    "assisted in", "team player", "hard worker", "detail oriented",
    "go-getter", "think outside the box", "synergy", "dynamic",
    "proactive", "results-driven", "references available", "see attached",
    "curriculum vitae", "dear hiring manager", "participated in",
    "self-motivated", "fast learner"
]

# Action verbs strongly favored by ATS and technical hiring managers
STRONG_ACTION_VERBS = [
    "spearheaded", "engineered", "architected", "optimized", "developed",
    "implemented", "designed", "scaled", "automated", "streamlined",
    "orchestrated", "accelerated", "deployed", "refactored", "authored",
    "integrated", "mentored", "standardized", "delivered", "executed",
    "reduced", "increased", "boosted", "configured", "built"
]

# ATS-hostile formatting signals
FORMATTING_ISSUES = {
    "excessive_caps": {
        "pattern": r'\b[A-Z]{5,}\b',
        "threshold": 6,
        "message": "Excessive ALL-CAPS words detected — ATS parsers may misinterpret these as section headers or shouting."
    },
    "special_chars": {
        "pattern": r'[★✦✧✩✪✫✬✭✮✯✰➤➢➣➔➜➝➞➟➠►▶●◆■▪▸]',
        "threshold": 3,
        "message": "Special decorative symbols or irregular bullets detected — use standard hyphens (-) or asterisks (*)."
    },
    "emoji_use": {
        "pattern": r'[\U00010000-\U0010ffff]|[\U0001F600-\U0001F64F]|[\U0001F300-\U0001F5FF]',
        "threshold": 1,
        "message": "Emojis found in resume text — most ATS systems corrupt or fail to parse emoji glyphs."
    },
    "tables_graphics": {
        "pattern": r'(\|.*\|.*\|)|(\+[-+]+\+)',
        "threshold": 1,
        "message": "Tabular or ASCII column layout detected — ATS text parsers frequently scramble table contents."
    },
    "header_footer_artifacts": {
        "pattern": r'(page\s+\d+\s+of\s+\d+|confidential|draft)',
        "threshold": 1,
        "message": "Page numbering or document footer artifacts detected — strip headers/footers for cleaner parsing."
    },
}

CONTACT_PATTERNS = {
    "email":    r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+',
    "phone":    r'(?:\+?\d{1,4}[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{3,4}',
    "linkedin": r'linkedin\.com/in/[\w\-]+',
    "github":   r'github\.com/[\w\-]+',
}


def score_ats(text: str, file_extension: str = ".txt") -> Dict[str, Any]:
    """
    Rule-based ATS Compatibility Scorer.
    Returns ats_score (0–100), grade, detected sections, missing sections,
    formatting issues, action verb analysis, and actionable tips.
    """
    score = 0.0
    formatting_issues: List[str] = []
    ats_tips: List[str] = []
    detected_sections: List[str] = []
    missing_sections: List[str] = []

    # ── 1. File format score (15 pts) ───────────────────────────────────
    ext = file_extension.lower()
    if ext == ".pdf":
        score += 15
    elif ext in [".docx", ".doc"]:
        score += 15
    elif ext == ".txt":
        score += 11
        ats_tips.append("Plain text files are ATS-readable but lack structured formatting. Submitting a clean single-column .pdf or .docx is recommended.")
    else:
        score += 8
        ats_tips.append(f"File format '{ext}' may not be natively supported by all enterprise ATS. Use standard .pdf or .docx.")

    # ── 2. Section headers (30 pts, 5 pts each) ─────────────────────────
    for section_key, pattern in ATS_REQUIRED_SECTIONS.items():
        if re.search(pattern, text, re.IGNORECASE):
            detected_sections.append(section_key.replace("_", " ").title())
            score += 5
        else:
            missing_sections.append(section_key.replace("_", " ").title())

    # ── 3. Contact information (15 pts) ─────────────────────────────────
    contact_found = 0
    for key, pat in CONTACT_PATTERNS.items():
        if re.search(pat, text, re.IGNORECASE):
            contact_found += 1
    if contact_found >= 3:
        score += 15
    elif contact_found == 2:
        score += 12
    elif contact_found == 1:
        score += 7
        ats_tips.append("Only one contact field detected. Include email, phone, and LinkedIn or GitHub URL.")
    else:
        ats_tips.append("No clear contact information found at the header of your CV.")

    # ── 4. Action Verbs Usage (15 pts) ──────────────────────────────────
    verbs_found = []
    for verb in STRONG_ACTION_VERBS:
        if re.search(r'\b' + re.escape(verb) + r'\b', text, re.IGNORECASE):
            verbs_found.append(verb)

    if len(verbs_found) >= 5:
        score += 15
    elif len(verbs_found) >= 3:
        score += 10
    elif len(verbs_found) >= 1:
        score += 5
        ats_tips.append("Consider starting more bullet points with strong power action verbs (e.g. 'Engineered', 'Optimized', 'Architected').")
    else:
        ats_tips.append("Few strong action verbs detected. ATS and recruiters prioritize quantified accomplishment bullets led by strong verbs.")

    # ── 5. Keyword Density & Length Check (15 pts) ──────────────────────
    words = re.findall(r'\b\w+\b', text)
    word_count = len(words)
    if 350 <= word_count <= 950:
        score += 15
    elif 200 <= word_count < 350:
        score += 10
        ats_tips.append("Resume is somewhat brief. Expanding on technical accomplishments and metrics improves keyword ranking.")
    elif 950 < word_count <= 1600:
        score += 10
        ats_tips.append("Resume is somewhat long. Aim for a tight, high-impact 1-2 page layout.")
    elif word_count > 1600:
        score += 5
        ats_tips.append("Resume exceeds 1600 words. ATS and recruiters strongly favor concise 1-2 page documents.")
    else:
        score += 5

    # ── 6. Formatting issues deduction (up to –15 pts) ──────────────────
    deduction = 0
    for issue_key, cfg in FORMATTING_ISSUES.items():
        matches = re.findall(cfg["pattern"], text, re.IGNORECASE | re.DOTALL)
        if len(matches) >= cfg["threshold"]:
            formatting_issues.append(cfg["message"])
            deduction += 3
    score = max(0.0, score - min(deduction, 15))

    # ── 7. Weak/filler phrase detection (deduction up to –5 pts) ─────────
    weak_found = []
    for phrase in WEAK_PHRASES:
        if re.search(r'\b' + re.escape(phrase) + r'\b', text, re.IGNORECASE):
            weak_found.append(phrase)
    if weak_found:
        score = max(0.0, score - min(len(weak_found), 5))
        phrases_str = ", ".join(f'"{p}"' for p in weak_found[:4])
        formatting_issues.append(
            f"Passive or generic phrases detected: {phrases_str}. "
            "Replace with active STAR metrics."
        )

    # ── 8. Section Tips ──────────────────────────────────────────────────
    if "Certifications" not in detected_sections:
        ats_tips.append("No certifications section found. Including verified certifications or courses increases ATS ranking.")
    if "Projects" not in detected_sections:
        ats_tips.append("No distinct projects section detected. Featuring 2–3 portfolio projects significantly improves role match.")
    if "Summary" not in detected_sections:
        ats_tips.append("Add a 2–3 sentence professional summary at the top to serve as the candidate snapshot.")
    if not re.search(CONTACT_PATTERNS["linkedin"], text, re.IGNORECASE):
        ats_tips.append("LinkedIn profile link not found. Recruiters look for it directly on ATS dashboards.")

    # ── Clamp final score ─────────────────────────────────────────────────
    final_score = min(round(score, 1), 100.0)

    return {
        "ats_score": final_score,
        "ats_grade": _grade(final_score),
        "detected_sections": detected_sections,
        "missing_sections": missing_sections,
        "formatting_issues": formatting_issues,
        "ats_tips": ats_tips,
        "weak_phrases_found": weak_found,
        "strong_action_verbs_found": verbs_found[:8],
        "word_count": word_count,
    }


def _grade(score: float) -> str:
    if score >= 85:
        return "Excellent"
    if score >= 70:
        return "Good"
    if score >= 50:
        return "Fair"
    return "Poor"
