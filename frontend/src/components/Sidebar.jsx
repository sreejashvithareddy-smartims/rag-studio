import { NavLink } from 'react-router-dom'
import { FlaskConical, FileStack, Split, Layers } from 'lucide-react'

const links = [
  { to: '/', label: '1. Select Document', icon: FileStack, end: true },
  { to: '/query', label: '2. Run Query', icon: FlaskConical },
  { to: '/compare', label: '3. Compare Methods', icon: Split },
]

export default function Sidebar() {
  return (
    <aside className="w-64 shrink-0 bg-[#0B1220] text-slate-300 flex flex-col h-screen sticky top-0">
      <div className="px-6 py-6 flex items-center gap-2.5 border-b border-white/5">
        <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center shadow-panel">
          <Layers className="w-4.5 h-4.5 text-white" size={18} />
        </div>
        <div>
          <div className="text-white font-semibold tracking-tight leading-none">RAG Studio</div>
          <div className="text-[11px] text-slate-500 mono-tag mt-0.5">retrieval lab</div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-1">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-500/15 text-white border border-brand-400/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`
            }
          >
            <Icon size={17} strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-6 py-5 border-t border-white/5 text-[11px] text-slate-500 leading-relaxed">
        <span className="mono-tag text-slate-400">18</span> techniques ·{' '}
        <span className="mono-tag text-slate-400">ChromaDB</span> vector store ·{' '}
        <span className="text-emerald-400">●</span> connected
      </div>
    </aside>
  )
}
