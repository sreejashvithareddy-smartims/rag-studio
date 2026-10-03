import { useEffect, useState } from 'react'
import { CalendarClock, Download, FileText, History, Loader2, Search, Swords, Trophy } from 'lucide-react'
import { getProjects, getProjectHistory } from '../api.js'
import { useProject } from '../context/ProjectContext.jsx'
import { downloadComparisonPdf } from '../utils/comparisonPdf.js'

const metricLabels = {
  faithfulness: 'Faithfulness',
  relevance: 'Answer Relevancy',
  answer_relevancy: 'Answer Relevancy',
  context_precision: 'Context Precision',
}

function formatTimestamp(timestamp) {
  if (!Number.isFinite(timestamp)) return 'Date unavailable'
  return new Date(timestamp * 1000).toLocaleString()
}

function MethodDetails({ title, result }) {
  if (!result) return null
  return (
    <section className="mt-4 border-t border-slate-100 pt-4">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mono-tag">{title} — {result.label || result.technique}</h4>
      {result.answer && <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{result.answer}</p>}
      {Array.isArray(result.chunks) && result.chunks.length > 0 && (
        <div className="mt-3 space-y-2">
          <h5 className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mono-tag">Retrieved chunks ({result.chunks.length})</h5>
          {result.chunks.map((chunk, index) => (
            <div key={`${chunk.meta?.chunk_index ?? index}-${index}`} className="rounded-lg bg-slate-50 px-3 py-2">
              <div className="mb-1 flex flex-wrap gap-x-3 text-[10px] text-slate-400 mono-tag">
                <span>Chunk {chunk.meta?.chunk_index ?? index + 1}</span>
                {chunk.meta?.page != null && <span>Page {chunk.meta.page}</span>}
                {chunk.score != null && <span>Score {Number(chunk.score).toFixed(3)}</span>}
              </div>
              <p className="whitespace-pre-wrap text-xs leading-relaxed text-slate-600">{chunk.text}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function ComparisonDetails({ event, project, onExportError }) {
  const data = event.comparison_data
  if (!data) {
    return (
      <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
        This comparison predates detailed history storage. Its original answers, retrieved chunks, and metric scores were not saved.
        {event.winner && <p className="mt-1 font-semibold">Recorded winner: {event.winner}</p>}
      </div>
    )
  }

  const methods = [data.result_a, data.result_b].filter(Boolean)
  const scoreMap = data.comparison?.scores || {}
  const metricKeys = [...new Set(Object.values(scoreMap).flatMap((scores) => Object.keys(scores || {})))]
  const winner = data.comparison?.verdict?.winner_label || event.winner

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
        <span className="font-semibold">Methods compared:</span>
        {methods.map((method) => <span key={method.technique} className="rounded-md bg-slate-100 px-2 py-1">{method.label}</span>)}
      </div>
      <button
        onClick={async () => {
          try {
            await downloadComparisonPdf({ data, project, documentId: event.doc_id, comparedAt: event.timestamp })
          } catch {
            onExportError('Could not generate the historical comparison PDF.')
          }
        }}
        className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-700"
      >
        <Download size={14} /> Export historical PDF
      </button>

      {metricKeys.length > 0 && (
        <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-3 py-2 font-semibold">Metric</th>
                {methods.map((method) => <th key={method.technique} className="px-3 py-2 font-semibold">{method.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {metricKeys.map((key) => (
                <tr key={key} className="border-t border-slate-100">
                  <th className="px-3 py-2 font-medium text-slate-700">{metricLabels[key] || key.replaceAll('_', ' ')}</th>
                  {methods.map((method) => {
                    const value = scoreMap[method.technique]?.[key]
                    return <td key={method.technique} className="px-3 py-2 text-slate-600">{value == null ? 'Not available' : Number(value).toFixed(3)}</td>
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {winner && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
          <Trophy size={15} /> Winner: {winner}
        </div>
      )}
      {data.comparison?.verdict?.reasoning && <p className="mt-3 text-xs leading-relaxed text-slate-500">{data.comparison.verdict.reasoning}</p>}
      {methods.map((method, index) => <MethodDetails key={method.technique} title={`Method ${index + 1}`} result={method} />)}
    </div>
  )
}

function HistoryEntry({ event, project, relatedComparisons = [], onExportError }) {
  const isCompare = event.type === 'compare'
  const data = event.comparison_data
  const results = data ? [data.result_a, data.result_b].filter(Boolean) : []

  return (
    <details className="group rounded-xl border border-slate-200 bg-white shadow-card">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-4 p-4 [&::-webkit-details-marker]:hidden">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold mono-tag ${isCompare ? 'bg-teal-50 text-teal-700' : 'bg-brand-50 text-brand-700'}`}>
              {isCompare ? <Swords size={11} /> : <Search size={11} />}{isCompare ? 'Comparison' : 'Query'}
            </span>
            <span className="text-[10px] text-slate-400 mono-tag">{formatTimestamp(event.timestamp)}</span>
          </div>
          <p className="text-sm font-medium leading-relaxed text-slate-800">{event.query || 'Question unavailable'}</p>
          {isCompare && <p className="mt-1 text-xs text-slate-500">{results.map((result) => result.label).join(' vs ') || `${event.technique_a || 'Method'} vs ${event.technique_b || 'Method'}`}</p>}
        </div>
        {isCompare && (data?.comparison?.verdict?.winner_label || event.winner) && (
          <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-amber-700"><Trophy size={13} />{data?.comparison?.verdict?.winner_label || event.winner}</span>
        )}
      </summary>

      <div className="border-t border-slate-100 px-4 pb-4">
        {isCompare ? <ComparisonDetails event={event} project={project} onExportError={onExportError} /> : (
          <div className="pt-4">
            <p className="text-[11px] text-slate-500">Method: <span className="font-semibold text-slate-700">{event.technique || 'Not recorded'}</span></p>
            {event.answer ? (
              <>
                <h4 className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500 mono-tag">Answer</h4>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{event.answer}</p>
                {event.chunks?.length > 0 && <MethodDetails title="Query method" result={{ label: event.technique, answer: null, chunks: event.chunks }} />}
                {relatedComparisons.length ? (
                  <>
                    <p className="mt-3 text-xs font-semibold text-teal-700">Compared: Yes, {relatedComparisons.length} matching comparison{relatedComparisons.length === 1 ? '' : 's'} for this question and document.</p>
                    {relatedComparisons.map((comparisonEvent, index) => (
                      <ComparisonDetails key={`${comparisonEvent.timestamp}-${index}`} event={comparisonEvent} project={project} onExportError={onExportError} />
                    ))}
                  </>
                ) : <p className="mt-3 text-xs text-slate-500">Compared: No matching comparison record was found for this question and document.</p>}
              </>
            ) : (
              <p className="mt-3 text-xs text-slate-500">{event.answer_preview ? `Stored answer preview: “${event.answer_preview}…” Full answer and retrieved chunks were not saved for this older query.` : 'Answer and retrieved chunks were not saved for this older query.'}</p>
            )}
          </div>
        )}
      </div>
    </details>
  )
}

export default function ProjectHistoryPage() {
  const { selectedProject } = useProject()
  const [projects, setProjects] = useState([])
  const [project, setProject] = useState(null)
  const [history, setHistory] = useState([])
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    getProjects()
      .then((items) => {
        setProjects(items)
        const current = items.find((item) => item.project_id === selectedProject?.project_id)
        if (current) setProject(current)
      })
      .catch(() => setError('Could not load projects.'))
      .finally(() => setLoadingProjects(false))
  }, [selectedProject?.project_id])

  useEffect(() => {
    if (!project) {
      setHistory([])
      return
    }
    let active = true
    setLoadingHistory(true)
    setError(null)
    getProjectHistory(project.project_id)
      .then((items) => { if (active) setHistory(items) })
      .catch(() => { if (active) setError('Could not load this project’s history.') })
      .finally(() => { if (active) setLoadingHistory(false) })
    return () => { active = false }
  }, [project?.project_id])

  const latestTimestamp = history[0]?.timestamp
  const getRelatedComparisons = (event) => history.filter((candidate) => (
    candidate.type === 'compare'
    && (candidate.query || '').trim().toLowerCase() === (event.query || '').trim().toLowerCase()
    && candidate.doc_id === event.doc_id
  ))
  const selectProject = (item) => {
    setHistory([])
    setError(null)
    setProject(item)
  }

  return (
    <div className="mx-auto max-w-6xl px-8 py-10">
      <header className="mb-7">
        <span className="mono-tag mb-3 inline-block rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-brand-600">Workspace activity</span>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Project History</h1>
        <p className="mt-1 text-sm text-slate-500">Browse recorded queries and comparisons across your projects.</p>
      </header>

      {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {loadingProjects ? <p className="text-sm text-slate-400">Loading projects…</p> : projects.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">No projects have been created yet.</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 mono-tag">Projects ({projects.length})</h2>
            <div className="space-y-2">
              {projects.map((item) => (
                <button key={item.project_id} onClick={() => selectProject(item)} className={`w-full rounded-xl border px-4 py-3 text-left transition ${project?.project_id === item.project_id ? 'border-brand-300 bg-brand-50/60 ring-1 ring-brand-200' : 'border-slate-200 bg-white hover:border-brand-200'}`}>
                  <span className="flex items-center gap-2 text-sm font-semibold text-slate-800"><FileText size={15} className="text-slate-400" />{item.name}</span>
                  <span className="mt-1 flex items-center gap-1 text-[10px] text-slate-400 mono-tag"><CalendarClock size={11} />Created {new Date(item.created_at * 1000).toLocaleDateString()}</span>
                </button>
              ))}
            </div>
          </aside>

          <section className="min-w-0">
            {project ? (
              <>
                <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">{project.name}</h2>
                    <p className="mt-1 text-xs text-slate-500">{history.length} recorded activities{latestTimestamp ? ` · Last activity ${formatTimestamp(latestTimestamp)}` : ''}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 mono-tag">Project {project.project_id}</span>
                </div>
                {loadingHistory ? <div className="flex items-center gap-2 py-8 text-sm text-slate-400"><Loader2 size={15} className="animate-spin" />Loading history…</div> : history.length ? (
                  <div className="space-y-3">{history.map((event, index) => <HistoryEntry key={`${event.timestamp}-${index}`} event={event} project={project} relatedComparisons={event.type === 'query' ? getRelatedComparisons(event) : []} onExportError={setError} />)}</div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500"><History size={16} className="mb-2 text-slate-400" />No activity has been recorded for this project yet.</div>
                )}
              </>
            ) : <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">Select a project to view its history.</p>}
          </section>
        </div>
      )}
    </div>
  )
}