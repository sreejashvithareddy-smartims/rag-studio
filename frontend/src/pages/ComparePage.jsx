import { useEffect, useState } from 'react'
import { Swords, Loader2, Trophy, Scale, Sparkles } from 'lucide-react'
import { getTechniques, runCompare } from '../api.js'
import { useDocument } from '../context/DocumentContext.jsx'
import SelectedDocBanner from '../components/SelectedDocBanner.jsx'
import TechniqueSelect from '../components/TechniqueSelect.jsx'
import AnswerCard from '../components/AnswerCard.jsx'
import MetricBar from '../components/MetricBar.jsx'
import { TECHNIQUE_CATEGORY } from '../data/techniqueCategories.js'
import { BEST_COMBINATIONS } from '../data/bestCombinations.js'
import { useProject } from '../context/ProjectContext.jsx'

const COLOR_A = '#3b5bff'
const COLOR_B = '#14b8a6'

const TABS = {
  chunking: { title: 'Chunking Comparison', subtitle: 'Compare two chunking/indexing methods against each other.' },
  retrieval: { title: 'Retrieval Comparison', subtitle: 'Compare two retrieval/ranking methods against each other.' },
  mixed: { title: 'Mixed Comparison', subtitle: 'Compare any two methods across categories — or try a curated best combination.' },
}

export default function ComparePage() {
  const { selectedDoc } = useDocument()
  const [techniques, setTechniques] = useState([])
  const [activeTab, setActiveTab] = useState('chunking')
  const [techA, setTechA] = useState('')
  const [techB, setTechB] = useState('')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    getTechniques().then((t) => setTechniques(t))
  }, [])

  // filter dropdown options based on active tab
  const optionsForTab = (tab) => {
    if (tab === 'mixed') return techniques
    return techniques.filter((t) => TECHNIQUE_CATEGORY[t.name] === tab)
  }
  const currentOptions = optionsForTab(activeTab)

  // when switching tabs, reset selections to valid defaults for that tab
  const switchTab = (tab) => {
    setActiveTab(tab)
    const opts = optionsForTab(tab)
    setTechA(opts[0]?.name || '')
    setTechB(opts[1]?.name || '')
    setData(null)
  }

  const applyCombination = (combo) => {
    setTechA(combo.techniqueA)
    setTechB(combo.techniqueB)
    setData(null)
  }

  const handleCompare = async () => {
    if (!selectedDoc || !techA || !techB || !query.trim()) return
    setLoading(true)
    setError(null)
    setData(null)
    try {
      const res = await runCompare({ doc_id: selectedDoc.doc_id, technique_a: techA, technique_b: techB, query, project_id: selectedProject?.project_id })
      setData(res)
    } catch (e) {
      setError(e?.response?.data?.detail || 'Comparison failed.')
    } finally {
      setLoading(false)
    }
  }

  const scoresA = data?.comparison?.scores?.[techA]
  const scoresB = data?.comparison?.scores?.[techB]
  const winnerLabel = data?.comparison?.verdict?.winner_label

  const findLabel = (name) => techniques.find((t) => t.name === name)?.label || name

  return (
    <div className="max-w-6xl mx-auto py-10 px-8">
      <header className="mb-6">
        <span className="inline-block text-[11px] font-bold uppercase tracking-wide mono-tag text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full mb-3">
          Step 3 of 3
        </span>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Compare Methods</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Pick a comparison type below, then choose Method 1 and Method 2 for that category.
        </p>
      </header>

      <SelectedDocBanner doc={selectedDoc} />

      {/* Three top tabs/cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {Object.entries(TABS).map(([key, tab]) => (
          <button
            key={key}
            onClick={() => switchTab(key)}
            className={`text-left rounded-2xl border p-4 transition shadow-card ${
              activeTab === key
                ? 'bg-slate-900 border-slate-900 text-white'
                : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
            }`}
          >
            <h3 className="text-sm font-bold mb-1">{tab.title}</h3>
            <p className={`text-xs leading-snug ${activeTab === key ? 'text-slate-300' : 'text-slate-500'}`}>
              {tab.subtitle}
            </p>
          </button>
        ))}
      </div>

      <div className={`grid gap-6 ${activeTab === 'mixed' ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'}`}>
        {/* Main compare form */}
        <div className={activeTab === 'mixed' ? 'lg:col-span-2' : ''}>
          <div className="bg-white border border-slate-200 rounded-2xl shadow-card p-6 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <TechniqueSelect techniques={currentOptions} value={techA} onChange={setTechA} label="Method 1" accent="brand" />
              <TechniqueSelect techniques={currentOptions} value={techB} onChange={setTechB} label="Method 2" accent="teal" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 mono-tag">Question</label>
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                rows={3}
                placeholder="Ask one question — both methods will answer it independently."
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 shadow-card outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 transition resize-none"
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleCompare}
                disabled={loading || !selectedDoc || !techA || !techB || techA === techB || !query.trim()}
                className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition shadow-panel"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Swords size={16} />}
                {loading ? 'Running both methods…' : 'Compare'}
              </button>
            </div>
            {techA === techB && techA !== '' && (
              <p className="text-xs text-amber-600 -mt-2">Pick two different methods to compare.</p>
            )}
          </div>

          {error && (
            <div className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</div>
          )}

          {data && (
            <div className="mt-6 space-y-6">
              <div className="rounded-2xl border border-slate-900/10 bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 shadow-panel">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wide mono-tag text-slate-400 mb-2">
                  <Scale size={14} /> LLM Judge Verdict
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <Trophy size={20} className="text-amber-400" />
                  <span className="text-lg font-semibold">
                    {winnerLabel
                      ? <>Winner: <span className="text-brand-300">{winnerLabel}</span></>
                      : 'Result: tie — both performed comparably'}
                  </span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">{data.comparison.verdict.reasoning}</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white shadow-card p-6">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mono-tag mb-4">Score breakdown</h3>
                <div className="flex items-center gap-4 mb-4 text-xs mono-tag">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: COLOR_A }} />{data.result_a.label}</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: COLOR_B }} />{data.result_b.label}</span>
                </div>
                <MetricBar label="Faithfulness (grounded in context)" valueA={scoresA?.faithfulness} valueB={scoresB?.faithfulness} colorA={COLOR_A} colorB={COLOR_B} />
                <MetricBar label="Relevance (answers the question)" valueA={scoresA?.relevance} valueB={scoresB?.relevance} colorA={COLOR_A} colorB={COLOR_B} />
                <div className="grid grid-cols-2 gap-4 mt-4 text-[11px] mono-tag text-slate-400">
                  <span>{data.result_a.timing?.total_ms} ms · {data.result_a.chunks?.length} chunks</span>
                  <span>{data.result_b.timing?.total_ms} ms · {data.result_b.chunks?.length} chunks</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <AnswerCard result={data.result_a} accentClass="border-brand-200" badgeClass="bg-brand-50 text-brand-700 border-brand-200" />
                <AnswerCard result={data.result_b} accentClass="border-teal-200" badgeClass="bg-teal-50 text-teal-700 border-teal-200" />
              </div>
            </div>
          )}
        </div>

        {/* Best Combinations sidebar — mixed tab only */}
        {activeTab === 'mixed' && (
          <div>
            <div className="bg-white border border-slate-200 rounded-2xl shadow-card p-5 sticky top-4">
              <div className="flex items-center gap-1.5 mb-1">
                <Sparkles size={15} className="text-amber-500" />
                <h3 className="text-sm font-bold text-slate-800">Best Combinations</h3>
              </div>
              <p className="text-xs text-slate-500 mb-4 leading-snug">
                Curated chunking + retrieval pairings known to work well together. Click one to load it into Method 1 / Method 2.
              </p>
              <div className="space-y-2">
                {BEST_COMBINATIONS.map((combo) => {
                  const isActive = techA === combo.techniqueA && techB === combo.techniqueB
                  return (
                    <button
                      key={combo.title}
                      onClick={() => applyCombination(combo)}
                      className={`w-full text-left rounded-xl border p-3 transition ${
                        isActive ? 'bg-brand-50 border-brand-300 ring-1 ring-brand-300' : 'bg-slate-50/60 border-slate-200 hover:border-brand-200'
                      }`}
                    >
                      <p className="text-xs font-bold text-slate-800 mb-0.5">{combo.title}</p>
                      <p className="text-[10px] mono-tag text-slate-400 mb-1.5">
                        {findLabel(combo.techniqueA)} + {findLabel(combo.techniqueB)}
                      </p>
                      <p className="text-[11px] text-slate-500 leading-snug">{combo.blurb}</p>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}