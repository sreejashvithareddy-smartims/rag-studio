import { Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar.jsx'
import ProjectsPage from './pages/ProjectsPage.jsx'
import DocumentsPage from './pages/DocumentsPage.jsx'
import QueryPage from './pages/QueryPage.jsx'
import ComparePage from './pages/ComparePage.jsx'
import { DocumentProvider } from './context/DocumentContext.jsx'
import { ProjectProvider, useProject } from './context/ProjectContext.jsx'

function ProjectGuard({ children }) {
  const { selectedProject } = useProject()
  if (!selectedProject) return <Navigate to="/" replace />
  return children
}

function AppShell() {
  const { selectedProject } = useProject()
  return (
    <div className="flex min-h-screen">
      {selectedProject && <Sidebar />}
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<ProjectsPage />} />
          <Route path="/documents" element={<ProjectGuard><DocumentsPage /></ProjectGuard>} />
          <Route path="/query" element={<ProjectGuard><QueryPage /></ProjectGuard>} />
          <Route path="/compare" element={<ProjectGuard><ComparePage /></ProjectGuard>} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <ProjectProvider>
      <DocumentProvider>
        <AppShell />
      </DocumentProvider>
    </ProjectProvider>
  )
}