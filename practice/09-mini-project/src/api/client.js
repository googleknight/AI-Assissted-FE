const API = 'https://api.teamsync.example.com';

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

export async function authedFetch(url, opts = {}) {
  return fetch(url, {
    ...opts,
    headers: {
      ...opts.headers,
      Authorization: `Bearer ${getToken()}`,
    },
  });
}

export async function createMember(member) {
  const r = await authedFetch(`${API}/team`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(member),
  });
  return r.json();
}

export async function updateMemberNotes(memberId, notesHtml) {
  const r = await authedFetch(`${API}/team/${memberId}/notes`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes: notesHtml }),
  });
  return r.json();
}

export function logout() {
  localStorage.removeItem('token');
  window.location = '/';
}
