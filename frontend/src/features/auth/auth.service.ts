import {
  googleLogin,
  loginApi,
  registerApi,
  completeOnboardingApi,
  getOnboardingStatusApi,
} from './auth.api';

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

export const completeOnboarding = async (data: any) => {
  const res = await completeOnboardingApi(data);
  return res.data;
};

export const getOnboardingStatus = async () => {
  const res = await getOnboardingStatusApi();
  return res.data;
};
