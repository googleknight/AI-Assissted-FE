/**
 * PRACTICE 02 — Expensive computation on every keystroke
 * Difficulty: Medium
 * Time target: 2 minutes
 *
 * Task: Typing in the search box is laggy when items has 5000 entries.
 * Find every contributing cause. Fix without changing the UI.
 */

import { useState } from 'react';

function expensiveScore(item, query) {
  // pretend this is fuzzy matching that takes ~0.1ms per item
  let score = 0;
  for (let i = 0; i < query.length; i++) {
    score += item.name.charCodeAt(i % item.name.length) ^ query.charCodeAt(i);
  }
  return score;
}

export function HugeList({ items }) {
  const [query, setQuery] = useState('');

  const ranked = items
    .map((item) => ({ ...item, score: expensiveScore(item, query) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 100);

  return (
    <div>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <ul>
        {ranked.map((item) => (
          <li key={item.id}>{item.name} ({item.score})</li>
        ))}
      </ul>
    </div>
  );
}

/**
 * QUESTIONS:
 * 1. Why is typing slow?
 * 2. Fix A: useMemo with [items, query] deps.
 * 3. Fix B: useDeferredValue on query — what does this do differently?
 * 4. Fix C: useTransition for the filter update.
 * 5. Fix D: web worker for the scoring (overkill for 5k items but how would you?).
 * 6. The list still renders 100 items each keystroke — would virtualization help here? Why or why not?
 */
