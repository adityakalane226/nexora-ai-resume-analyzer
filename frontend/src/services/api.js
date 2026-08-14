import axios from 'axios';

// in development: vite proxies /api → http://localhost:5000/api (see vite.config.js)
// in production:  set vite_api_url=https://your-backend.com/api in frontend/.env
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({ baseURL: BASE_URL });

// attach jwt to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('nexora_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// handle 401 globally (force logout if token expires)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('nexora_token');
      localStorage.removeItem('nexora_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ---- auth ----
export const registerUser = (data) => api.post('/auth/register', data);
export const loginUser = (data) => api.post('/auth/login', data);
export const getMe = () => api.get('/auth/me');

// ---- resumes ----
export const uploadResume = (formData, onProgress) =>
  api.post('/resumes/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress
  });
export const getMyResumes = () => api.get('/resumes');
export const getResumeById = (id) => api.get(`/resumes/${id}`);
export const deleteResume = (id) => api.delete(`/resumes/${id}`);

// ---- jobs ----
export const getJobs = () => api.get('/jobs');
export const getJobById = (id) => api.get(`/jobs/${id}`);
export const createJob = (data) => api.post('/jobs', data);

// ---- analyses ----
export const createAnalysis = (data) => api.post('/analyses', data);
export const getMyAnalyses = () => api.get('/analyses');
export const getAnalysisById = (id) => api.get(`/analyses/${id}`);
export const getDashboardStats = () => api.get('/analyses/stats');
export const getMLHealth = () => api.get('/analyses/ml-health');

export default api;
