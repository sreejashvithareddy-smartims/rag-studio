import { createContext, useContext, useState } from 'react'

const ProjectContext = createContext(null)

export function ProjectProvider({ children }) {
  const [selectedProject, setSelectedProjectState] = useState(() => {
    const saved = localStorage.getItem('rag_studio_selected_project')
    return saved ? JSON.parse(saved) : null
  })

  const setSelectedProject = (project) => {
    setSelectedProjectState(project)
    if (project) localStorage.setItem('rag_studio_selected_project', JSON.stringify(project))
    else localStorage.removeItem('rag_studio_selected_project')
  }

  return (
    <ProjectContext.Provider value={{ selectedProject, setSelectedProject }}>
      {children}
    </ProjectContext.Provider>
  )
}

export function useProject() {
  const ctx = useContext(ProjectContext)
  if (!ctx) throw new Error('useProject must be used within ProjectProvider')
  return ctx
}