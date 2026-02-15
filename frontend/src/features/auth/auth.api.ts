import { api } from '@/lib/api';

export const googleLogin = async (accessToken: string) =>
  api.post('api/auth/google', { access_token: accessToken });
