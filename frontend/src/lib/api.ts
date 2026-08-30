import axios from 'axios';

const rawBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const cleanBase = rawBase.replace(/\/+$/, '');

export const api = axios.create({
  baseURL: `${cleanBase}/api`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register');
      if (!isAuthEndpoint && localStorage.getItem('token')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('auth:expired'));
      }
    }
    return Promise.reject(error);
  }
);
