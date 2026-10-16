import axios from 'axios';
import { store } from '../store/store';
import { logout } from '../store/slices/authSlice';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
});

let refreshPromise = null;

async function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(
        `${import.meta.env.VITE_API_URL || '/api'}/auth/refresh`,
        {},
        { withCredentials: true }
      )
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

async function clearBrokenSession() {
  try {
    store.dispatch(logout());
  } catch {
    localStorage.removeItem('employeeUser');
    localStorage.removeItem('employeeToken');
  }
  if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
    window.location.assign('/login');
  }
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('employeeToken');
  if (token && token !== 'session') {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const url = String(original?.url || '');
    const isAuthRoute =
      url.includes('/employees/login') ||
      url.includes('/auth/refresh') ||
      url.includes('/employees/logout');

    if (status === 401 && original && !original._retry && !isAuthRoute) {
      original._retry = true;
      try {
        const res = await refreshSession();
        const nextToken = res?.data?.accessToken;
        if (nextToken) {
          localStorage.setItem('employeeToken', nextToken);
        }
        return await api(original);
      } catch {
        await clearBrokenSession();
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

export const getFileUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const baseUrl = (import.meta.env.VITE_API_URL || '/api').replace('/api', '') || '';
  return `${baseUrl}${path}`;
};
