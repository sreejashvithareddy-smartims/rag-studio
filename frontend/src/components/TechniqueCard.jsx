import { useState } from 'react'
import { Check, RotateCcw, Maximize2 } from 'lucide-react'

export default function TechniqueCard({ technique, selected, onSelect, onExpand }) {
  const [flipped, setFlipped] = useState(false)

  return (
    <div
      className="relative h-44 [perspective:1000px] cursor-pointer group"
      onClick={() => setFlipped(!flipped)}
    >
      <div
        className={`relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d] ${
          flipped ? '[transform:rotateY(180deg)]' : ''
        }`}
      >
        {/* Front */}
        <div
          className={`absolute inset-0 [backface-visibility:hidden] rounded-2xl border p-4 flex flex-col justify-between shadow-card transition-colors ${
            selected
              ? 'bg-brand-500 border-brand-500 text-white'
              : 'bg-white border-slate-200 text-slate-800 group-hover:border-brand-300'
          }`}
        >
          <div>
            <span className={`mono-tag text-[10px] ${selected ? 'text-brand-100' : 'text-slate-400'}`}>
              #{String(technique.number).padStart(2, '0')}
            </span>
            <h3 className="text-sm font-bold leading-snug mt-1">{technique.label}</h3>
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-[10px] flex items-center gap-1 ${selected ? 'text-brand-100' : 'text-slate-400'}`}>
              <RotateCcw size={10} /> tap to flip
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); onSelect(technique.name) }}
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1 transition ${
                selected ? 'bg-white text-brand-600' : 'bg-brand-50 text-brand-700 hover:bg-brand-100'
              }`}
            >
              {selected && <Check size={12} />}
              {selected ? 'Selected' : 'Select'}
            </button>
          </div>
        </div>

        {/* Back */}
        <div
          className={`absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-2xl border p-4 flex flex-col gap-1.5 shadow-card overflow-hidden ${
            selected ? 'bg-brand-900 border-brand-700 text-white' : 'bg-slate-900 border-slate-800 text-slate-100'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <span className="text-[10px] uppercase tracking-wide mono-tag text-slate-400">Definition</span>
            <button
              onClick={(e) => { e.stopPropagation(); onExpand(technique) }}
              className="text-slate-400 hover:text-white transition shrink-0"
              title="Expand"
            >
              <Maximize2 size={13} />
            </button>
          </div>
          <p className="text-xs leading-snug text-slate-200 line-clamp-3">{technique.description}</p>
          <span className="text-[10px] uppercase tracking-wide mono-tag text-slate-400 mt-1">Best use case</span>
          <p className="text-xs leading-snug text-slate-300 line-clamp-2">{technique.best_use_case}</p>
        </div>
      </div>
    </div>
  )
}