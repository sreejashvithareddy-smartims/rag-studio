import { Clock, Sparkles } from 'lucide-react'
import ChunkList from './ChunkList.jsx'

export default function AnswerCard({ result, docId, showFeedback = false, accentClass = 'border-brand-200', badgeClass = 'bg-brand-50 text-brand-700 border-brand-200' }) {
  if (!result) return null

  return (
    <div className={`rounded-2xl border ${accentClass} bg-white shadow-panel p-5 flex flex-col gap-4`}>
      <div className="flex items-center justify-between">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border mono-tag ${badgeClass}`}>
          <Sparkles size={12} />
          {result.label}
        </span>
        <span className="flex items-center gap-1 text-[11px] text-slate-400 mono-tag">
          <Clock size={12} />
          {result.timing?.total_ms} ms
        </span>
      </div>

      {result.meta?.routed_category && (
        <div className="text-[11px] mono-tag text-slate-500 -mt-2">
          routed as <span className="font-semibold text-slate-700">{result.meta.routed_category}</span> → {result.meta.routed_to}
        </div>
      )}

      {result.meta?.self_critique && result.meta.self_critique !== 'not_applicable' && (
        <div className="text-[11px] mono-tag text-slate-500 -mt-2">
          used retrieval: <span className="font-semibold text-slate-700">{String(result.meta.used_retrieval)}</span> · self-check: <span className="font-semibold text-slate-700">{result.meta.self_critique}</span>
        </div>
      )}

      <p className="text-[15px] text-slate-800 leading-relaxed whitespace-pre-wrap">{result.answer}</p>

      <div className="pt-2 border-t border-slate-100">
        <ChunkList chunks={result.chunks} docId={docId} showFeedback={showFeedback} />
      </div>
    </div>
  )
}
