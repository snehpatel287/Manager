// HTTP client for the Express + MongoDB API in server/. Server-side only:
// API_KEY is not a NEXT_PUBLIC_ variable, so it never reaches the browser.

const API_URL = (process.env.API_URL || 'http://localhost:4000').replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api${path}`, {
      method,
      headers: {
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
        ...(process.env.API_KEY && { 'x-api-key': process.env.API_KEY }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: 'no-store',
    });
  } catch {
    throw new Error(`Can't reach the API at ${API_URL}. Is it running? (npm run dev:api)`);
  }

  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, data?.error ?? `API error (HTTP ${res.status})`);
  return data as T;
}

/** Like `request`, but resolves to null on 404 instead of throwing. */
export async function orNull<T>(promise: Promise<T>): Promise<T | null> {
  try {
    return await promise;
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  find: <T>(path: string) => orNull(request<T>('GET', path)),
  post: <T>(path: string, body: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body: unknown) => orNull(request<T>('PUT', path, body)),
  delete: (path: string) => orNull(request<void>('DELETE', path)),
};
