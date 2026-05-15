/**
 * PRACTICE 02 — XSS via href protocol
 * Difficulty: Medium
 * Time target: 90 seconds
 *
 * Task: Find the vulnerability. Construct a malicious value. Fix.
 */

export function UserCard({ user }) {
  return (
    <div className="card">
      <img src={user.avatarUrl} alt={user.name} width={64} height={64} />
      <h3>{user.name}</h3>
      <a href={user.website} target="_blank">Visit website</a>
      <a href={user.email && `mailto:${user.email}`}>Email</a>
    </div>
  );
}

/**
 * QUESTIONS:
 * 1. What can `user.website = "javascript:..."` do when clicked?
 * 2. What about `user.avatarUrl = "javascript:..."` — does <img src> execute?
 *    (Answer: not from `javascript:`, but other risks — data: URLs, SSRF, tracking.)
 * 3. Implement a `safeUrl()` helper that allowlists protocols.
 * 4. Bonus: `target="_blank"` without `rel="noopener noreferrer"` — what's the risk?
 *    (Tabnabbing — the new tab can navigate the opener via window.opener.)
 */
