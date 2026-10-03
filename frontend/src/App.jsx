import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Sidebar from './components/Sidebar.jsx'
import ProjectsPage from './pages/ProjectsPage.jsx'
import ProjectStartPage from './pages/ProjectStartPage.jsx'
import DocumentsPage from './pages/DocumentsPage.jsx'
import QueryPage from './pages/QueryPage.jsx'
import ComparePage from './pages/ComparePage.jsx'
import ProjectHistoryPage from './pages/ProjectHistoryPage.jsx'
import { DocumentProvider } from './context/DocumentContext.jsx'
import { ProjectProvider, useProject } from './context/ProjectContext.jsx'

function ProjectGuard({ children }) {
  const { selectedProject, hasStartedProject } = useProject()
  if (!selectedProject) return <Navigate to="/" replace />
  if (!hasStartedProject) return <Navigate to="/start" replace />
  return children
}

function ProjectStartGuard() {
  const { selectedProject, hasStartedProject } = useProject()
  if (!selectedProject) return <Navigate to="/" replace />
  if (hasStartedProject) return <Navigate to="/documents" replace />
  return <ProjectStartPage />
}

function AppShell() {
  const { selectedProject, hasStartedProject } = useProject()
  const location = useLocation()
  const showSidebar = selectedProject && hasStartedProject && location.pathname !== '/start'
  return (
    <div className="flex min-h-screen">
      {showSidebar && <Sidebar />}
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<ProjectsPage />} />
          <Route path="/start" element={<ProjectStartGuard />} />
          <Route path="/documents" element={<ProjectGuard><DocumentsPage /></ProjectGuard>} />
          <Route path="/query" element={<ProjectGuard><QueryPage /></ProjectGuard>} />
          <Route path="/compare" element={<ProjectGuard><ComparePage /></ProjectGuard>} />
          <Route path="/project-history" element={<ProjectGuard><ProjectHistoryPage /></ProjectGuard>} />
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