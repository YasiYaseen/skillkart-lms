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
