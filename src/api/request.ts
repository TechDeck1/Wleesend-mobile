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

  const entries = params instanceof URLSearchParams ? params.entries() : Object.entries(params);

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

function getErrorMessage(responseBody: unknown, response: Response): string {
  if (typeof responseBody === 'string' && responseBody.trim()) {
    return responseBody;
  }

  if (responseBody && typeof responseBody === 'object') {
    const responseObject = responseBody as Record<string, unknown>;
    if (typeof responseObject.message === 'string' && responseObject.message.trim()) {
      return responseObject.message;
    }
    if (typeof responseObject.error === 'string' && responseObject.error.trim()) {
      return responseObject.error;
    }
    if (typeof responseObject.errorMessage === 'string' && responseObject.errorMessage.trim()) {
      return responseObject.errorMessage;
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
    onUploadProgress,
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

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  let serializedBody: BodyInit | undefined;
  if (body !== undefined) {
    if (isFormData) {
      serializedBody = body as FormData;
      // The transport must supply the multipart boundary.
      headers.delete('Content-Type');
    } else {
      serializedBody = JSON.stringify(body);
      if (serializedBody === undefined) {
        throw new TypeError('The request body could not be serialized as JSON.');
      }
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
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
    if (isFormData && onUploadProgress) {
      return await new Promise<TResponse>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open(method, url.toString());
        headers.forEach((value, name) => xhr.setRequestHeader(name, value));
        xhr.timeout = timeoutMs;
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) onUploadProgress(Math.round((event.loaded / event.total) * 100));
        };
        xhr.onload = () => {
          const contentType = xhr.getResponseHeader('content-type')?.toLowerCase() ?? '';
          let responseBody: unknown = xhr.responseText;
          if (xhr.status === 204 || xhr.status === 205 || !xhr.responseText) responseBody = undefined;
          else if (contentType.includes('json')) {
            try { responseBody = JSON.parse(xhr.responseText); } catch { responseBody = xhr.responseText; }
          }
          if (xhr.status >= 200 && xhr.status < 300) resolve(responseBody as TResponse);
          else reject(new ApiError(getErrorMessage(responseBody, new Response(null, { status: xhr.status, statusText: xhr.statusText })), xhr.status, responseBody));
        };
        xhr.onerror = () => reject(new Error('Network request failed.'));
        xhr.ontimeout = () => reject(new ApiTimeoutError(timeoutMs));
        xhr.onabort = () => reject(new Error('Request was cancelled.'));
        const abort = () => xhr.abort();
        if (signal?.aborted) xhr.abort();
        else signal?.addEventListener('abort', abort, { once: true });
        xhr.onloadend = () => signal?.removeEventListener('abort', abort);
        xhr.send(serializedBody);
      });
    }
    const response = await fetch(url.toString(), {
      ...fetchOptions,
      method,
      headers,
      body: serializedBody,
      signal: controller.signal,
    });
    const responseBody = await readResponseBody(response);

    if (!response.ok) {
      const error = new ApiError(
        getErrorMessage(responseBody, response),
        response.status,
        responseBody,
      );
      if (response.status === 401 && !skipAuth) {
        await clearAuthSession();
      }
      throw error;
    }

    return responseBody as TResponse;
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
