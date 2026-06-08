import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

const MAX_RETRIES = 4;
const RETRY_DELAY_MS = 750;

function isTransientNetworkError(err) {
  if (err.response) return false;
  const code = err.code || '';
  const message = err.message || '';
  return (
    code === 'ERR_NETWORK'
    || code === 'ECONNABORTED'
    || code === 'ECONNREFUSED'
    || code === 'ECONNRESET'
    || message.includes('Network Error')
  );
}

function wait(ms) {
  return new Promise((resolve) => { setTimeout(resolve, ms); });
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('educare_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const config = err.config;

    if (config && isTransientNetworkError(err)) {
      config.__retryCount = config.__retryCount || 0;
      if (config.__retryCount < MAX_RETRIES) {
        config.__retryCount += 1;
        await wait(RETRY_DELAY_MS * config.__retryCount);
        return api(config);
      }
    }

    if (err.response?.status === 401) {
      localStorage.removeItem('educare_token');
      localStorage.removeItem('educare_user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;

// Auth
export const login = (data) => api.post('/auth/login', data);
export const register = (data) => api.post('/auth/register', data);
export const getMe = () => api.get('/auth/me');

// Classes
export const getClasses = () => api.get('/classes');
export const createClass = (data) => api.post('/classes', data);
export const getClass = (id) => api.get(`/classes/${id}`);
export const updateClass = (id, data) => api.put(`/classes/${id}`, data);
export const deleteClass = (id) => api.delete(`/classes/${id}`);

// Students
export const getStudents = (params) => api.get('/students', { params });
export const getMyProfile = () => api.get('/students/me/profile');
export const getStudent = (id) => api.get(`/students/${id}`);
export const getRiskStudents = (params) => api.get('/students/risk-list', { params });
export const createStudent = (data) => api.post('/students', data);
export const updateStudent = (id, data) => api.put(`/students/${id}`, data);
export const deleteStudent = (id) => api.delete(`/students/${id}`);

// Upload
export {
  downloadUploadTemplate,
  uploadClassData,
  getUploadPreview,
  runUploadPrediction,
} from './uploadService';

// Predictions
export const getClassPredictions = (classId) => api.get(`/predictions/class/${classId}`);
export const getStudentPredictions = (studentId) => api.get(`/predictions/student/${studentId}`);

// Dashboard
export const getTeacherDashboard = () => api.get('/dashboard/teacher');
export const getClassDashboard = (classId) => api.get(`/dashboard/class/${classId}`);
export const getRiskSummary = (params) => api.get('/dashboard/risk-summary', { params });

// Interventions
export const getInterventions = () => api.get('/interventions');
export const getStudentInterventions = (studentId) => api.get(`/interventions/student/${studentId}`);
export const createIntervention = (data) => api.post('/interventions', data);
export const updateIntervention = (id, data) => api.put(`/interventions/${id}`, data);
export const deleteIntervention = (id) => api.delete(`/interventions/${id}`);
