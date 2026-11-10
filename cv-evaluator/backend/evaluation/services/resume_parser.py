import re
from datetime import datetime
from typing import Dict, Any, List, Optional
from .role_dataset import load_roles_criteria

EMAIL_REGEX = r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+'
PHONE_REGEX = r'(?:\+?\d{1,4}[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{3,4}'
LINKEDIN_REGEX = r'(?:https?://)?(?:www\.)?linkedin\.com/in/([a-zA-Z0-9_-]+)'
GITHUB_REGEX = r'(?:https?://)?(?:www\.)?github\.com/([a-zA-Z0-9_-]+)'
URL_REGEX = r'https?://[^\s,;"\'<>)]+'

TITLE_FILTER = r'\b(software\s+engineer|developer|architect|designer|analyst|manager|consultant|specialist|curriculum\s+vitae|resume|page\s+\d+|contact|phone|email)\b'


def _extract_name(text: str) -> Optional[str]:
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    if not lines:
        return None
    for line in lines[:5]:
        # Skip if contains email, phone, or url
        if re.search(EMAIL_REGEX, line) or re.search(URL_REGEX, line):
            continue
        # Skip if contains common resume titles or job titles
        if re.search(TITLE_FILTER, line, re.IGNORECASE):
            continue
        words = line.split()
        if 1 <= len(words) <= 4:
            cleaned = re.sub(r'[^a-zA-Z\s.\'-]', '', line).strip()
            if cleaned and 2 <= len(cleaned.split()) <= 4:
                return cleaned
    # Fallback to first line if it looks reasonable
    first_line = re.sub(r'[^a-zA-Z\s.\'-]', '', lines[0]).strip()
    if first_line and len(first_line.split()) <= 4:
        return first_line
    return None


def _extract_skills(text: str) -> List[str]:
    # Look for dedicated skills section
    pattern = r'(?:^|\n)\s*(?:technical\s+skills|core\s+skills|skills\s*&?\s*tools|skills|technologies|proficiencies|languages\s+and\s+frameworks)\s*[:\n]([\s\S]*?)(?=\n\s*(?:[A-Z][A-Za-z\s]{2,25}[:\n]|$))'
    match = re.search(pattern, text, re.IGNORECASE)
    skills: List[str] = []

    if match:
        section_text = match.group(1).strip()
        raw_items = re.split(r'[,•|·*;\n\r\t]+', section_text)
        for item in raw_items:
            clean = re.sub(r'^[-\s]+', '', item).strip()
            clean = re.sub(r'^[A-Za-z\s]+:\s*', '', clean).strip()
            if clean and len(clean) < 40 and not re.search(r'\b(experience|education|projects)\b', clean, re.IGNORECASE):
                if clean not in skills:
                    skills.append(clean)

    # Fallback/enrichment: if skills count is low, extract known skills from roles_criteria.json
    if len(skills) < 8:
        try:
            criteria = load_roles_criteria()
            for role_data in criteria.values():
                for candidate_skill in (role_data.get("core_skills", []) + role_data.get("frameworks_and_tools", [])):
                    escaped = re.escape(candidate_skill)
                    if re.search(rf'\b{escaped}\b', text, re.IGNORECASE):
                        if candidate_skill not in skills:
                            skills.append(candidate_skill)
        except Exception:
            pass

    return skills[:35]


def _extract_education(text: str) -> List[Dict[str, str]]:
    edu_list: List[Dict[str, str]] = []
    pattern = r'(?:^|\n)\s*(?:education|academic\s+background|academic\s+qualifications|academics)\s*[:\n]([\s\S]*?)(?=\n\s*(?:[A-Z][A-Za-z\s]{2,25}[:\n]|$))'
    match = re.search(pattern, text, re.IGNORECASE)

    edu_section = match.group(1).strip() if match else text
    lines = [line.strip() for line in edu_section.splitlines() if line.strip()]

    degree_pattern = r'\b(b\.?tech|m\.?tech|b\.?s\.?|m\.?s\.?|b\.?a\.?|m\.?a\.?|bachelor[a-zA-Z\s]*|master[a-zA-Z\s]*|ph\.?d\.?|associate|diploma|bca|mca|bba|mba)\b'
    inst_pattern = r'\b([A-Za-z\s]*(?:university|college|institute|academy|school|polytechnic)[A-Za-z\s]*)\b'
    year_pattern = r'\b((?:19|20)\d{2}(?:\s*[-–—]\s*(?:(?:19|20)\d{2}|present|current))?)\b'

    current_entry: Dict[str, str] = {"degree": "", "institution": "", "year": ""}

    for line in lines[:15]:
        deg_match = re.search(degree_pattern, line, re.IGNORECASE)
        inst_match = re.search(inst_pattern, line, re.IGNORECASE)
        yr_match = re.search(year_pattern, line, re.IGNORECASE)

        if deg_match:
            current_entry["degree"] = deg_match.group(0).strip()
        if inst_match:
            current_entry["institution"] = inst_match.group(0).strip()
        if yr_match:
            current_entry["year"] = yr_match.group(0).strip()

        if current_entry["degree"] or current_entry["institution"]:
            if current_entry not in edu_list:
                edu_list.append(dict(current_entry))
                current_entry = {"degree": "", "institution": "", "year": ""}

    deduped = []
    for item in edu_list:
        if item not in deduped and (item["degree"] or item["institution"]):
            deduped.append(item)
    return deduped[:5]


def _extract_certifications(text: str) -> List[str]:
    pattern = r'(?:^|\n)\s*(?:certifications?|certificates?|credentials?|licenses?|courses?)\s*[:\n]([\s\S]*?)(?=\n\s*(?:[A-Z][A-Za-z\s]{2,25}[:\n]|$))'
    match = re.search(pattern, text, re.IGNORECASE)
    certs: List[str] = []
    if match:
        section_text = match.group(1).strip()
        raw_items = re.split(r'[\n\r•*]+', section_text)
        for item in raw_items:
            clean = re.sub(r'^[-\s]+', '', item).strip()
            if clean and 3 < len(clean) < 100:
                if clean not in certs:
                    certs.append(clean)
    return certs[:10]


def _extract_experience_years(text: str) -> float:
    """
    Extracts experience year ranges and merges overlapping intervals
    to calculate true cumulative experience without double-counting.
    """
    range_pattern = r'\b(19\d{2}|20\d{2})\s*(?:–|-|—|to)\s*(19\d{2}|20\d{2}|present|current)\b'
    matches = re.findall(range_pattern, text, re.IGNORECASE)

    current_year = datetime.now().year
    intervals = []

    for start_str, end_str in matches:
        start = int(start_str)
        if re.search(r'present|current', end_str, re.IGNORECASE):
            end = current_year
        else:
            try:
                end = int(end_str)
            except ValueError:
                end = current_year

        if end >= start and (end - start) <= 40:
            intervals.append((start, end))

    if not intervals:
        return 0.0

    # Sort and merge intervals
    intervals.sort(key=lambda x: x[0])
    merged = []
    for cur in intervals:
        if not merged:
            merged.append(cur)
        else:
            prev_start, prev_end = merged[-1]
            if cur[0] <= prev_end:
                merged[-1] = (prev_start, max(prev_end, cur[1]))
            else:
                merged.append(cur)

    total_years = sum(max(end - start, 1) for start, end in merged)
    return round(min(float(total_years), 40.0), 1)


def parse_resume(text: str) -> Dict[str, Any]:
    """
    Structured resume data extractor.
    Extracts candidate name, contact info, links, skills, education, certifications, and tenure.
    """
    # Email
    email_match = re.search(EMAIL_REGEX, text, re.IGNORECASE)
    email = email_match.group(0) if email_match else None

    # Phone
    phone_match = re.search(PHONE_REGEX, text)
    phone = phone_match.group(0).strip() if phone_match else None

    # LinkedIn
    linkedin_match = re.search(LINKEDIN_REGEX, text, re.IGNORECASE)
    linkedin = f"https://linkedin.com/in/{linkedin_match.group(1)}" if linkedin_match else None

    # GitHub
    github_match = re.search(GITHUB_REGEX, text, re.IGNORECASE)
    github = f"https://github.com/{github_match.group(1)}" if github_match else None

    # Portfolio
    all_urls = re.findall(URL_REGEX, text)
    portfolio = None
    for u in all_urls:
        if not re.search(r'(linkedin\.com|github\.com)', u, re.IGNORECASE):
            portfolio = u.rstrip('.,;)')
            break

    name = _extract_name(text)
    skills = _extract_skills(text)
    education = _extract_education(text)
    certifications = _extract_certifications(text)
    experience_years = _extract_experience_years(text)

    return {
        "name": name,
        "email": email,
        "phone": phone,
        "linkedin": linkedin,
        "github": github,
        "portfolio": portfolio,
        "skills": skills,
        "education": education,
        "certifications": certifications,
        "total_experience_years": experience_years,
    }
