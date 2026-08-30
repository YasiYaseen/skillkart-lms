import { api } from '@/lib/api';

export interface LoginPayload {
  email: string;
  password?: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password?: string;
  role?: 'student' | 'instructor';
}

export interface OnboardingPayload {
  role?: 'student' | 'instructor';
  headline?: string;
  bio?: string;
  interests?: string[];
  socialLinks?: {
    website?: string;
    linkedin?: string;
    twitter?: string;
  };
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'instructor' | 'admin';
  onboardingCompleted: boolean;
  avatar?: string;
  headline?: string;
  bio?: string;
  interests?: string[];
  socialLinks?: {
    website?: string;
    linkedin?: string;
    twitter?: string;
  };
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export const googleLogin = async (accessToken: string) =>
  api.post<AuthResponse>('/auth/google', { access_token: accessToken });

export const loginApi = async (data: LoginPayload) =>
  api.post<AuthResponse>('/auth/login', data);

export const registerApi = async (data: RegisterPayload) =>
  api.post<AuthResponse>('/auth/register', data);

export const completeOnboardingApi = async (data: OnboardingPayload) =>
  api.post<{ user: AuthUser }>('/auth/onboarding/complete', data);

export const getOnboardingStatusApi = async () =>
  api.get<{ user: AuthUser; onboardingCompleted: boolean }>('/auth/onboarding/status');

