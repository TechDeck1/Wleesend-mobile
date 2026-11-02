import { request } from './request';
import type { ApiMethod, ApiRequestOptions } from './types';

export type GenericResponse = {
  success: boolean;
  message: string;
};

export type SendDualEmailOtpPayload = {
  firstEmail: string;
  secondEmail: string;
};

export type VerifyDualEmailOtpPayload = SendDualEmailOtpPayload & {
  firstOtp: string;
  secondOtp: string;
};

export const apiClient = {
  
  request<TResponse = unknown, TBody = unknown>(
    method: ApiMethod,
    path: string,
    options?: ApiRequestOptions<TBody>,
  ): Promise<TResponse> {
    return request<TResponse, TBody>(method, path, options);
  },

  get<TResponse = unknown>(
    path: string,
    options?: ApiRequestOptions,
  ): Promise<TResponse> {
    return request<TResponse>('GET', path, options);
  },

  post<TResponse = unknown, TBody = unknown>(
    path: string,
    body?: TBody,
    options?: ApiRequestOptions,
  ): Promise<TResponse> {
    return request<TResponse, TBody>('POST', path, { ...options, body });
  },

  patch<TResponse = unknown, TBody = unknown>(
    path: string,
    body?: TBody,
    options?: ApiRequestOptions,
  ): Promise<TResponse> {
    return request<TResponse, TBody>('PATCH', path, { ...options, body });
  },

  delete<TResponse = unknown>(
    path: string,
    options?: ApiRequestOptions,
  ): Promise<TResponse> {
    return request<TResponse>('DELETE', path, options);
  },
};

export { ApiError, ApiTimeoutError } from './request';
export { Login, Register, resendVerificationEmail } from './auth';
export { getAuthSession, saveAuthSession, clearAuthSession } from './auth-session';
export type { ApiMethod, ApiQueryParams, ApiQueryValue, ApiRequestOptions } from './types';