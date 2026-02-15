import { googleLogin } from './auth.api';

export const loginWithGoogle = async (accessToken: string) => {
  const res = await googleLogin(accessToken);

  return res.data;
};
