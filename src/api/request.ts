import { clearAuthSession, getAuthSession } from './auth-session';
import type { ApiMethod, ApiQueryParams, ApiRequestOptions } from './types';

const DEFAULT_TIMEOUT_MS = 30_000;

export class ApiError<TData = unknown> extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly data: TData,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ApiTimeoutError extends Error {
  constructor(public readonly timeoutMs: number) {
    super(`The request timed out after ${timeoutMs} ms.`);
    this.name = 'ApiTimeoutError';
  }
}

function appendQueryParams(url: URL, params: ApiQueryParams | undefined): void {
  if (!params) {
    return;
  }

  const entries =
    params instanceof URLSearchParams
      ? params.entries()
      : Object.entries(params);

  for (const [key, value] of entries) {
    if (value !== null && value !== undefined) {
      url.searchParams.append(key, String(value));
    }
  }
}

async function readResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204 || response.status === 205) {
    return undefined;
  }

  const text = await response.text();
  if (!text) {
    return undefined;
  }

  const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
  return contentType.includes('json') ? JSON.parse(text) : text;
}

function getErrorMessage(data: unknown, response: Response): string {
  if (typeof data === 'string' && data.trim()) {
    return data;
  }

  if (data && typeof data === 'object') {
    const body = data as Record<string, unknown>;
    if (typeof body.message === 'string' && body.message.trim()) {
      return body.message;
    }
    if (typeof body.error === 'string' && body.error.trim()) {
      return body.error;
    }
    if (typeof body.errorMessage === 'string' && body.errorMessage.trim()) {
      return body.errorMessage;
    }
  }

  return response.statusText || `Request failed with status ${response.status}.`;
}

export async function request<TResponse = unknown, TBody = unknown>(
  method: ApiMethod,
  path: string,
  options: ApiRequestOptions<TBody> = {},
): Promise<TResponse> {
  const {
    accessToken,
    body,
    headers: requestHeaders,
    params,
    skipAuth = false,
    signal,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    ...fetchOptions
  } = options;

  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new RangeError('timeoutMs must be a positive number.');
  }

  const url = new URL(path);
  appendQueryParams(url, params);

  const headers = new Headers(requestHeaders);
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }
  const session = skipAuth ? null : await getAuthSession();
  const token = accessToken ?? session?.token;
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let serializedBody: string | undefined;
  if (body !== undefined) {
    serializedBody = JSON.stringify(body);
    if (serializedBody === undefined) {
      throw new TypeError('The request body could not be serialized as JSON.');
    }
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
  }

  const controller = new AbortController();
  let timedOut = false;


  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  
  const abortRequest = () => controller.abort();

  if (signal?.aborted) {
    controller.abort();
  } else {
    signal?.addEventListener('abort', abortRequest, { once: true });
  }

  try {
    const response = await fetch(url.toString(), {
      ...fetchOptions,
      method,
      headers,
      body: serializedBody,
      signal: controller.signal,
    });
    const data = await readResponseBody(response);

    if (!response.ok) {
      const error = new ApiError(getErrorMessage(data, response), response.status, data);
      if (response.status === 401 && !skipAuth) {
        await clearAuthSession();
      }
      throw error;
    }

    return data as TResponse;
  } catch (error) {
    if (timedOut) {
      throw new ApiTimeoutError(timeoutMs);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abortRequest);
  }
}
