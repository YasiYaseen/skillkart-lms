import { googleLogin, loginApi, registerApi } from './auth.api';

export const loginWithGoogle = async (accessToken: string) => {
  const res = await googleLogin(accessToken);
  return res.data;
};

export const loginWithEmail = async (data: any) => {
  const res = await loginApi(data);
  return res.data;
};

export const registerWithEmail = async (data: any) => {
  const res = await registerApi(data);
  return res.data;
};
