import chromadb
from langchain_ollama import OllamaEmbeddings, OllamaLLM
from langchain_core.prompts import PromptTemplate, ChatPromptTemplate\

embeddings_model = OllamaEmbeddings(model="nomic-embed-text")
llm = OllamaLLM(model="llama3.1:8b")

chroma_client = chromadb.PersistentClient(path="./chroma_db")

RAG_PROMPT = PromptTemplate.from_template("""
You are a helpful document assistant. Answer the question using ONLY 
the context provided below. If the answer is not in the context, 
say "I couldn't find this in the document."

Always end your answer with: "📄 Source: Page {page}"

Context:
{context}

Question: {question}

Answer:
""")


def store_chunks(doc_id: str, chunks: list[dict]):
    """Embed chunks and store in ChromaDB."""
    collection = chroma_client.get_or_create_collection(
        name=doc_id,
        metadata={"hnsw:space": "cosine"}
    )
    
    texts = [c["text"] for c in chunks]
    pages = [str(c["page"]) for c in chunks]
    ids = [f"{doc_id}_chunk_{i}" for i in range(len(chunks))]
    
    embedded = embeddings_model.embed_documents(texts)
    
    collection.add(
        embeddings=embedded,
        documents=texts,
        metadatas=[{"page": p} for p in pages],
        ids=ids
    )
    
    return len(chunks)


def query_document(doc_id: str, question: str) -> dict:
    """Find relevant chunks and generate an answer."""
    collection = chroma_client.get_collection(name=doc_id)
    
    question_embedding = embeddings_model.embed_query(question)
    
    results = collection.query(
        query_embeddings=[question_embedding],
        n_results=5
    )
    
    chunks = results["documents"][0]
    pages = [m["page"] for m in results["metadatas"][0]]
    
    context = "\n\n".join(chunks)
    most_relevant_page = pages[0]
    
    prompt = RAG_PROMPT.format(
        context=context,
        question=question,
        page=most_relevant_page
    )
    answer = llm.invoke(prompt)
    
    return {
        "answer": answer,
        "sources": [{"text": c, "page": p} for c, p in zip(chunks, pages)]
    }