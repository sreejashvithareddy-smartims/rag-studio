import { useEffect, useState } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { getTechniques, runQuery } from '../api.js'
import { useDocument } from '../context/DocumentContext.jsx'
import SelectedDocBanner from '../components/SelectedDocBanner.jsx'
import TechniqueCard from '../components/TechniqueCard.jsx'
import TechniqueSelect from '../components/TechniqueSelect.jsx'
import AnswerCard from '../components/AnswerCard.jsx'

export default function QueryPage() {
  const { selectedDoc } = useDocument()
  const [techniques, setTechniques] = useState([])
  const [technique, setTechnique] = useState('')
  const [query, setQuery] = useState('')
  const [topK, setTopK] = useState(5)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    getTechniques().then((t) => { setTechniques(t); if (t[0]) setTechnique(t[0].name) })
  }, [])

  const handleRun = async () => {
    if (!selectedDoc || !technique || !query.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await runQuery({ doc_id: selectedDoc.doc_id, technique, query, top_k: Number(topK) })
      setResult(res)
    } catch (e) {
      setError(e?.response?.data?.detail || 'Query failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto py-10 px-8">
      <header className="mb-6">
        <span className="inline-block text-[11px] font-bold uppercase tracking-wide mono-tag text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full mb-3">
          Step 2 of 3
        </span>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Run a Query</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Browse all 18 RAG techniques below — tap a card to flip it and read its definition and best use case. Select one, then ask your question.
        </p>
      </header>

      <SelectedDocBanner doc={selectedDoc} />

      {/* Technique grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {techniques.map((t) => (
          <TechniqueCard key={t.name} technique={t} selected={technique === t.name} onSelect={setTechnique} />
        ))}
      </div>

      {/* Query box */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-card p-6 space-y-5">
        <TechniqueSelect techniques={techniques} value={technique} onChange={setTechnique} label="Selected technique" />

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 mono-tag">Question</label>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            rows={3}
            placeholder="e.g. What are the main risks discussed in this document?"
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 shadow-card outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 transition resize-none"
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mono-tag">top_k</label>
            <input
              type="number"
              min={1}
              max={15}
              value={topK}
              onChange={(e) => setTopK(e.target.value)}
              className="w-16 border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-center mono-tag outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
          <button
            onClick={handleRun}
            disabled={loading || !selectedDoc || !technique || !query.trim()}
            className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition shadow-panel"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            {loading ? 'Retrieving…' : 'Generate answer'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</div>
      )}

      {result && (
        <div className="mt-6">
          <AnswerCard result={result} docId={selectedDoc?.doc_id} showFeedback />
        </div>
      )}
    </div>
  )
}
