/**
 * COMPONENT 03 — Async user list with loading/empty/error/success
 *
 * Practice: write tests in 03-userlist.test.jsx
 *
 * Assume `fetchUsers()` is imported and may be mocked.
 */

import { useEffect, useState } from 'react';
import { fetchUsers } from './api';

export function UserList() {
  const [status, setStatus] = useState('loading');
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);

  async function load() {
    setStatus('loading');
    setError(null);
    try {
      const data = await fetchUsers();
      setUsers(data);
      setStatus('success');
    } catch (e) {
      setError(e);
      setStatus('error');
    }
  }

  useEffect(() => { load(); }, []);

  if (status === 'loading') return <p role="status">Loading users...</p>;
  if (status === 'error') return (
    <div role="alert">
      Failed: {error.message}
      <button onClick={load}>Retry</button>
    </div>
  );
  if (users.length === 0) return <p>No users yet</p>;
  return (
    <ul>
      {users.map((u) => <li key={u.id}>{u.name}</li>)}
    </ul>
  );
}
