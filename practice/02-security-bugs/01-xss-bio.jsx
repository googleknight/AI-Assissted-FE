/**
 * PRACTICE 01 — Stored XSS via user content
 * Difficulty: Easy
 * Time target: 30 seconds
 *
 * Task: Find the vulnerability. Name the attack class. Provide TWO fixes.
 * Rank the fixes by safety.
 */

import { useEffect, useState } from 'react';

export function ProfileView({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch(`/api/users/${userId}`).then(r => r.json()).then(setUser);
  }, [userId]);

  if (!user) return null;

  return (
    <article>
      <h2>{user.name}</h2>
      <div
        className="bio"
        dangerouslySetInnerHTML={{ __html: user.bio }}
      />
      <p>Joined: {user.joinedAt}</p>
    </article>
  );
}

/**
 * QUESTIONS:
 * 1. What's the attack class? (XSS — which subtype?)
 * 2. What can a malicious bio do?
 * 3. Fix A: render as text (safest if HTML isn't needed).
 * 4. Fix B: sanitize with DOMPurify (if HTML is required).
 * 5. Why is "strip <script> tags on input" NOT a real fix?
 */
