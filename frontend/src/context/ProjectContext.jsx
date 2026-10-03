import { createContext, useContext, useState } from 'react'

const ProjectContext = createContext(null)

export function ProjectProvider({ children }) {
  const [selectedProject, setSelectedProjectState] = useState(() => {
    const saved = localStorage.getItem('rag_studio_selected_project')
    return saved ? JSON.parse(saved) : null
  })
  const [startedProjectId, setStartedProjectId] = useState(() => sessionStorage.getItem('rag_studio_started_project'))

  const setSelectedProject = (project) => {
    setSelectedProjectState(project)
    if (project) localStorage.setItem('rag_studio_selected_project', JSON.stringify(project))
    else localStorage.removeItem('rag_studio_selected_project')
    sessionStorage.removeItem('rag_studio_started_project')
    setStartedProjectId(null)
  }

  const startProject = () => {
    if (!selectedProject) return
    sessionStorage.setItem('rag_studio_started_project', selectedProject.project_id)
    setStartedProjectId(selectedProject.project_id)
  }
  const hasStartedProject = Boolean(selectedProject && startedProjectId === selectedProject.project_id)

  return (
    <ProjectContext.Provider value={{ selectedProject, setSelectedProject, startProject, hasStartedProject }}>
      {children}
    </ProjectContext.Provider>
  )
}

export function useProject() {
  const ctx = useContext(ProjectContext)
  if (!ctx) throw new Error('useProject must be used within ProjectProvider')
  return ctx
}