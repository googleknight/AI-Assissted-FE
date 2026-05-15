/**
 * COMPONENT 04 — Debounced search
 *
 * Practice: write tests in 04-debounced-search.test.jsx
 *
 * Tests will need fake timers + assertions about how many times `onSearch` fires.
 */

import { useEffect, useRef, useState } from 'react';

export function DebouncedSearch({ onSearch, delay = 300, placeholder = 'Search' }) {
  const [value, setValue] = useState('');
  const timer = useRef(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (value === '') {
      onSearch('');
      return;
    }
    timer.current = setTimeout(() => onSearch(value), delay);
    return () => clearTimeout(timer.current);
  }, [value, onSearch, delay]);

  return (
    <input
      type="search"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder={placeholder}
      aria-label="Search"
    />
  );
}
