/**
 * PRACTICE 06 — Batched setState reading stale value
 * Difficulty: Easy
 * Time target: 90 seconds
 *
 * Task: The user expects clicking the "+3" button to add 3. It only adds 1.
 * Find the bug. Fix it.
 *
 * Then: explain to a junior why this happens.
 */

import { useState } from 'react';

export function Tally() {
  const [count, setCount] = useState(0);

  function addThree() {
    setCount(count + 1);
    setCount(count + 1);
    setCount(count + 1);
  }

  function addThreeDelayed() {
    setTimeout(() => {
      setCount(count + 1);
      setCount(count + 1);
      setCount(count + 1);
    }, 0);
  }

  return (
    <div>
      <p>{count}</p>
      <button onClick={addThree}>+3</button>
      <button onClick={addThreeDelayed}>+3 (delayed)</button>
    </div>
  );
}

/**
 * QUESTIONS:
 * 1. What does each button add?
 * 2. In React 18+, are state updates batched inside setTimeout? (yes — automatic batching)
 * 3. Why does it still add only 1 even with batching?
 * 4. Fix.
 */
