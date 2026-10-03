import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { FlaskConical, FileStack, Split, Layers, PanelLeftClose, PanelLeftOpen, History } from 'lucide-react'
import { useProject } from '../context/ProjectContext.jsx'

const links = [
  { to: '/', label: '1. Knowledge Base', icon: FileStack, end: true },
  { to: '/query', label: '2. Run Query', icon: FlaskConical },
  { to: '/compare', label: '3. Compare Methods', icon: Split },
  { to: '/project-history', label: '4. Project History', icon: History },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const { selectedProject } = useProject()
  const navigate = useNavigate()

  return (
    <aside className={`shrink-0 bg-[#0B1220] text-slate-300 flex flex-col h-screen sticky top-0 transition-all duration-200 ${collapsed ? 'w-16' : 'w-64'}`}>
      <div className="px-4 py-6 flex items-center justify-between border-b border-white/5">
        <button onClick={() => navigate('/')} className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center shrink-0">
            <Layers className="w-4.5 h-4.5 text-white" size={18} />
          </div>
          {!collapsed && (
            <div className="min-w-0 text-left">
              <div className="text-white font-semibold tracking-tight leading-none truncate">RAG Studio</div>
              <div className="text-[11px] text-slate-500 mono-tag mt-0.5">retrieval lab</div>
            </div>
          )}
        </button>
        <button onClick={() => setCollapsed(!collapsed)} className="text-slate-400 hover:text-white transition shrink-0">
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>

      {selectedProject && !collapsed && (
        <div className="px-4 py-3 border-b border-white/5">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide mono-tag text-slate-500 mb-1">
            <History size={11} /> Active project
          </div>
          <p className="text-sm font-semibold text-white truncate">{selectedProject.name}</p>
        </div>
      )}

      <nav className="flex-1 px-3 py-5 space-y-1">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-500/15 text-white border border-brand-400/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`
            }
          >
            <Icon size={17} strokeWidth={2} />
            {!collapsed && label}
          </NavLink>
        ))}
      </nav>

      {!collapsed && (
        <div className="px-6 py-5 border-t border-white/5 text-[11px] text-slate-500 leading-relaxed">
          <span className="mono-tag text-slate-400">18</span> techniques ·{' '}
          <span className="mono-tag text-slate-400">ChromaDB</span> vector store
        </div>
      )}

    </aside>
  )
}