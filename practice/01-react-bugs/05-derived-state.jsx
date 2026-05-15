/**
 * PRACTICE 05 — Derived state stored twice
 * Difficulty: Medium
 * Time target: 2 minutes
 *
 * Task: This component is buggy in subtle ways. The "filtered" list flashes
 * the old value briefly when the filter changes. Find the bug. Rewrite to
 * remove the bug AND the unnecessary state.
 *
 * Stretch: there are at least 4 different things that could be improved.
 */

import { useEffect, useState } from 'react';

export function ProductList({ products }) {
  const [filter, setFilter] = useState('');
  const [filtered, setFiltered] = useState([]);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const next = products.filter((p) =>
      p.name.toLowerCase().includes(filter.toLowerCase())
    );
    setFiltered(next);
    setCount(next.length);
  }, [products, filter]);

  return (
    <div>
      <input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Search"
      />
      <p>{count} results</p>
      <ul>
        {filtered.map((p) => (
          <li key={p.id}>{p.name}</li>
        ))}
      </ul>
    </div>
  );
}

/**
 * QUESTIONS:
 * 1. Why does the filtered list "lag" by one render?
 * 2. Why is `count` redundant?
 * 3. Why is the useEffect itself unnecessary?
 * 4. Rewrite. Aim for half the code or less.
 */
