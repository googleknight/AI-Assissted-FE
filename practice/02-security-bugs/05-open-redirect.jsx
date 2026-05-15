/**
 * PRACTICE 05 — Open redirect after login
 * Difficulty: Medium
 * Time target: 90 seconds
 *
 * Task: Find the vulnerability. Construct a phishing attack URL. Fix.
 */

import { useEffect } from 'react';
import { login } from './auth';

export function LoginPage() {
  async function onSubmit(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    await login(form.get('email'), form.get('password'));

    const next = new URLSearchParams(window.location.search).get('next');
    window.location.href = next || '/';
  }

  return (
    <form onSubmit={onSubmit}>
      <input name="email" type="email" />
      <input name="password" type="password" />
      <button>Sign in</button>
    </form>
  );
}

/**
 * QUESTIONS:
 * 1. How do you craft a phishing URL that exploits this?
 *    e.g. https://your-app.com/login?next=https://evil.com/fake-app-login
 * 2. What's the attack flow from victim's POV?
 * 3. Defense 1: allowlist a set of paths.
 * 4. Defense 2: validate same-origin.
 * 5. Defense 3: only allow relative URLs (must start with "/" and not "//").
 *    Watch out for "//evil.com" (protocol-relative).
 */
