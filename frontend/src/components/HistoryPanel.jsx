import { useEffect, useState } from 'react'
import { X, History, Search, Swords, Trophy } from 'lucide-react'
import { getProjectHistory } from '../api.js'

export default function HistoryPanel({ projectId, onClose }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!projectId) return
    getProjectHistory(projectId).then((h) => { setHistory(h); setLoading(false) }).catch(() => setLoading(false))
  }, [projectId])

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <History size={18} className="text-brand-600" />
            <h2 className="text-lg font-bold text-slate-900">Project History</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
        </div>

        <div className="overflow-y-auto p-6 space-y-3">
          {loading && <p className="text-sm text-slate-400">Loading…</p>}
          {!loading && history.length === 0 && <p className="text-sm text-slate-400 italic">No activity yet in this project.</p>}

          {history.map((h, i) => (
            <div key={i} className="border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-full mono-tag ${
                  h.type === 'compare' ? 'bg-teal-50 text-teal-700' : 'bg-brand-50 text-brand-700'
                }`}>
                  {h.type === 'compare' ? <Swords size={11} /> : <Search size={11} />}
                  {h.type === 'compare' ? 'Compare' : 'Query'}
                </span>
                <span className="text-[11px] text-slate-400 mono-tag">
                  {new Date(h.timestamp * 1000).toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-slate-800 font-medium mb-1.5">"{h.query}"</p>
              {h.type === 'query' ? (
                <p className="text-xs text-slate-500">
                  technique: <span className="font-semibold text-slate-700">{h.technique}</span>
                  {h.answer_preview && <span className="block mt-1 text-slate-400 italic">"{h.answer_preview}…"</span>}
                </p>
              ) : (
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  {h.technique_a} vs {h.technique_b}
                  {h.winner && <span className="flex items-center gap-1 ml-2 text-amber-600 font-semibold"><Trophy size={11} /> {h.winner}</span>}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}