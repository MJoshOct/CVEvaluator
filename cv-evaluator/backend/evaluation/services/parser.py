import io
import re
from typing import Tuple, Optional
from pypdf import PdfReader
import docx

def extract_text_from_bytes(filename: str, content: bytes) -> Tuple[str, Optional[str]]:
    """
    Extracts plain text and attempts to infer a candidate name from file bytes.
    Supports .pdf, .docx, and text files.
    """
    text = ""
    lower_fn = filename.lower()
    
    if lower_fn.endswith(".pdf"):
        reader = PdfReader(io.BytesIO(content))
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    elif lower_fn.endswith(".docx"):
        doc = docx.Document(io.BytesIO(content))
        text = "\n".join([p.text for p in doc.paragraphs if p.text.strip()])
    else:
        # Default to utf-8 text
        try:
            text = content.decode("utf-8")
        except UnicodeDecodeError:
            text = content.decode("latin-1", errors="ignore")

    cleaned_text = re.sub(r'\s+', ' ', text).strip()
    
    # Simple heuristic to extract candidate name from top lines
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    candidate_name = None
    if lines:
        first_line = lines[0]
        # If the first line is short and doesn't look like a header like "RESUME" or "CURRICULUM VITAE"
        if len(first_line.split()) <= 4 and not re.search(r'(resume|curriculum|cv|page|profile|summary)', first_line, re.IGNORECASE):
            candidate_name = first_line

    return text.strip(), candidate_name
