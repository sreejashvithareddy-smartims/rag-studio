import { createContext, useContext, useState, useEffect } from 'react'

const DocumentContext = createContext(null)

export function DocumentProvider({ children }) {
  const [selectedDoc, setSelectedDocState] = useState(() => {
    const saved = localStorage.getItem('rag_studio_selected_doc')
    return saved ? JSON.parse(saved) : null
  })

  const setSelectedDoc = (doc) => {
    setSelectedDocState(doc)
    if (doc) localStorage.setItem('rag_studio_selected_doc', JSON.stringify(doc))
    else localStorage.removeItem('rag_studio_selected_doc')
  }

  return (
    <DocumentContext.Provider value={{ selectedDoc, setSelectedDoc }}>
      {children}
    </DocumentContext.Provider>
  )
}

export function useDocument() {
  const ctx = useContext(DocumentContext)
  if (!ctx) throw new Error('useDocument must be used within DocumentProvider')
  return ctx
}
