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

export interface InstructorApplication {
  teachingExperience: 'none' | 'in_person' | 'online' | 'professional';
  primaryTopic: string;
  experienceDetails: string;
  sampleVideoOrPortfolioUrl?: string;
  linkedinUrl?: string;
  appliedAt?: string;
  rejectionReason?: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'instructor' | 'admin';
  onboardingCompleted: boolean;
  isInstructorApproved?: boolean;
  instructorStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  instructorRejectionReason?: string;
  instructorApplication?: InstructorApplication;
  avatar?: string;
  isActive?: boolean;
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

export interface CompleteOnboardingResponse {
  message: string;
  requiresApproval?: boolean;
  user: AuthUser;
}

export const googleLogin = async (accessToken: string) =>
  api.post<AuthResponse>('/auth/google', { access_token: accessToken });

export const loginApi = async (data: LoginPayload) =>
  api.post<AuthResponse>('/auth/login', data);

export const registerApi = async (data: RegisterPayload) =>
  api.post<AuthResponse>('/auth/register', data);

export const completeOnboardingApi = async (data: OnboardingPayload) =>
  api.post<CompleteOnboardingResponse>('/auth/onboarding/complete', data);

export const getOnboardingStatusApi = async () =>
  api.get<{ user: AuthUser; onboardingCompleted: boolean; role?: string }>('/auth/onboarding/status');

export const getMeApi = async () =>
  api.get<{ user: AuthUser; onboardingCompleted: boolean; role?: string }>('/auth/me');

export const forgotPasswordApi = async (email: string) =>
  api.post<{ message: string; resetToken?: string }>('/auth/forgot-password', { email });

export const resetPasswordApi = async (token: string, newPassword: string) =>
  api.post<{ message: string }>('/auth/reset-password', { token, newPassword });

