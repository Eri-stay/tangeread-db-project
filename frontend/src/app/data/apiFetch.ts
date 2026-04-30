const apiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8080/api';

/**
 * Wrapper around fetch that:
 * - Automatically attaches Bearer token from localStorage
 * - On 401: clears session and redirects to home
 * - On 403: redirects to /unauthorized with the appropriate reason
 */
export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem('token');

  const headers: HeadersInit = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${apiUrl}${path}`, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/unauthorized?reason=not_logged_in';
    throw new Error('Session expired — please log in again');
  }

  if (res.status === 403) {
    let reason = 'insufficient_role';
    try {
      const data = await res.clone().json();
      if (typeof data?.error === 'string' && data.error.toLowerCase().includes('ban')) {
        reason = 'banned';
      }
    } catch { /* ignore */ }
    window.location.href = `/unauthorized?reason=${reason}`;
    throw new Error('Forbidden');
  }

  return res;
}
