import os
import uuid
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from services.pdf_processor import extract_text_from_pdf, chunk_pages
from services.rag_engine import store_chunks, query_document

app = FastAPI(title="Doc Intel RAG")

# Allow React frontend to talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store doc_ids in memory (simple for now)
active_documents = {}


class QueryRequest(BaseModel):
    doc_id: str
    question: str


@app.get("/")
def root():
    return {"status": "Doc Intel RAG is running 🚀"}


@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    """Upload a PDF, process it, store embeddings."""
    
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files allowed")
    
    # Save file to uploads/
    doc_id = str(uuid.uuid4())[:8]  # short unique ID
    file_path = f"uploads/{doc_id}_{file.filename}"
    
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)
    
    # Extract text + chunk it
    pages = extract_text_from_pdf(file_path)
    if not pages:
        raise HTTPException(status_code=400, detail="Could not extract text from PDF")
    
    chunks = chunk_pages(pages)
    
    # Embed + store in ChromaDB
    num_chunks = store_chunks(doc_id, chunks)
    
    # Remember this doc
    active_documents[doc_id] = file.filename
    
    return {
        "doc_id": doc_id,
        "filename": file.filename,
        "pages": len(pages),
        "chunks": num_chunks,
        "message": "Document processed successfully ✅"
    }


@app.post("/query")
async def query(request: QueryRequest):
    """Ask a question about an uploaded document."""
    
    if request.doc_id not in active_documents:
        raise HTTPException(status_code=404, detail="Document not found. Please upload first.")
    
    result = query_document(request.doc_id, request.question)
    
    return {
        "question": request.question,
        "answer": result["answer"],
        "sources": result["sources"]
    }


@app.get("/documents")
def list_documents():
    """List all uploaded documents."""
    return {"documents": active_documents}
