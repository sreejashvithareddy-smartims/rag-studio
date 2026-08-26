export default function MetricBar({ label, valueA, valueB, colorA = '#3b5bff', colorB = '#14b8a6' }) {
  const pctA = valueA != null ? Math.round(valueA * 100) : null
  const pctB = valueB != null ? Math.round(valueB * 100) : null

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between text-[11px] mono-tag text-slate-500 mb-1">
        <span>{label}</span>
        <span>
          <span style={{ color: colorA }} className="font-semibold">{pctA ?? '—'}%</span>
          {' vs '}
          <span style={{ color: colorB }} className="font-semibold">{pctB ?? '—'}%</span>
        </span>
      </div>
      <div className="relative h-2.5 w-full rounded-full bg-slate-100 overflow-hidden flex">
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${pctA ?? 0}%`, backgroundColor: colorA }}
        />
      </div>
      <div className="relative h-2.5 w-full rounded-full bg-slate-100 overflow-hidden flex mt-1">
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${pctB ?? 0}%`, backgroundColor: colorB }}
        />
      </div>
    </div>
  )
}
