import fitz
from langchain_text_splitters import RecursiveCharacterTextSplitter

def extract_text_from_pdf(file_path: str) -> list[dict]:
    """Extract text from PDF, page by page."""
    doc = fitz.open(file_path)
    pages = []
    
    for page_num in range(len(doc)):
        page = doc[page_num]
        text = page.get_text()
        if text.strip():  # skip empty pages
            pages.append({
                "text": text,
                "page": page_num + 1
            })
    
    doc.close()
    return pages


def chunk_pages(pages: list[dict]) -> list[dict]:
    """Split pages into smaller chunks for embedding."""
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50,
        separators=["\n\n", "\n", ".", " "]
    )
    
    chunks = []
    for page in pages:
        splits = splitter.split_text(page["text"])
        for split in splits:
            chunks.append({
                "text": split,
                "page": page["page"]
            })
    
    return chunks
