import re
from typing import Dict, Any, List

EMAIL_REGEX = r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+'
PHONE_REGEX = r'(?:\+?\d{1,4}[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{3,4}(?:[-.\s]?\d{1,4})?'
LINK_REGEX = r'(?:https?://)?(?:www\.)?(?:linkedin\.com|github\.com|gitlab\.com|kaggle\.com|leetcode\.com|portfolio|behance\.net|medium\.com|[a-zA-Z0-9-]+\.(?:dev|me|io|design|tech))'

SECTION_PATTERNS = {
    "Contact Information": [EMAIL_REGEX, PHONE_REGEX, LINK_REGEX],
    "Experience / Projects": [
        r'\b(work\s+experience|professional\s+experience|employment\s+history|career\s+history|work\s+history|employment|experience|key\s+projects|project\s+experience|featured\s+projects|selected\s+projects)\b'
    ],
    "Education / Credentials": [
        r'\b(education|academic\s+background|academic\s+qualifications|academics|degree|bachelor|master|phd|b\.s|m\.s|b\.tech|m\.tech|bca|mca|mba|diploma|university|college|school|certifications?|certificates?|credentials?|licenses?)\b'
    ],
    "Skills / Technical Proficiency": [
        r'\b(skills|technical\s+skills|technical\s+proficiencies|core\s+competencies|technologies|proficiencies|tools|languages\s+and\s+frameworks|tech\s+stack|programming\s+languages|software\s+skills)\b'
    ],
    "Summary / Objective": [
        r'\b(summary|professional\s+summary|profile|about\s+me|objective|career\s+objective|career\s+summary|executive\s+summary)\b'
    ]
}

PLACEHOLDER_PATTERNS = [
    r'\blorem\s+ipsum\b',
    r'\bdolor\s+sit\s+amet\b',
    r'\[insert\s+[a-z\s]+\]',
    r'\[candidate\s+name\]',
    r'\[company\s+name\]',
]


def evaluate_legitimacy(text: str) -> Dict[str, Any]:
    """
    Evaluates whether the inputted text represents a legitimate CV/Resume.
    Returns boolean pass/fail status, detailed score (0-100), detected sections,
    and specific diagnostic reasons.
    """
    notes: List[str] = []
    detected_sections: List[str] = []
    missing_sections: List[str] = []

    words = re.findall(r'\b\w+\b', text)
    word_count = len(words)

    score = 0.0

    # 0. Check for placeholder / dummy template content
    has_placeholders = any(bool(re.search(p, text, re.IGNORECASE)) for p in PLACEHOLDER_PATTERNS)
    if has_placeholders:
        notes.append("Placeholder or dummy template text (e.g. Lorem Ipsum / [insert ...]) detected.")

    # 1. Word Count Check (Threshold: 60 - 3500 words)
    if word_count < 60:
        notes.append(f"Content length is too short ({word_count} words). A legitimate CV typically contains at least 100+ words.")
    elif word_count > 3500:
        notes.append(f"Content is unusually long ({word_count} words). Consider condensing your CV into 1-2 pages.")
        score += 12.0
    else:
        score += 20.0
        notes.append(f"Valid length ({word_count} words).")

    # 2. Contact Information Check
    has_email = bool(re.search(EMAIL_REGEX, text, re.IGNORECASE))
    has_phone = bool(re.search(PHONE_REGEX, text))
    has_profile = bool(re.search(LINK_REGEX, text, re.IGNORECASE))
    has_contact = has_email or has_phone or has_profile

    if has_contact:
        score += 30.0
        detected_sections.append("Contact Information")
    else:
        missing_sections.append("Contact Information (Email / Phone / Profile URL)")
        notes.append("No valid contact details (email address, phone number, or profile link) found.")

    # 3. Check for Experience / Projects section
    has_exp = any(bool(re.search(p, text, re.IGNORECASE)) for p in SECTION_PATTERNS["Experience / Projects"])
    if has_exp:
        score += 25.0
        detected_sections.append("Experience / Projects")
    else:
        missing_sections.append("Experience / Projects")
        notes.append("No work experience or project history section detected.")

    # 4. Check for Education section
    has_edu = any(bool(re.search(p, text, re.IGNORECASE)) for p in SECTION_PATTERNS["Education / Credentials"])
    if has_edu:
        score += 15.0
        detected_sections.append("Education")
    else:
        missing_sections.append("Education")
        notes.append("No education, degree, or academic background detected.")

    # 5. Check for Skills section
    has_skills = any(bool(re.search(p, text, re.IGNORECASE)) for p in SECTION_PATTERNS["Skills / Technical Proficiency"])
    if has_skills:
        score += 10.0
        detected_sections.append("Skills / Technologies")
    else:
        missing_sections.append("Skills / Technologies")
        notes.append("No dedicated technical skills or tools section detected.")

    # Summary section
    has_summary = any(bool(re.search(p, text, re.IGNORECASE)) for p in SECTION_PATTERNS["Summary / Objective"])
    if has_summary:
        detected_sections.append("Professional Summary")

    if has_placeholders:
        score = max(0.0, score - 20.0)

    # Pass rule: Score >= 50 and must have contact info AND (experience or skills)
    is_legitimate = (score >= 50.0) and has_contact and (has_exp or has_skills)

    if not is_legitimate and not notes:
        notes.append("The document structure does not match standard CV / resume conventions.")

    return {
        "is_legitimate": is_legitimate,
        "score": round(min(score, 100.0), 1),
        "word_count": word_count,
        "detected_sections": detected_sections,
        "missing_sections": missing_sections,
        "has_contact_info": has_contact,
        "has_experience_section": has_exp,
        "has_education_section": has_edu,
        "has_skills_section": has_skills,
        "notes": notes,
    }
