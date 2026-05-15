/**
 * PRACTICE 10 — Conditional render destroys child state
 * Difficulty: Medium-Hard
 * Time target: 3 minutes
 *
 * Task: This modal has a form. The user fills it in, closes the modal,
 * reopens it — the form is empty. The product wants the draft to persist
 * across close/open within the same session. Find the bug. Propose THREE fixes.
 *
 * Bonus: which fix preserves draft across browser refresh? (Hint: localStorage)
 */

import { useState } from 'react';

export function FeedbackPage() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setOpen(true)}>Send feedback</button>
      {open && <FeedbackModal onClose={() => setOpen(false)} />}
    </div>
  );
}

function FeedbackModal({ onClose }) {
  const [text, setText] = useState('');
  const [category, setCategory] = useState('bug');

  return (
    <div role="dialog">
      <button onClick={onClose}>Close</button>
      <select value={category} onChange={(e) => setCategory(e.target.value)}>
        <option value="bug">Bug</option>
        <option value="feature">Feature</option>
      </select>
      <textarea value={text} onChange={(e) => setText(e.target.value)} />
      <button onClick={() => alert('submitted')}>Submit</button>
    </div>
  );
}

/**
 * QUESTIONS:
 * 1. Why does the form reset between opens?
 * 2. Fix A: lift state to FeedbackPage (state survives modal unmount).
 * 3. Fix B: always render the modal with a visibility prop (don't unmount).
 * 4. Fix C: persist to localStorage on change; rehydrate on mount.
 * 5. Trade-offs of each? Which would you pick for an interview?
 */
