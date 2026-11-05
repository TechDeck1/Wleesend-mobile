export type ApiMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

export type ApiQueryValue = string | number | boolean | null | undefined;

export type ApiQueryParams = Record<string, ApiQueryValue> | URLSearchParams;

export interface ApiRequestOptions<TBody = unknown> extends Omit<
  RequestInit,
  'method' | 'body' | 'headers'
> {
  skipAuth?: boolean;
  accessToken?: string;
  body?: TBody;
  headers?: HeadersInit;
  params?: ApiQueryParams;
  timeoutMs?: number;
  onUploadProgress?: (progress: number) => void;
}

export type GenericResponse = {
  success: boolean;
  message: string;
};
