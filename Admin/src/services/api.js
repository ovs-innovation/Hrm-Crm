import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3072/api',
  withCredentials: true,
});

export default api;

export const getFileUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3072/api').replace('/api', '');
  return `${baseUrl}${path}`;
};
