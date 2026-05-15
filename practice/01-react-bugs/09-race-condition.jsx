/**
 * PRACTICE 09 — Race condition on identifier change
 * Difficulty: Medium
 * Time target: 3 minutes
 *
 * Task: QA reports that after rapidly clicking between users in a sidebar,
 * the detail view sometimes shows the previous user's posts. Reproduce
 * (mentally) and fix.
 *
 * Stretch: write THREE distinct fixes. Compare them.
 */

import { useEffect, useState } from 'react';

export function UserDetail({ userId }) {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setUser(null);
    setPosts(null);

    fetch(`/api/users/${userId}`)
      .then((r) => r.json())
      .then(setUser)
      .catch(setError);

    fetch(`/api/users/${userId}/posts`)
      .then((r) => r.json())
      .then(setPosts)
      .catch(setError);
  }, [userId]);

  if (error) return <div>Error: {error.message}</div>;
  if (!user || !posts) return <div>Loading...</div>;
  return (
    <div>
      <h2>{user.name}</h2>
      <ul>{posts.map((p) => <li key={p.id}>{p.title}</li>)}</ul>
    </div>
  );
}

/**
 * QUESTIONS:
 * 1. Construct a step-by-step scenario where user A's posts are shown
 *    with user B's name.
 * 2. Fix #1: AbortController.
 * 3. Fix #2: "ignore stale" flag.
 * 4. Fix #3: useEffect with a ref tracking the latest request id.
 * 5. There are other bugs too — find at least one more (hint: setError loses the error type).
 */
