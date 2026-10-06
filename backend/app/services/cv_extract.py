import os

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt"}


def extract_text(file_storage, max_bytes: int) -> tuple[str, str]:
    filename = file_storage.filename or ""
    _, ext = os.path.splitext(filename.lower())
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError("unsupported file type")

    data = file_storage.read()
    if not data:
        raise ValueError("empty file")
    if len(data) > max_bytes:
        raise ValueError("file too large")

    if ext == ".pdf":
        from pypdf import PdfReader
        import io

        reader = PdfReader(io.BytesIO(data))
        text = "\n".join((page.extract_text() or "") for page in reader.pages)
    elif ext == ".docx":
        from docx import Document
        import io

        doc = Document(io.BytesIO(data))
        text = "\n".join(p.text for p in doc.paragraphs)
    else:
        text = data.decode("utf-8", errors="replace")

    text = text.strip()
    if not text:
        raise ValueError("could not extract text")
    return text, filename
