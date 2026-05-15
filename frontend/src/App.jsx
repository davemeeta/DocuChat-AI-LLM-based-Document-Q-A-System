import { useState } from "react"
import axios from "axios"
import "./index.css"

const API = "http://127.0.0.1:8000"

function App() {
  const [docId, setDocId] = useState(null)
  const [filename, setFilename] = useState("")
  const [uploading, setUploading] = useState(false)
  const [uploadInfo, setUploadInfo] = useState(null)
  const [question, setQuestion] = useState("")
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)

  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploading(true)
    setMessages([])
    setUploadInfo(null)

    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await axios.post(`${API}/upload`, formData)
      setDocId(res.data.doc_id)
      setFilename(res.data.filename)
      setUploadInfo(res.data)
      setMessages([{
        role: "assistant",
        text: `✅ **${res.data.filename}** loaded successfully! ${res.data.pages} pages, ${res.data.chunks} chunks indexed. Ask me anything about it.`
      }])
    } catch (err) {
      alert("Upload failed. Make sure the backend is running.")
    } finally {
      setUploading(false)
    }
  }

  const handleQuery = async () => {
    if (!question.trim() || !docId) return

    const userMessage = { role: "user", text: question }
    setMessages(prev => [...prev, userMessage])
    setQuestion("")
    setLoading(true)

    try {
      const res = await axios.post(`${API}/query`, {
        doc_id: docId,
        question: question
      })

      const botMessage = {
        role: "assistant",
        text: res.data.answer,
        sources: res.data.sources
      }
      setMessages(prev => [...prev, botMessage])
    } catch (err) {
      setMessages(prev => [...prev, {
        role: "assistant",
        text: "❌ Something went wrong. Please try again."
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleQuery()
    }
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.logo}>📄</span>
          <div>
            <h1 style={styles.title}>Doc Intel</h1>
            <p style={styles.subtitle}>AI-powered document assistant</p>
          </div>
        </div>
        {uploadInfo && (
          <div style={styles.docBadge}>
            <span style={styles.docBadgeIcon}>📎</span>
            <span style={styles.docBadgeText}>{filename}</span>
            <span style={styles.docBadgeMeta}>{uploadInfo.pages}p · {uploadInfo.chunks} chunks</span>
          </div>
        )}
      </div>

      {/* Main area */}
      <div style={styles.main}>
        {!docId ? (
          /* Upload screen */
          <div style={styles.uploadArea}>
            <div style={styles.uploadBox}>
              <span style={styles.uploadIcon}>📂</span>
              <h2 style={styles.uploadTitle}>Upload a PDF to get started</h2>
              <p style={styles.uploadSub}>Ask questions, get cited answers instantly</p>
              <label style={styles.uploadBtn}>
                {uploading ? "Processing..." : "Choose PDF"}
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleUpload}
                  style={{ display: "none" }}
                  disabled={uploading}
                />
              </label>
              {uploading && (
                <p style={styles.uploadingText}>
                  ⏳ Embedding document... this takes 1-2 minutes
                </p>
              )}
            </div>
          </div>
        ) : (
          /* Chat screen */
          <div style={styles.chatArea}>
            {/* Messages */}
            <div style={styles.messages}>
              {messages.map((msg, i) => (
                <div key={i} style={msg.role === "user" ? styles.userMsg : styles.botMsg}>
                  <div style={msg.role === "user" ? styles.userBubble : styles.botBubble}>
                    {msg.text}
                  </div>
                  {/* Sources */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div style={styles.sources}>
                      <p style={styles.sourcesLabel}>📄 Sources used:</p>
                      {msg.sources.slice(0, 2).map((src, j) => (
                        <div key={j} style={styles.sourceChip}>
                          <span style={styles.sourcePage}>Page {src.page}</span>
                          <span style={styles.sourceText}>
                            {src.text.slice(0, 120)}...
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div style={styles.botMsg}>
                  <div style={styles.botBubble}>
                    <span style={styles.thinking}>⏳ Thinking...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div style={styles.inputRow}>
              <textarea
                style={styles.input}
                value={question}
                onChange={e => setQuestion(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about your document..."
                rows={2}
                disabled={loading}
              />
              <button
                style={loading || !question.trim() ? styles.sendBtnDisabled : styles.sendBtn}
                onClick={handleQuery}
                disabled={loading || !question.trim()}
              >
                Ask
              </button>
            </div>
            <p style={styles.hint}>Press Enter to send · Shift+Enter for new line</p>

            {/* Upload another */}
            <label style={styles.uploadAnotherBtn}>
              📂 Upload different PDF
              <input
                type="file"
                accept=".pdf"
                onChange={handleUpload}
                style={{ display: "none" }}
              />
            </label>
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    background: "#0f0f0f",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 24px",
    borderBottom: "1px solid #222",
    background: "#141414",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  logo: { fontSize: "28px" },
  title: { fontSize: "18px", fontWeight: "600", color: "#fff" },
  subtitle: { fontSize: "12px", color: "#666" },
  docBadge: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: "8px",
    padding: "8px 14px",
  },
  docBadgeIcon: { fontSize: "14px" },
  docBadgeText: { fontSize: "13px", color: "#ccc", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  docBadgeMeta: { fontSize: "11px", color: "#555" },
  main: {
    flex: 1,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  uploadArea: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  uploadBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
    padding: "48px",
    border: "2px dashed #2a2a2a",
    borderRadius: "16px",
    maxWidth: "420px",
    width: "100%",
    textAlign: "center",
  },
  uploadIcon: { fontSize: "48px" },
  uploadTitle: { fontSize: "20px", fontWeight: "600", color: "#fff" },
  uploadSub: { fontSize: "14px", color: "#666" },
  uploadBtn: {
    background: "#1D9E75",
    color: "#fff",
    padding: "12px 32px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    border: "none",
  },
  uploadingText: { fontSize: "13px", color: "#888", marginTop: "8px" },
  chatArea: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    height: "100%",
    overflow: "hidden",
    padding: "0 24px 16px",
  },
  messages: {
    flex: 1,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    padding: "20px 0",
  },
  userMsg: { display: "flex", flexDirection: "column", alignItems: "flex-end" },
  botMsg: { display: "flex", flexDirection: "column", alignItems: "flex-start", maxWidth: "80%" },
  userBubble: {
    background: "#1D9E75",
    color: "#fff",
    padding: "10px 16px",
    borderRadius: "12px 12px 2px 12px",
    fontSize: "14px",
    maxWidth: "60%",
    lineHeight: "1.5",
  },
  botBubble: {
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    color: "#e0e0e0",
    padding: "12px 16px",
    borderRadius: "2px 12px 12px 12px",
    fontSize: "14px",
    lineHeight: "1.6",
    whiteSpace: "pre-wrap",
  },
  sources: {
    marginTop: "8px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    maxWidth: "100%",
  },
  sourcesLabel: { fontSize: "11px", color: "#555", marginBottom: "2px" },
  sourceChip: {
    background: "#141414",
    border: "1px solid #222",
    borderRadius: "6px",
    padding: "8px 10px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  sourcePage: { fontSize: "11px", color: "#1D9E75", fontWeight: "500" },
  sourceText: { fontSize: "11px", color: "#555", lineHeight: "1.4" },
  thinking: { color: "#666", fontStyle: "italic" },
  inputRow: {
    display: "flex",
    gap: "10px",
    alignItems: "flex-end",
    marginTop: "8px",
  },
  input: {
    flex: 1,
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: "10px",
    color: "#f0f0f0",
    padding: "12px 16px",
    fontSize: "14px",
    resize: "none",
    outline: "none",
    fontFamily: "inherit",
    lineHeight: "1.5",
  },
  sendBtn: {
    background: "#1D9E75",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "12px 24px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
  },
  sendBtnDisabled: {
    background: "#1a1a1a",
    color: "#444",
    border: "1px solid #2a2a2a",
    borderRadius: "10px",
    padding: "12px 24px",
    fontSize: "14px",
    cursor: "not-allowed",
  },
  hint: { fontSize: "11px", color: "#444", marginTop: "6px" },
  uploadAnotherBtn: {
    fontSize: "12px",
    color: "#555",
    cursor: "pointer",
    marginTop: "8px",
    textAlign: "center",
    display: "block",
  },
}

export default App
