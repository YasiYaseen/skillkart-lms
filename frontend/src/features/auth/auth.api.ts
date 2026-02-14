import { api } from '@/lib/api';

export const googleLogin = async (accessToken: string) =>
  api.post('/auth/google', { access_token: accessToken });
