# 📄 Doc Intel — AI Document Assistant

Ask questions about any PDF and get accurate, cited answers instantly.
Built with RAG (Retrieval Augmented Generation) architecture.

## Screenshot
Screenshot.png


## 🛠️ Tech Stack
- **Backend:** Python, FastAPI, LangChain, ChromaDB
- **AI:** Llama 3.1 8B via Ollama (runs 100% locally, free)
- **Embeddings:** nomic-embed-text
- **Frontend:** React, Vite

## ⚙️ How it works
1. Upload any PDF
2. Text is extracted, chunked, and embedded into a vector database
3. Questions are matched to relevant chunks via semantic search
4. Llama 3.1 generates answers grounded in your document
5. Every answer cites the exact source page

## 🚀 Run locally
```bash
# Backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

## 📋 Requirements
- Python 3.11+
- Node.js 18+
- [Ollama](https://ollama.com) with `llama3.1:8b` and `nomic-embed-text`
