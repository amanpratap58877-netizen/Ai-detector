import io
import re

def extract_text_from_file(file_bytes: bytes, filename: str):
    """
    Extracts text from PDF, DOCX, TXT, RTF files and organizes into logical sections.
    """
    ext = filename.split(".")[-1].lower() if "." in filename else "txt"
    sections = []

    if ext == "pdf":
        sections = extract_pdf(file_bytes)
    elif ext in ["docx", "doc"]:
        sections = extract_docx(file_bytes)
    elif ext in ["txt", "rtf", "ppt", "pptx"]:
        sections = extract_plaintext(file_bytes, ext)
    else:
        sections = extract_plaintext(file_bytes, "txt")

    # If no sections or empty, return fallback
    if not sections or all(not s["text"].strip() for s in sections):
        sections = [{"sectionTitle": "Main Content", "text": "No parseable text found in file."}]

    return sections

def extract_pdf(file_bytes: bytes):
    import pypdf
    reader = pypdf.PdfReader(io.BytesIO(file_bytes))
    sections = []
    
    for page_idx, page in enumerate(reader.pages):
        text = page.extract_text() or ""
        text = clean_text(text)
        if text.strip():
            sections.append({
                "sectionTitle": f"Page {page_idx + 1}",
                "text": text
            })
    return sections

def extract_docx(file_bytes: bytes):
    import docx
    doc = docx.Document(io.BytesIO(file_bytes))
    sections = []
    current_title = "Introduction"
    current_paragraphs = []

    for p in doc.paragraphs:
        text = clean_text(p.text)
        if not text:
            continue
        # Check if heading
        if p.style and "Heading" in p.style.name:
            if current_paragraphs:
                sections.append({
                    "sectionTitle": current_title,
                    "text": " ".join(current_paragraphs)
                })
                current_paragraphs = []
            current_title = text
        else:
            current_paragraphs.append(text)

    if current_paragraphs:
        sections.append({
            "sectionTitle": current_title,
            "text": " ".join(current_paragraphs)
        })

    return sections

def extract_plaintext(file_bytes: bytes, ext: str):
    text = ""
    for enc in ["utf-8", "latin-1", "cp1252"]:
        try:
            text = file_bytes.decode(enc)
            break
        except:
            continue

    if ext == "rtf":
        # Basic RTF control word stripping
        text = re.sub(r"\\[a-z]+[0-9]*\s?", " ", text)
        text = re.sub(r"[{}]", " ", text)

    text = clean_text(text)
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]

    if not paragraphs:
        paragraphs = [text] if text else []

    sections = []
    for idx, p in enumerate(paragraphs):
        sections.append({
            "sectionTitle": f"Section {idx + 1}",
            "text": p
        })
    return sections

def clean_text(text: str) -> str:
    text = re.sub(r"\r\n|\r", "\n", text)
    text = re.sub(r"[ \t]+", " ", text)
    return text.strip()
