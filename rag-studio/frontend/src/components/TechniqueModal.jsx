import { X } from 'lucide-react'

export default function TechniqueModal({ technique, onClose }) {
  if (!technique) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition"
        >
          <X size={20} />
        </button>

        <span className="mono-tag text-xs text-slate-400">#{String(technique.number).padStart(2, '0')}</span>
        <h2 className="text-xl font-bold text-slate-900 mt-1 mb-4">{technique.label}</h2>

        <div className="mb-4">
          <span className="text-[11px] uppercase tracking-wide mono-tag text-brand-600 font-semibold">Definition</span>
          <p className="text-sm text-slate-700 leading-relaxed mt-1">{technique.description}</p>
        </div>

        <div>
          <span className="text-[11px] uppercase tracking-wide mono-tag text-teal-600 font-semibold">Best use case</span>
          <p className="text-sm text-slate-700 leading-relaxed mt-1">{technique.best_use_case}</p>
        </div>
      </div>
    </div>
  )
}