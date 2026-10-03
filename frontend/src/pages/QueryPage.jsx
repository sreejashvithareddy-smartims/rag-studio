import { useEffect, useState } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { getTechniques, runQuery } from '../api.js'
import { useDocument } from '../context/DocumentContext.jsx'
import SelectedDocBanner from '../components/SelectedDocBanner.jsx'
import TechniqueCard from '../components/TechniqueCard.jsx'
import TechniqueModal from '../components/TechniqueModal.jsx'
import AnswerCard from '../components/AnswerCard.jsx'
import { CATEGORIES, TECHNIQUE_CATEGORY } from '../data/techniqueCategories.js'
import { useProject } from '../context/ProjectContext.jsx'

export default function QueryPage() {
  const { selectedDoc } = useDocument()
  const [techniques, setTechniques] = useState([])
  const [technique, setTechnique] = useState('')
  const [activeTab, setActiveTab] = useState('chunking')
  const [expandedTechnique, setExpandedTechnique] = useState(null)
  const [query, setQuery] = useState('')
  const [topK, setTopK] = useState(5)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const { selectedProject } = useProject()

  useEffect(() => {
    getTechniques().then((t) => setTechniques(t))
  }, [])

  const selectedTechniqueObj = techniques.find((t) => t.name === technique)
  const visibleTechniques = techniques.filter((t) => TECHNIQUE_CATEGORY[t.name] === activeTab)

  const handleRun = async () => {
    if (!selectedDoc || !technique || !query.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await runQuery({ doc_id: selectedDoc.doc_id, technique, query, top_k: Number(topK), project_id: selectedProject?.project_id })
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
          Choose a chunking/indexing method and a retrieval/ranking method, or just pick one technique below.
        </p>
      </header>

      <SelectedDocBanner doc={selectedDoc} />

      {/* Selected technique queue bar — always visible at top */}
      <div className="sticky top-0 z-10 bg-[#F7F8FB]/90 backdrop-blur-sm pt-1 pb-3 mb-2 -mx-2 px-2">
        <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-card">
          <span className="text-[11px] font-semibold uppercase tracking-wide mono-tag text-slate-400 shrink-0">
            Selected:
          </span>
          {selectedTechniqueObj ? (
            <span className="flex items-center gap-2 bg-brand-50 text-brand-700 text-sm font-semibold px-3 py-1 rounded-lg">
              #{String(selectedTechniqueObj.number).padStart(2, '0')} {selectedTechniqueObj.label}
            </span>
          ) : (
            <span className="text-sm text-slate-400 italic">none yet — pick a card below</span>
          )}
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 mb-4">
        {Object.entries(CATEGORIES).map(([key, cat]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition border ${
              activeTab === key
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
            }`}
          >
            {cat.title}
          </button>
        ))}
      </div>
      <p className="text-xs text-slate-400 mb-4">{CATEGORIES[activeTab].subtitle}</p>

      {/* Technique grid — filtered by active tab */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
        {visibleTechniques.map((t) => (
          <TechniqueCard
            key={t.name}
            technique={t}
            selected={technique === t.name}
            onSelect={setTechnique}
            onExpand={setExpandedTechnique}
          />
        ))}
      </div>

      <TechniqueModal technique={expandedTechnique} onClose={() => setExpandedTechnique(null)} />

      {/* Query box */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-card p-6 space-y-5">
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