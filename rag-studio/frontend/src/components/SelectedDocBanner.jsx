import { Link } from 'react-router-dom'
import { FileText, ArrowLeftRight } from 'lucide-react'

export default function SelectedDocBanner({ doc }) {
  if (!doc) {
    return (
      <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6">
        <span className="text-sm text-amber-800">No document selected yet.</span>
        <Link to="/" className="text-sm font-semibold text-amber-900 underline">Choose a document →</Link>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-3 mb-6 shadow-card">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
          <FileText size={15} className="text-brand-600" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">{doc.filename}</p>
          <p className="text-[11px] text-slate-400 mono-tag">{doc.num_fixed_chunks} chunks · {doc.num_pages} page(s) · doc_id: {doc.doc_id}</p>
        </div>
      </div>
      <Link to="/" className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 shrink-0">
        <ArrowLeftRight size={13} /> Change
      </Link>
    </div>
  )
}
