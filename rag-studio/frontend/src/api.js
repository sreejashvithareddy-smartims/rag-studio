import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export const getTechniques = () => api.get('/techniques').then(r => r.data)
export const getDocuments = () => api.get('/documents').then(r => r.data)
export const uploadDocument = (file, onProgress) => {
  const form = new FormData()
  form.append('file', file)
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

export default api
