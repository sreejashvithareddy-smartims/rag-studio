import { ChevronDown } from 'lucide-react'

export default function TechniqueSelect({ techniques, value, onChange, label = 'Technique', accent = 'brand' }) {
  const accentRing = {
    brand: 'focus:ring-brand-400 focus:border-brand-400',
    teal: 'focus:ring-teal-400 focus:border-teal-400',
  }[accent]

  const selected = techniques.find(t => t.name === value)

  return (
    <div className="w-full">
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 mono-tag">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full appearance-none bg-white border border-slate-200 rounded-xl px-4 py-3 pr-10 text-sm font-medium text-slate-800 shadow-card outline-none ring-0 focus:ring-2 ${accentRing} transition`}
        >
          <option value="" disabled>Select a technique…</option>
          {techniques.map(t => (
            <option key={t.name} value={t.name}>{t.label}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={17} />
      </div>
      {selected && (
        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{selected.description}</p>
      )}
    </div>
  )
}
