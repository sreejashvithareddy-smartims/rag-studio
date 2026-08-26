import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar.jsx'
import DocumentsPage from './pages/DocumentsPage.jsx'
import QueryPage from './pages/QueryPage.jsx'
import ComparePage from './pages/ComparePage.jsx'
import { DocumentProvider } from './context/DocumentContext.jsx'

export default function App() {
  return (
    <DocumentProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<DocumentsPage />} />
            <Route path="/query" element={<QueryPage />} />
            <Route path="/compare" element={<ComparePage />} />
          </Routes>
        </main>
      </div>
    </DocumentProvider>
  )
}
