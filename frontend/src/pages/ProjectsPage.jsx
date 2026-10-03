import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, FolderOpen, Trash2, ArrowRight, X } from 'lucide-react'
import { getProjects, createProject, deleteProject } from '../api.js'
import { useProject } from '../context/ProjectContext.jsx'

export default function ProjectsPage() {
  const [projects, setProjects] = useState([])
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const navigate = useNavigate()
  const { setSelectedProject } = useProject()

  const refresh = () => getProjects().then(setProjects).catch(() => {})
  useEffect(() => { refresh() }, [])
  useEffect(() => {
    const hasBuilding = projects.some((p) => p.overall_status === 'building')
    if (!hasBuilding) return
    const interval = setInterval(refresh, 2000)
    return () => clearInterval(interval)
  }, [projects])

  const handleCreate = async () => {
    if (!newName.trim()) return
    const project = await createProject(newName.trim())
    setSelectedProject(project)
    setCreating(false)
    setNewName('')
    navigate('/documents')
  }

  const handleOpen = (project) => {
    setSelectedProject(project)
    navigate('/documents')
  }

  const handleDelete = async (e, projectId) => {
    e.stopPropagation()
    await deleteProject(projectId)
    refresh()
  }

  return (
    <div className="max-w-4xl mx-auto py-14 px-8">
      <header className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">RAG Studio</h1>
        <p className="text-slate-500 mt-2">Create a new project or continue one you've already started.</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Create new project card */}
        {!creating ? (
          <button
            onClick={() => setCreating(true)}
            className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-300 hover:border-brand-400 hover:bg-brand-50/30 rounded-2xl p-8 transition text-center"
          >
            <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center">
              <Plus className="text-brand-500" size={22} />
            </div>
            <span className="text-sm font-semibold text-slate-700">Create Project</span>
          </button>
        ) : (
          <div className="border-2 border-brand-300 bg-brand-50/40 rounded-2xl p-6 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide mono-tag text-brand-600">New project</span>
              <button onClick={() => { setCreating(false); setNewName('') }} className="text-slate-400 hover:text-slate-700">
                <X size={16} />
              </button>
            </div>
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="e.g. HR Policy Review"
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-400"
            />
            <button
              onClick={handleCreate}
              disabled={!newName.trim()}
              className="flex items-center justify-center gap-1.5 bg-brand-500 hover:bg-brand-600 disabled:bg-slate-300 text-white text-sm font-semibold py-2 rounded-xl transition"
            >
              Create <ArrowRight size={14} />
            </button>
          </div>
        )}

        {/* Existing projects */}
        {projects.map((p) => (
          <button
            key={p.project_id}
            onClick={() => handleOpen(p)}
            className="group flex items-center justify-between border border-slate-200 hover:border-brand-300 bg-white rounded-2xl p-6 shadow-card transition text-left"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                <FolderOpen size={19} className="text-slate-500" />
              </div>
                            <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate flex items-center gap-2">
                  {p.name}
                  {p.overall_status === 'ready' && <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Ready" />}
                  {p.overall_status === 'building' && <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" title="Indexing in progress" />}
                  {p.overall_status === 'error' && <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" title="Indexing error" />}
                </p>
                <p className="text-[11px] text-slate-400 mono-tag">
                  {new Date(p.created_at * 1000).toLocaleDateString()}
                  {p.doc_count > 0 && ` · ${p.doc_count} doc${p.doc_count !== 1 ? 's' : ''}`}
                </p>
              </div>
            </div>
            <button
              onClick={(e) => handleDelete(e, p.project_id)}
              className="p-2 rounded-lg text-slate-300 hover:text-red-600 hover:bg-red-50 transition opacity-0 group-hover:opacity-100 shrink-0"
            >
              <Trash2 size={15} />
            </button>
          </button>
        ))}
      </div>

      {projects.length === 0 && !creating && (
        <p className="text-center text-sm text-slate-400 mt-8">No projects yet — create your first one above.</p>
      )}
    </div>
  )
}