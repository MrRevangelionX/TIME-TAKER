import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

/* --- Workers --- */
export const WorkersAPI = {
  list: () => api.get('/workers').then((r) => r.data.data),
  get: (id) => api.get(`/workers/${id}`).then((r) => r.data.data),
  create: (payload) => api.post('/workers', payload).then((r) => r.data),
  update: (id, payload) => api.put(`/workers/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/workers/${id}`).then((r) => r.data),
};

/* --- Time marks --- */
export const TimeMarksAPI = {
  list: (params = {}) => api.get('/time-marks', { params }).then((r) => r.data.data),
  get: (id) => api.get(`/time-marks/${id}`).then((r) => r.data.data),
  create: (payload) => api.post('/time-marks', payload).then((r) => r.data),
  update: (id, payload) => api.put(`/time-marks/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/time-marks/${id}`).then((r) => r.data),
};

/* --- Analytics --- */
export const AnalyticsAPI = {
  get: (params = {}) => api.get('/analytics', { params }).then((r) => r.data.data),
};

export default api;
