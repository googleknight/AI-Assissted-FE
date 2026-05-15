/**
 * PRACTICE 08 — Rules of Hooks
 * Difficulty: Easy (if you've seen this), trap otherwise
 * Time target: 60 seconds
 *
 * Task: Find every hooks-rules violation. There are THREE.
 * For each, predict the runtime symptom.
 */

import { useEffect, useState } from 'react';

export function UserCard({ userId }) {
  if (!userId) {
    return <div>Sign in to see your profile</div>;
  }

  const [user, setUser] = useState(null);

  for (const role of ['admin', 'editor', 'viewer']) {
    useEffect(() => {
      console.log(`checking role: ${role}`);
    }, [role]);
  }

  const handleClick = () => {
    const [hovered, setHovered] = useState(false);
    setHovered(true);
  };

  useEffect(() => {
    fetch(`/api/users/${userId}`).then((r) => r.json()).then(setUser);
  }, [userId]);

  return (
    <div onClick={handleClick}>
      {user ? user.name : 'Loading...'}
    </div>
  );
}

/**
 * QUESTIONS:
 * 1. Three violations. Where are they?
 * 2. What symptom does each cause?
 * 3. Rewrite to fix every one without changing the public behavior.
 */
