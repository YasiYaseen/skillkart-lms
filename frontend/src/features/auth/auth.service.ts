import {
  googleLogin,
  loginApi,
  registerApi,
  completeOnboardingApi,
  getOnboardingStatusApi,
  forgotPasswordApi,
  resetPasswordApi,
  LoginPayload,
  RegisterPayload,
  OnboardingPayload,
  AuthResponse,
  AuthUser,
} from './auth.api';

export type { LoginPayload, RegisterPayload, OnboardingPayload, AuthResponse, AuthUser };

export const loginWithGoogle = async (accessToken: string): Promise<AuthResponse> => {
  const res = await googleLogin(accessToken);
  return res.data;
};

export const loginWithEmail = async (data: LoginPayload): Promise<AuthResponse> => {
  const res = await loginApi(data);
  return res.data;
};

export const registerWithEmail = async (data: RegisterPayload): Promise<AuthResponse> => {
  const res = await registerApi(data);
  return res.data;
};

export const completeOnboarding = async (data: OnboardingPayload): Promise<{ user: AuthUser }> => {
  const res = await completeOnboardingApi(data);
  return res.data;
};

export const getOnboardingStatus = async (): Promise<{ user: AuthUser; onboardingCompleted: boolean }> => {
  const res = await getOnboardingStatusApi();
  return res.data;
};

export const requestPasswordReset = async (email: string): Promise<{ message: string; resetToken?: string }> => {
  const res = await forgotPasswordApi(email);
  return res.data;
};

export const resetPasswordWithToken = async (token: string, newPassword: string): Promise<{ message: string }> => {
  const res = await resetPasswordApi(token, newPassword);
  return res.data;
};


