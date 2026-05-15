/**
 * PRACTICE 04 — Missing cleanup
 * Difficulty: Easy
 * Time target: 90 seconds
 *
 * Task: Three subtle issues. Find all three. Fix them.
 *
 * Hint level 1: count what gets created and what gets destroyed.
 * Hint level 2: think about what happens when this component unmounts.
 * Hint level 3: think about what happens when StrictMode double-invokes the effect.
 */

import { useEffect, useState } from 'react';

export function WindowSize() {
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    function onResize() {
      setSize({ w: window.innerWidth, h: window.innerHeight });
    }
    window.addEventListener('resize', onResize);

    const id = setInterval(() => {
      console.log('still mounted');
    }, 5000);

    document.title = `Window: ${size.w} x ${size.h}`;
  }, []);

  return <div>{size.w} x {size.h}</div>;
}

/**
 * QUESTIONS:
 * 1. What three issues exist?
 * 2. What goes wrong on unmount?
 * 3. What goes wrong under StrictMode double-invocation in dev?
 * 4. Rewrite with proper cleanup.
 */
