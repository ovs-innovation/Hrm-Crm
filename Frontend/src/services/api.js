import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('employeeToken');
  if (token && token !== 'session') {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

export const getFileUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const baseUrl = (import.meta.env.VITE_API_URL || '/api').replace('/api', '') || '';
  return `${baseUrl}${path}`;
};
