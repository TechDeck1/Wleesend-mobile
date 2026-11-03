import { AuthSession, AuthUser } from '@/api/auth-session';
import { apiClient } from '@/api/client';
import { API_ENDPOINTS } from '@/config/api';
import { LoginCredentials, LoginResponse, Registration, RegistrationResponse } from '@/types/auth';


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
  const response = await apiClient.post<LoginResponse, LoginCredentials>(
    API_ENDPOINTS.auth.login,
    { email: email.trim(), pin: password },
    { skipAuth: true },
  );

  return toAuthSession(response);
}

export async function Register(
  user: Omit<AuthUser, 'userId' | 'profilePic' | 'accountNumber' | 'role'>,
  pin: string,
  confirmPin: string,
): Promise<void> {
  const response = await apiClient.post<RegistrationResponse, Registration>(
    API_ENDPOINTS.auth.signUp,
    {
      firstName: user.firstName.trim(),
      lastName: user.lastName.trim(),
      emailId: user.email.trim(),
      pin,
      ConfirmPin: confirmPin,
      KYCStatusId: 1,
      KYCLevel: 1,
      phoneNumber: user.phone.trim(),
    },
    { skipAuth: true },
  );

  if (!response?.success) {
    throw new Error(response?.errorMessage || response?.message || 'Account creation failed.');
  }
}
