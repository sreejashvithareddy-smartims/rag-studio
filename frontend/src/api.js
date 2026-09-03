import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export const getTechniques = () => api.get('/techniques').then(r => r.data)

export const getDocuments = (projectId) =>
  api.get('/documents', { params: { project_id: projectId } }).then(r => r.data)

export const uploadDocument = (file, projectId, onProgress) => {
  const form = new FormData()
  form.append('file', file)
  if (projectId) form.append('project_id', projectId)
  return api.post('/documents/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (evt) => {
      if (onProgress) onProgress(Math.round((evt.loaded * 100) / evt.total))
    },
  }).then(r => r.data)
}

export const deleteDocument = (docId) => api.delete(`/documents/${docId}`).then(r => r.data)

export const runQuery = (payload) => api.post('/query', payload).then(r => r.data)
export const runCompare = (payload) => api.post('/compare', payload).then(r => r.data)
export const submitFeedback = (payload) => api.post('/feedback', payload).then(r => r.data)

export const createProject = (name) => api.post('/projects', { name }).then(r => r.data)
export const getProjects = () => api.get('/projects').then(r => r.data)
export const deleteProject = (projectId) => api.delete(`/projects/${projectId}`).then(r => r.data)
export const getProjectHistory = (projectId) => api.get(`/projects/${projectId}/history`).then(r => r.data)

export default api