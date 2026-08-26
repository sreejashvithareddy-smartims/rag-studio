import { useState } from 'react'
import { ChevronDown, FileText, ThumbsUp, ThumbsDown } from 'lucide-react'
import { submitFeedback } from '../api.js'

export default function ChunkList({ chunks = [], docId, showFeedback = false }) {
  const [open, setOpen] = useState(false)
  const [voted, setVoted] = useState({})

  if (!chunks.length) {
    return <p className="text-sm text-slate-400 italic">No chunks retrieved.</p>
  }

  const vote = async (chunkIndex, value) => {
    if (chunkIndex == null || !docId) return
    setVoted((v) => ({ ...v, [chunkIndex]: value }))
    try {
      await submitFeedback({ doc_id: docId, chunk_index: chunkIndex, vote: value })
    } catch { /* non-critical */ }
  }

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide mono-tag hover:text-slate-700 transition"
      >
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-0' : '-rotate-90'}`} />
        Retrieved context ({chunks.length})
      </button>

      {open && (
        <div className="mt-2 space-y-2">
          {chunks.map((c, i) => {
            const idx = c.meta?.chunk_index ?? i
            return (
              <div key={i} className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mono-tag flex-wrap">
                    <FileText size={12} />
                    chunk {idx}
                    {c.meta?.role && (
                      <span className={`px-1.5 py-0.5 rounded ${c.meta.role === 'anchor' ? 'bg-brand-100 text-brand-700' : 'bg-slate-200 text-slate-600'}`}>
                        {c.meta.role}
                      </span>
                    )}
                    {c.meta?.graph_boosted && <span className="px-1.5 py-0.5 rounded bg-teal-100 text-teal-700">graph-linked</span>}
                    {c.meta?.corrected && <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">corrected</span>}
                    {c.meta?.has_header && <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">has header</span>}
                    {c.meta?.matched_via === 'generated_question' && <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700">matched via Q</span>}
                    {c.meta?.has_image && <span className="px-1.5 py-0.5 rounded bg-pink-100 text-pink-700">page has image</span>}
                    {c.meta?.section != null && <span className="px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-700">section {c.meta.section}</span>}
                  </div>
                  {typeof c.score === 'number' && (
                    <span className="text-[11px] mono-tag text-slate-400">score {c.score.toFixed(3)}</span>
                  )}
                </div>
                <p className="text-sm text-slate-700 leading-relaxed line-clamp-4">{c.text}</p>

                {showFeedback && docId && (
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-200">
                    <span className="text-[10px] text-slate-400 mono-tag">helpful?</span>
                    <button
                      onClick={() => vote(idx, 1)}
                      className={`p-1 rounded transition ${voted[idx] === 1 ? 'bg-emerald-100 text-emerald-600' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`}
                    >
                      <ThumbsUp size={13} />
                    </button>
                    <button
                      onClick={() => vote(idx, -1)}
                      className={`p-1 rounded transition ${voted[idx] === -1 ? 'bg-red-100 text-red-600' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'}`}
                    >
                      <ThumbsDown size={13} />
                    </button>
                    {voted[idx] && <span className="text-[10px] text-slate-400">thanks — feeds the Feedback Loop technique</span>}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
