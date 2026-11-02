import { API_ENDPOINTS } from '@/config/api';
import { request } from './request';
import type { AuthSession, AuthUser } from './auth-session';

type LoginResponse = {
  success: boolean;
  token?: string | null;
  userId?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  profilePic?: string | null;
  phoneNumber?: string | null;
  accountNumber?: string | null;
  email?: string | null;
  role?: string | null;
  errorMessage?: string | null;
};

type RegistrationResponse = {
  success: boolean;
  errorMessage?: string | null;
  message?: string | null;
};

type ResendVerificationResponse = {
  success: boolean;
  message?: string | null;
  errorMessage?: string | null;
};

type LoginCredentials = {
  email: string;
  pin: string;
};

type Registration = {
  firstName: string;
  lastName: string;
  emailId: string;
  pin: string;
  ConfirmPin: string;
  KYCStatusId: number;
  KYCLevel: number;
  phoneNumber: string;
};

function toAuthSession(response: LoginResponse): AuthSession {
  if (!response.success || !response.token) {
    throw new Error(response.errorMessage || 'Sign-in failed. Check your details and try again.');
  }

  if (!response.email || !response.firstName || !response.userId) {
    throw new Error('The sign-in response is missing required account information.');
  }

  const user: AuthUser = {
    userId: response.userId,
    firstName: response.firstName,
    lastName: response.lastName ?? '',
    profilePic: response.profilePic ?? '',
    phone: response.phoneNumber ?? '',
    accountNumber: response.accountNumber ?? '',
    email: response.email,
    role: response.role ?? '',
  };

  return { token: response.token, user };
}

export async function Login(email: string, password: string): Promise<AuthSession> {
  const response = await request<LoginResponse, LoginCredentials>(
    'POST',
    API_ENDPOINTS.auth.login,
    { body: { email: email.trim(), pin : password }, skipAuth: true },
  );

  return toAuthSession(response);
}

export async function Register(
  user: Omit<AuthUser, 'userId' | 'profilePic' | 'accountNumber' | 'role'>,
  pin: string,
  confirmPin: string,
): Promise<void> {
  const response = await request<RegistrationResponse, Registration>(
    'POST',
    API_ENDPOINTS.auth.signUp,
    {
      body: {
        firstName: user.firstName.trim(),
        lastName: user.lastName.trim(),
        emailId: user.email.trim(),
        pin,
        ConfirmPin: confirmPin,
        KYCStatusId: 1,
        KYCLevel: 1,
        phoneNumber: user.phone.trim(),
      },
      skipAuth: true,
    },
  );

  if (!response?.success) {
    console.log("erorr" , response.errorMessage , response.message);
    throw new Error(response.errorMessage || response.message || 'Account creation failed.');
  }
}

export async function resendVerificationEmail(email: string): Promise<string> {
  const response = await request<ResendVerificationResponse, { email: string }>(
    'POST',
    API_ENDPOINTS.auth.resendVerificationEmail,
    {
      body: { email: email.trim() },
      skipAuth: true,
    },
  );

  if (!response?.success) {
    throw new Error(response.errorMessage || response.message || 'Unable to resend the verification email.');
  }

  return response.message || 'Verification email sent.';
}
