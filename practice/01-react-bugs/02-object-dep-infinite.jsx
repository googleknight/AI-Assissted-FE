/**
 * PRACTICE 02 — Object dependency causes infinite loop
 * Difficulty: Medium
 * Time target: 2 minutes
 *
 * Task: This component appears to load forever and the network tab shows
 * the same request firing constantly. Find the bug. Fix it.
 *
 * Bonus: propose TWO fixes (one in this file, one in the parent).
 */

import { useEffect, useState } from 'react';

export function UserPosts({ userId, status }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);

  // built here so we can pass extra options to the fetch
  const queryOptions = {
    userId,
    status,
    includeArchived: false,
  };

  useEffect(() => {
    setLoading(true);
    fetch('/api/posts?' + new URLSearchParams(queryOptions))
      .then((r) => r.json())
      .then((data) => {
        setPosts(data);
        setLoading(false);
      });
  }, [queryOptions]);

  if (loading) return <div>Loading...</div>;
  return <ul>{posts.map((p) => <li key={p.id}>{p.title}</li>)}</ul>;
}

/**
 * QUESTIONS:
 * 1. Why is this re-fetching constantly?
 * 2. What is React comparing in the dep array?
 * 3. Fix A: change this file only.
 * 4. Fix B: change a parent that passes a memoized object.
 */
