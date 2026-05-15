/**
 * HALF-DONE 01 — Pagination
 * Difficulty: Medium
 * Time target: 12 minutes
 *
 * Task: This component renders a list. Add server-side pagination:
 * - Page size 20.
 * - "Previous" and "Next" buttons.
 * - "Page N of M" indicator.
 * - Disable buttons at edges.
 * - Reset to page 1 when filter changes.
 * - Loading state per page transition.
 * - Error state with retry.
 *
 * The API supports `?page=N&pageSize=20&filter=...`
 * and returns `{ items, total }`.
 *
 * Requirements:
 * - No race conditions on rapid page-clicks.
 * - URL should reflect page + filter (so refresh restores state).
 *   Use useSearchParams from react-router or window.history if no router.
 * - At least one new test that covers the page-transition behavior.
 *
 * STRETCH: keyboard nav (left/right arrow keys), prefetch next page on hover.
 */

import { useEffect, useState } from 'react';

export function PaginatedList({ filter = '' }) {
  const [items, setItems] = useState([]);
  // const [page, setPage] = useState(1);  // TODO
  // const [total, setTotal] = useState(0); // TODO

  useEffect(() => {
    fetch(`/api/items?filter=${encodeURIComponent(filter)}`)
      .then(r => r.json())
      .then(d => setItems(d.items));
  }, [filter]);

  return (
    <div>
      <ul>{items.map(i => <li key={i.id}>{i.name}</li>)}</ul>
      {/* TODO: page indicator + buttons */}
    </div>
  );
}

/**
 * THINK about:
 * - Where does page state live? Local? URL? Both?
 * - What does "loading" mean: page 1 first load vs page change?
 * - Race condition: user clicks Next twice fast — old page response may arrive after new.
 * - Empty results vs "no more pages."
 * - Should filter-change resetting to page 1 be visible (briefly) or seamless?
 * - Total = 0: hide pagination controls?
 */
