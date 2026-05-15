/**
 * PRACTICE 03 — localStorage in SSR
 * Difficulty: Medium
 * Time target: 2 minutes
 *
 * Task: This works in dev (CSR) but throws on the production build (SSR).
 * Find the bugs. Fix without introducing a hydration mismatch.
 */

import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') ?? 'light');

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.body.dataset.theme = theme;
  }, [theme]);

  return (
    <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
      Theme: {theme}
    </button>
  );
}

/**
 * QUESTIONS:
 * 1. Where does it crash on the server? Why?
 * 2. Quick fix A: typeof window guard.
 * 3. Better fix B: useEffect to read storage on mount; flicker?
 * 4. Best fix C: read the value SERVER-SIDE from a cookie, pass through layout.
 * 5. What's a hydration mismatch and how can fix B cause one?
 * 6. What if you must show the correct theme on first paint with no flicker?
 *    (Inline blocking <script> in <head> that reads cookie/localStorage and sets data-theme — usually documented as "the theme flash fix.")
 */
