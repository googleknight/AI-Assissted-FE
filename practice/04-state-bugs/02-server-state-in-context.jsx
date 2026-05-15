/**
 * PRACTICE 02 — Server state in Context
 * Difficulty: Medium-Hard
 * Time target: 3 minutes
 *
 * Task: This is a typical brownfield pattern: a "store" that loads server
 * data into context. List every problem with this pattern. Propose a
 * minimal fix that doesn't introduce a new dependency, AND a better fix
 * that does.
 */

import { createContext, useContext, useEffect, useState } from 'react';

const UsersContext = createContext(null);

export function UsersProvider({ children }) {
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    fetch('/api/users').then(r => r.json()).then(setUsers);
    fetch('/api/posts').then(r => r.json()).then(setPosts);
  }, []);

  function refetchUsers() {
    fetch('/api/users').then(r => r.json()).then(setUsers);
  }

  function addUser(user) {
    fetch('/api/users', { method: 'POST', body: JSON.stringify(user) })
      .then(r => r.json())
      .then(newUser => setUsers([...users, newUser]));
  }

  return (
    <UsersContext.Provider value={{ users, posts, refetchUsers, addUser }}>
      {children}
    </UsersContext.Provider>
  );
}

export function useUsers() {
  return useContext(UsersContext);
}

/**
 * QUESTIONS — list all problems:
 * 1. No loading state — consumers can't tell loaded vs empty.
 * 2. No error state — failures are silent.
 * 3. No retry.
 * 4. No request dedup if multiple components mount.
 * 5. Mount-once fetch — never refetches on focus/visibility.
 * 6. No staleness — stale data persists forever.
 * 7. `addUser` uses `users` from closure — race risk with concurrent updates.
 * 8. Value not memoized — every Provider render = consumer re-renders.
 * 9. Mixing two unrelated data sets (users, posts) — fixing one's loading affects the other.
 * 10. No optimistic UI for addUser.
 *
 * Minimal fix:
 * - Add status object per resource: { status, data, error }
 * - useMemo provider value
 * - Functional setState in addUser
 * - Split provider per resource or use useReducer
 *
 * Better fix:
 * - Adopt React Query (or SWR). Each query gets loading/error/refetch/cache/dedup
 *   for free. Mutations get optimistic updates and invalidation.
 */
