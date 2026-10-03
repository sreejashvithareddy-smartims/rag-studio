import { useNavigate } from 'react-router-dom'
import { ArrowRight, Database, FileStack, Layers, Search } from 'lucide-react'
import { useProject } from '../context/ProjectContext.jsx'

export default function ProjectStartPage() {
  const { selectedProject, startProject } = useProject()
  const navigate = useNavigate()

  const begin = () => {
    startProject()
    navigate('/documents')
  }

  return (
    <div className="project-intro min-h-screen flex flex-col items-center justify-center px-6 py-12 text-white">
      <div className="project-intro-grid" aria-hidden="true" />
      <div className="relative z-10 flex w-full max-w-3xl flex-col items-center text-center">
        <div className="flex items-center gap-3 mb-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 shadow-lg shadow-brand-500/25">
            <Layers size={22} />
          </span>
          <span className="text-2xl font-bold tracking-tight">RAG Studio</span>
        </div>
        <p className="text-sm text-slate-400">Retrieval workspace prepared for</p>
        <h1 className="mt-1 text-2xl font-semibold text-white">{selectedProject?.name}</h1>

        <div className="retrieval-flow my-12" role="img" aria-label="Animated flow from documents through vector indexing to retrieval">
          <div className="flow-node"><FileStack size={23} /><span>Documents</span></div>
          <div className="flow-track"><i /><i /><i /></div>
          <div className="flow-node flow-index"><Database size={24} /><span>Index</span></div>
          <div className="flow-track flow-track-second"><i /><i /><i /></div>
          <div className="flow-node flow-search"><Search size={23} /><span>Retrieve</span></div>
        </div>

        <p className="max-w-md text-sm leading-relaxed text-slate-400">
          Your project is ready. Start when you are, then continue to its knowledge base and retrieval tools.
        </p>
        <button onClick={begin} className="mt-7 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 transition hover:bg-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:ring-offset-2 focus:ring-offset-slate-950">
          Start the Retrieval <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )
}