/**
 * PRACTICE 01 — React.memo defeated by inline props
 * Difficulty: Medium
 * Time target: 2 minutes
 *
 * Task: The developer wrapped <Row> in React.memo to skip re-renders.
 * Profiling shows it still re-renders every parent render. Why?
 * Fix it.
 */

import React, { memo, useState } from 'react';

const Row = memo(function Row({ item, onSelect, style }) {
  console.log('Row rendered:', item.id);
  return (
    <li style={style} onClick={() => onSelect(item.id)}>
      {item.name}
    </li>
  );
});

export function ItemList({ items }) {
  const [selectedId, setSelectedId] = useState(null);
  const [query, setQuery] = useState('');

  return (
    <div>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <ul>
        {items.map((item) => (
          <Row
            key={item.id}
            item={item}
            onSelect={(id) => setSelectedId(id)}
            style={{ background: item.id === selectedId ? 'yellow' : 'white' }}
          />
        ))}
      </ul>
    </div>
  );
}

/**
 * QUESTIONS:
 * 1. Three props are unstable. Which?
 * 2. Fix each so memo can actually skip the render.
 * 3. Is memoizing each Row even worth it for a small list?
 *    What changes that answer?
 */
