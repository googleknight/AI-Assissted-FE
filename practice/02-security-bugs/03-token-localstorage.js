/**
 * PRACTICE 03 — Auth token storage
 * Difficulty: Medium
 * Time target: 2 minutes
 *
 * Task: Review this auth module. List every security and reliability issue
 * you can find. Propose a hardened version.
 */

const API = 'https://api.example.com';

export async function login(email, password) {
  const r = await fetch(`${API}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await r.json();
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
  return data.user;
}

export function getToken() {
  return localStorage.getItem('token');
}

export function getCurrentUser() {
  return JSON.parse(localStorage.getItem('user'));
}

export async function authedFetch(url, opts = {}) {
  return fetch(url, {
    ...opts,
    headers: {
      ...opts.headers,
      Authorization: `Bearer ${getToken()}`,
    },
  });
}

export function logout() {
  localStorage.removeItem('token');
  window.location = '/';
}

/**
 * Find at least 5 issues. Hints:
 * - Storage choice (XSS exfil)
 * - JSON.parse safety
 * - login: doesn't check r.ok
 * - login: doesn't handle network failure
 * - getCurrentUser may throw
 * - authedFetch sends token to ALL urls (even cross-origin)
 * - logout doesn't invalidate token server-side
 * - logout uses window.location (open-redirect-adjacent; less critical here)
 * - No CSRF protection if backend switches to cookies
 * - No token refresh mechanism
 *
 * Rewrite with: httpOnly cookies, safe JSON, server-revoke on logout,
 * URL allowlist, error handling.
 */
