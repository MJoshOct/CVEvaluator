import re
from typing import Dict, Any, List

# Standard ATS-expected section headers
ATS_REQUIRED_SECTIONS = {
    "summary":      r'\b(summary|professional\s+summary|profile|objective|about\s+me|career\s+objective)\b',
    "experience":   r'\b(experience|work\s+experience|employment|professional\s+experience|work\s+history)\b',
    "education":    r'\b(education|academic|degree|university|college|b\.tech|m\.tech|bachelor|master|phd)\b',
    "skills":       r'\b(skills|technical\s+skills|core\s+competencies|technologies|proficiencies|tools)\b',
    "projects":     r'\b(projects|key\s+projects|project\s+experience|personal\s+projects|academic\s+projects)\b',
    "certifications": r'\b(certifications?|certificates?|credentials?|licenses?|courses?|training)\b',
}

# Filler/weak phrases commonly flagged by ATS systems
WEAK_PHRASES = [
    "responsible for", "duties included", "worked on", "helped with",
    "assisted in", "team player", "hard worker", "detail oriented",
    "go-getter", "think outside the box", "synergy", "dynamic",
    "proactive", "results-driven", "references available", "see attached",
    "curriculum vitae", "dear hiring manager",
]

# ATS-hostile formatting signals detectable in extracted text
FORMATTING_ISSUES = {
    "excessive_caps": {
        "pattern": r'\b[A-Z]{5,}\b',
        "threshold": 6,
        "message": "Excessive ALL-CAPS text detected — ATS may misread these as noise or headers."
    },
    "special_chars": {
        "pattern": r'[★✦✧✩✪✫✬✭✮✯✰➤➢➣➔➜➝➞➟➠►▶●◆■▪▸]',
        "threshold": 3,
        "message": "Decorative symbols or bullet glyphs detected — replace with plain dashes or asterisks."
    },
    "emoji_use": {
        "pattern": r'[\U00010000-\U0010ffff]|[\U0001F600-\U0001F64F]|[\U0001F300-\U0001F5FF]',
        "threshold": 1,
        "message": "Emojis found in resume — most ATS systems strip or misparse emoji characters."
    },
    "tables_graphics": {
        "pattern": r'(\|.*\|.*\|)|(\+[-+]+\+)',
        "threshold": 1,
        "message": "Table/grid formatting detected — ATS systems often cannot parse tabular layouts correctly."
    },
    "header_footer_artifacts": {
        "pattern": r'(page\s+\d+\s+of\s+\d+|confidential|draft)',
        "threshold": 1,
        "message": "Page number or header/footer artifacts detected — remove before submission."
    },
}

CONTACT_PATTERNS = {
    "email":    r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+',
    "phone":    r'(?:\+?\d{1,3}[-.s]?)?(?:\d{2,4}[-.\s]?){2,4}\d{3,4}',
    "linkedin": r'linkedin\.com/in/[\w\-]+',
    "github":   r'github\.com/[\w\-]+',
}


def score_ats(text: str, file_extension: str = ".txt") -> Dict[str, Any]:
    """
    Rule-based ATS Compatibility Scorer.
    Returns ats_score (0–100), detected sections, missing sections,
    formatting issues, and actionable tips.
    """
    score = 0.0
    formatting_issues: List[str] = []
    ats_tips: List[str] = []
    detected_sections: List[str] = []
    missing_sections: List[str] = []

    # ── 1. File format score (20 pts) ───────────────────────────────────
    ext = file_extension.lower()
    if ext == ".pdf":
        score += 20
    elif ext in [".docx", ".doc"]:
        score += 18
    elif ext == ".txt":
        score += 14
        ats_tips.append("Plain text files are ATS-safe but lack formatting. Consider submitting a clean .pdf or .docx.")
    else:
        score += 10
        ats_tips.append(f"File format '{ext}' may not be supported by all ATS. Use .pdf or .docx.")

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
    if contact_found >= 2:
        score += 15
    elif contact_found == 1:
        score += 8
        ats_tips.append("Only one contact detail found. Add email, phone, and a LinkedIn/GitHub URL.")
    else:
        ats_tips.append("No contact information detected. Add email and phone at the top.")

    # ── 4. Formatting issues (deductions up to –15 pts) ──────────────────
    deduction = 0
    for issue_key, cfg in FORMATTING_ISSUES.items():
        matches = re.findall(cfg["pattern"], text, re.IGNORECASE | re.DOTALL)
        if len(matches) >= cfg["threshold"]:
            formatting_issues.append(cfg["message"])
            deduction += 3
    score = max(0, score - min(deduction, 15))

    # ── 5. Keyword density — word count check (10 pts) ───────────────────
    words = re.findall(r'\b\w+\b', text)
    word_count = len(words)
    if 300 <= word_count <= 700:
        score += 10
    elif 150 <= word_count < 300:
        score += 5
        ats_tips.append("Resume is on the shorter side. ATS ranks keyword-rich content higher.")
    elif word_count > 700:
        score += 7
        ats_tips.append("Resume is lengthy. ATS prefers concise 1–2 page resumes for most roles.")

    # ── 6. Weak/filler phrase detection (deduction up to –5 pts) ─────────
    weak_found = []
    for phrase in WEAK_PHRASES:
        if re.search(r'\b' + re.escape(phrase) + r'\b', text, re.IGNORECASE):
            weak_found.append(phrase)
    if weak_found:
        score = max(0, score - min(len(weak_found), 5))
        phrases_str = ", ".join(f'"{p}"' for p in weak_found[:5])
        formatting_issues.append(
            f"Weak/filler phrases detected: {phrases_str}. "
            "Replace with specific, achievement-oriented language."
        )

    # ── 7. Remaining actionable tips ─────────────────────────────────────
    if "Certifications" not in detected_sections:
        ats_tips.append("No certifications section found. Even short online course completions improve ATS ranking.")
    if "Projects" not in detected_sections:
        ats_tips.append("No projects section detected. Including 2–3 relevant projects significantly boosts technical role matching.")
    if "Summary" not in detected_sections:
        ats_tips.append("Add a professional summary at the top — many ATS systems extract this as the candidate overview.")
    if not re.search(CONTACT_PATTERNS["linkedin"], text, re.IGNORECASE):
        ats_tips.append("LinkedIn profile URL not found. Including it improves recruiter trust and ATS profile completeness.")

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
