// Stub for tests. Real impl would call /api/users.
export async function fetchUsers() {
  const r = await fetch('/api/users');
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}
