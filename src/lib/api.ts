let authorizationHeader = '';
let onUnauthorized: (() => void) | null = null;

export function encodeBasicCredentials(username: string, password: string): string {
  const bytes = new TextEncoder().encode(`${username}:${password}`);
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return `Basic ${btoa(binary)}`;
}

export function setAuthorizationHeader(value: string): void {
  authorizationHeader = value;
}

/** Called when an API request is refused mid-session (e.g. the auth mode changed), so the app can show the login page. */
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    cache: 'no-store',
    credentials: 'same-origin',
    ...init,
    headers: {
      ...(authorizationHeader ? { Authorization: authorizationHeader } : {}),
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });

  const payload = (await response.json().catch(() => ({}))) as { error?: string };
  if (!response.ok) {
    if (response.status === 401 && !path.startsWith('/api/auth/')) onUnauthorized?.();
    throw new Error(payload.error || `API ${response.status}`);
  }

  return payload as T;
}

export function apiUrl(path: string): string {
  return path;
}
