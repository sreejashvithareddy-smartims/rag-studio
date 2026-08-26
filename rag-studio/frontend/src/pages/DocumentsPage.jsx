import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UploadCloud, FileText, Trash2, Loader2, CheckCircle2, AlertCircle, ArrowRight, CircleDot, Circle } from 'lucide-react'
import { getDocuments, uploadDocument, deleteDocument } from '../api.js'
import { useDocument } from '../context/DocumentContext.jsx'

export default function DocumentsPage() {
  const [docs, setDocs] = useState([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const inputRef = useRef(null)
  const navigate = useNavigate()
  const { selectedDoc, setSelectedDoc } = useDocument()

  const refresh = () => getDocuments().then(setDocs).catch(() => {})

  useEffect(() => { refresh() }, [])

  const handleFile = async (file) => {
    if (!file) return
    setUploading(true)
    setProgress(0)
    setError(null)
    setSuccess(null)
    try {
      const meta = await uploadDocument(file, setProgress)
      setSuccess(`"${meta.filename}" indexed successfully across all 18 technique indexes.`)
      setSelectedDoc(meta)
      refresh()
    } catch (e) {
      setError(e?.response?.data?.detail || 'Upload failed. Check backend logs / API key.')
    } finally {
      setUploading(false)
    }
  }

  const onDrop = (e) => {
    e.preventDefault()
    handleFile(e.dataTransfer.files?.[0])
  }

  const handleDelete = async (docId) => {
    await deleteDocument(docId)
    if (selectedDoc?.doc_id === docId) setSelectedDoc(null)
    refresh()
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-8">
      <header className="mb-8">
        <span className="inline-block text-[11px] font-bold uppercase tracking-wide mono-tag text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full mb-3">
          Step 1 of 3
        </span>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Select a Document</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Upload a source document. RAG Studio pre-builds a ChromaDB vector index for every one of the 18 retrieval techniques so switching between them later is instant.
        </p>
      </header>

      <div
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="cursor-pointer border-2 border-dashed border-slate-300 hover:border-brand-400 hover:bg-brand-50/30 transition rounded-2xl p-10 flex flex-col items-center justify-center text-center bg-white shadow-card"
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.txt,.md"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center mb-3">
          <UploadCloud className="text-brand-500" size={22} />
        </div>
        <p className="text-sm font-semibold text-slate-700">Drop a PDF, TXT, or MD file here</p>
        <p className="text-xs text-slate-400 mt-1">or click to browse — indexing happens automatically</p>

        {uploading && (
          <div className="w-64 mt-5">
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-brand-500 transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 mono-tag flex items-center justify-center gap-1">
              <Loader2 size={12} className="animate-spin" /> building 18 technique indexes…
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertCircle size={16} /> {error}
        </div>
      )}
      {success && (
        <div className="mt-4 flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
          <CheckCircle2 size={16} /> {success}
        </div>
      )}

      <div className="mt-10">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mono-tag mb-3">
          Library ({docs.length}) — click a document to select it
        </h2>

        {docs.length === 0 ? (
          <p className="text-sm text-slate-400 italic">No documents uploaded yet.</p>
        ) : (
          <div className="space-y-2">
            {docs.map((d) => {
              const isSelected = selectedDoc?.doc_id === d.doc_id
              return (
                <div
                  key={d.doc_id}
                  onClick={() => setSelectedDoc(d)}
                  className={`flex items-center justify-between border rounded-xl px-4 py-3 shadow-card cursor-pointer transition ${
                    isSelected ? 'bg-brand-50 border-brand-300 ring-1 ring-brand-300' : 'bg-white border-slate-200 hover:border-brand-200'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {isSelected ? <CircleDot size={18} className="text-brand-600 shrink-0" /> : <Circle size={18} className="text-slate-300 shrink-0" />}
                    <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                      <FileText size={16} className="text-slate-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{d.filename}</p>
                      <p className="text-[11px] text-slate-400 mono-tag">
                        {d.num_fixed_chunks} chunks · {d.num_pages} page(s) · {d.num_entities} entities{d.images_detected ? ' · images detected' : ''}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(d.doc_id) }}
                    className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition shrink-0"
                    title="Delete document"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {selectedDoc && (
        <div className="mt-8 flex justify-end">
          <button
            onClick={() => navigate('/query')}
            className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition shadow-panel"
          >
            Continue with "{selectedDoc.filename}" <ArrowRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
