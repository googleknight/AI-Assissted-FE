/**
 * COMPONENT 01 — Counter with min/max
 *
 * Practice: write tests in 01-counter.test.jsx
 */

import { useState } from 'react';

export function Counter({ initial = 0, min = 0, max = 10 }) {
  const [count, setCount] = useState(initial);

  function inc() {
    setCount(c => Math.min(c + 1, max));
  }
  function dec() {
    setCount(c => Math.max(c - 1, min));
  }
  function reset() {
    setCount(initial);
  }

  return (
    <div>
      <span data-testid="count" aria-live="polite">{count}</span>
      <button onClick={dec} disabled={count <= min}>-</button>
      <button onClick={inc} disabled={count >= max}>+</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}
