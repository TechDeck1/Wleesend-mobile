import { AuthSession, AuthUser } from '@/api/auth-session';
import { apiClient } from '@/api/client';
import { API_ENDPOINTS } from '@/config/api';
import { LoginCredentials, LoginResponse, Registration, RegistrationResponse } from '@/types/auth';
import { resendVerificationEmail } from './accountService';

const EMAIL_NOT_VERIFIED_MESSAGE = 'Please verify your email to activate your account.';

export class EmailVerificationRequiredError extends Error {
  constructor(
    public readonly email: string,
    public readonly resendError?: string,
  ) {
    super(EMAIL_NOT_VERIFIED_MESSAGE);
    this.name = 'EmailVerificationRequiredError';
  }
}

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

export async function login(email: string, password: string): Promise<AuthSession> {
  const normalizedEmail = email.trim();
  try {
    const response = await apiClient.post<LoginResponse, LoginCredentials>(
      API_ENDPOINTS.auth.login,
      { email: normalizedEmail, pin: password },
      { skipAuth: true },
    );

    return toAuthSession(response);
  } catch (error) {
    if (error instanceof Error && error.message === EMAIL_NOT_VERIFIED_MESSAGE) {
      try {
        await resendVerificationEmail(normalizedEmail);
        throw new EmailVerificationRequiredError(normalizedEmail);
      } catch (resendError) {
        if (resendError instanceof EmailVerificationRequiredError) throw resendError;
        throw new EmailVerificationRequiredError(
          normalizedEmail,
          resendError instanceof Error ? resendError.message : 'Unable to resend the verification email.',
        );
      }
    }
    throw error;
  }
}

export async function register(
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
  console.log("res", response);

  if (!response?.success) {
    throw new Error(response?.errorMessage || response?.message || 'Account creation failed.');
  }
}
