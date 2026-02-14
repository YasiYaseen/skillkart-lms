import { googleLogin } from './auth.api';

export const loginWithGoogle = async (accessToken: string) => {
  const res = await googleLogin(accessToken);

  localStorage.setItem('token', res.data.token);

  return res.data.user;
};
