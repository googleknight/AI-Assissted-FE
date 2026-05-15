/**
 * COMPONENT 02 — Login form with validation
 *
 * Practice: write tests in 02-loginform.test.jsx
 */

import { useState } from 'react';

export function LoginForm({ onSubmit }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [touched, setTouched] = useState({});

  const emailError = touched.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)
    ? 'Enter a valid email'
    : null;
  const passwordError = touched.password && password.length < 8
    ? 'At least 8 characters'
    : null;
  const formValid = !emailError && !passwordError && email && password;

  async function handleSubmit(e) {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (!formValid) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({ email, password });
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Sign in">
      <label>
        Email
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, email: true }))}
          aria-invalid={!!emailError}
        />
      </label>
      {emailError && <p role="alert">{emailError}</p>}

      <label>
        Password
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, password: true }))}
          aria-invalid={!!passwordError}
        />
      </label>
      {passwordError && <p role="alert">{passwordError}</p>}

      {error && <p role="alert">{error}</p>}

      <button type="submit" disabled={submitting}>
        {submitting ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  );
}
