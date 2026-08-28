import { useState } from 'react'
import { ChevronDown, FileText, ThumbsUp, ThumbsDown, Maximize2, Minimize2 } from 'lucide-react'
import { submitFeedback } from '../api.js'

export default function ChunkList({ chunks = [], docId, showFeedback = false }) {
  const [open, setOpen] = useState(true)
  const [voted, setVoted] = useState({})
  const [expanded, setExpanded] = useState({})

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

  const toggleExpand = (i) => setExpanded((e) => ({ ...e, [i]: !e[i] }))

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide mono-tag hover:text-slate-700 transition mb-3"
      >
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-0' : '-rotate-90'}`} />
        Retrieved context ({chunks.length} chunk{chunks.length !== 1 ? 's' : ''})
      </button>

      {open && (
        <div className="grid grid-cols-1 gap-3">
          {chunks.map((c, i) => {
            const idx = c.meta?.chunk_index ?? i
            const isLong = c.text.length > 280
            const isExpanded = expanded[i]
            return (
              <div
                key={i}
                className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"
              >
                {/* Chunk header bar */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-brand-500 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mono-tag">
                      {i + 1}
                    </span>
                    <span className="text-[11px] mono-tag text-slate-500">chunk #{idx}</span>
                    {typeof c.score === 'number' && (
                      <span className="text-[11px] mono-tag bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
                        score {c.score.toFixed(3)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-wrap justify-end">
                    {c.meta?.role && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${c.meta.role === 'anchor' ? 'bg-brand-100 text-brand-700' : 'bg-slate-200 text-slate-600'}`}>
                        {c.meta.role}
                      </span>
                    )}
                    {c.meta?.graph_boosted && <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-teal-100 text-teal-700">graph-linked</span>}
                    {c.meta?.corrected && <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-amber-100 text-amber-700">corrected</span>}
                    {c.meta?.has_header && <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-purple-100 text-purple-700">has header</span>}
                    {c.meta?.matched_via === 'generated_question' && <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-indigo-100 text-indigo-700">matched via Q</span>}
                    {c.meta?.has_image && <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-pink-100 text-pink-700">page has image</span>}
                    {c.meta?.section != null && <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-cyan-100 text-cyan-700">section {c.meta.section}</span>}
                  </div>
                </div>

                {/* Chunk body */}
                <div className="px-4 py-3">
                  <p className={`text-sm text-slate-700 leading-relaxed whitespace-pre-wrap ${!isExpanded && isLong ? 'line-clamp-3' : ''}`}>
                    {c.text}
                  </p>
                  {isLong && (
                    <button
                      onClick={() => toggleExpand(i)}
                      className="flex items-center gap-1 text-[11px] font-semibold text-brand-600 hover:text-brand-700 mt-1.5"
                    >
                      {isExpanded ? <Minimize2 size={11} /> : <Maximize2 size={11} />}
                      {isExpanded ? 'Show less' : 'Show full chunk'}
                    </button>
                  )}
                </div>

                {showFeedback && docId && (
                  <div className="flex items-center gap-2 px-4 py-2 border-t border-slate-100 bg-slate-50/50">
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