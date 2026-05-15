/**
 * PRACTICE 03 — Large list rendering
 * Difficulty: Medium
 * Time target: 3 minutes
 *
 * Task: A table with 10,000 rows freezes the browser on mount. Profile shows
 * paint takes 4 seconds. Each row uses an avatar and 5 columns. Fix it.
 *
 * Don't change the row content — keep the user-visible info the same.
 */

import { useState } from 'react';

export function UserTable({ users }) {
  const [search, setSearch] = useState('');
  const filtered = users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users" />
      <table>
        <thead>
          <tr>
            <th>Avatar</th><th>Name</th><th>Email</th><th>Role</th><th>Last seen</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(u => (
            <tr key={u.id}>
              <td><img src={u.avatarUrl} alt="" /></td>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td>{new Date(u.lastSeen).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * QUESTIONS:
 * 1. Why does this freeze? (DOM size, paint, layout)
 * 2. Two bonus bugs that hurt perf on top of virtualization need:
 *    - new Date().toLocaleString() in every row
 *    - <img> without width/height (CLS + reflow)
 * 3. Implement with react-window's FixedSizeList (or TanStack Virtual).
 *    Why does virtualization complicate tables vs lists?
 * 4. What if rows have variable heights?
 */
