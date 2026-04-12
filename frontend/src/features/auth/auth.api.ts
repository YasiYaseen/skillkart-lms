import { api } from '@/lib/api';

export const googleLogin = async (accessToken: string) =>
  api.post('/auth/google', { access_token: accessToken });

export const loginApi = async (data: any) => api.post('/auth/login', data);
export const registerApi = async (data: any) => api.post('/auth/register', data);
