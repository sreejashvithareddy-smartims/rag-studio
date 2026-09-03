import { useState } from 'react'
import { GitCompare, Equal, GitBranchPlus } from 'lucide-react'

export default function ChunkOverlapPanel({ overlap, labelA, labelB }) {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState('similar')

  if (!overlap) return null

  return (
    <div className="mt-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-card hover:border-brand-300 transition"
      >
        <GitCompare size={15} className="text-brand-600" />
        Filter Comparison
        <span className="text-[11px] mono-tag text-slate-400 font-normal">
          ({overlap.similar_count} similar · {overlap.different_count} different)
        </span>
      </button>

      {open && (
        <div className="mt-3 bg-white border border-slate-200 rounded-2xl shadow-card p-5">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setView('similar')}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
                view === 'similar' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Equal size={13} /> Similar ({overlap.similar_count})
            </button>
            <button
              onClick={() => setView('different')}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
                view === 'different' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <GitBranchPlus size={13} /> Not Similar ({overlap.different_count})
            </button>
          </div>

          {view === 'similar' && (
            <div className="space-y-3">
              {overlap.similar.length === 0 && (
                <p className="text-sm text-slate-400 italic">No overlapping chunks — both methods retrieved entirely different content.</p>
              )}
              {overlap.similar.map((s, i) => (
                <div key={i} className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wide mono-tag text-emerald-700">
                      Matched by both methods
                    </span>
                    <span className="text-[10px] mono-tag text-emerald-600">
                      similarity {Math.round(s.similarity * 100)}%
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="bg-white rounded-lg p-2.5 border border-emerald-100">
                      <p className="text-[10px] mono-tag text-slate-400 mb-1">{labelA} · chunk #{s.chunk_index_a}</p>
                      <p className="text-xs text-slate-700 line-clamp-3">{s.text_a}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2.5 border border-emerald-100">
                      <p className="text-[10px] mono-tag text-slate-400 mb-1">{labelB} · chunk #{s.chunk_index_b}</p>
                      <p className="text-xs text-slate-700 line-clamp-3">{s.text_b}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {view === 'different' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide mono-tag text-brand-600 mb-2">
                  Only in {labelA}
                </p>
                <div className="space-y-2">
                  {overlap.unique_a.length === 0 && <p className="text-xs text-slate-400 italic">None — everything overlapped.</p>}
                  {overlap.unique_a.map((c, i) => (
                    <div key={i} className="rounded-lg border border-brand-100 bg-brand-50/40 p-2.5">
                      <p className="text-[10px] mono-tag text-slate-400 mb-1">chunk #{c.meta?.chunk_index}</p>
                      <p className="text-xs text-slate-700 line-clamp-3">{c.text}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide mono-tag text-teal-600 mb-2">
                  Only in {labelB}
                </p>
                <div className="space-y-2">
                  {overlap.unique_b.length === 0 && <p className="text-xs text-slate-400 italic">None — everything overlapped.</p>}
                  {overlap.unique_b.map((c, i) => (
                    <div key={i} className="rounded-lg border border-teal-100 bg-teal-50/40 p-2.5">
                      <p className="text-[10px] mono-tag text-slate-400 mb-1">chunk #{c.meta?.chunk_index}</p>
                      <p className="text-xs text-slate-700 line-clamp-3">{c.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}