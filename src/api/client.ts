import { request } from './request';
import type { ApiMethod, ApiRequestOptions } from './types';

export const apiClient = {
  request<TResponse = unknown, TBody = unknown>(
    method: ApiMethod,
    path: string,
    options?: ApiRequestOptions<TBody>,
  ): Promise<TResponse> {
    return request<TResponse, TBody>(method, path, options);
  },

  get<TResponse = unknown>(path: string, options?: ApiRequestOptions): Promise<TResponse> {
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

  delete<TResponse = unknown>(path: string, options?: ApiRequestOptions): Promise<TResponse> {
    return request<TResponse>('DELETE', path, options);
  },
};

export { ApiError, ApiTimeoutError } from './request';
export { getAuthSession, saveAuthSession, clearAuthSession } from './auth-session';
export type { ApiMethod, ApiQueryParams, ApiQueryValue, ApiRequestOptions } from './types';
