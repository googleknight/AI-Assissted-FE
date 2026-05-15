/**
 * PRACTICE 01 — Stale closure in interval
 * Difficulty: Easy
 * Time target: 90 seconds
 *
 * Task: Find the bug. Provide the fix. Mention TWO valid fixes.
 *
 * Hint level 1 (only if stuck): the bug is in how `count` is read.
 * Hint level 2: think about closures + empty deps.
 */

import { useEffect, useState } from 'react';

export function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setCount(count + 1);
      console.log('tick — count is', count);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return <div>Count: {count}</div>;
}

/**
 * QUESTIONS to answer:
 * 1. After 5 ticks, what does the UI show?
 * 2. Why?
 * 3. Two distinct fixes — pros/cons of each?
 */
