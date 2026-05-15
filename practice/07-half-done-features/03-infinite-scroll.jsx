/**
 * HALF-DONE 03 — Infinite scroll
 * Difficulty: Hard
 * Time target: 20 minutes
 *
 * Task: Convert the paginated API into an infinite-scroll feed.
 *
 * API: GET /api/feed?cursor=<opaque>&limit=20 → { items, nextCursor }
 *      nextCursor === null means end.
 *
 * Requirements:
 * - Initial load + auto-load on scroll near bottom (use IntersectionObserver).
 * - Loading indicator for next page.
 * - Error state with retry that doesn't lose existing items.
 * - "End of feed" message when nextCursor is null.
 * - No duplicate fetches.
 * - Cleanup observer on unmount.
 *
 * STRETCH: virtualize the list once items > 200.
 */

import { useEffect, useRef, useState } from 'react';

export function Feed() {
  const [items, setItems] = useState([]);
  // TODO: cursor, nextCursor, loading flags, error, isComplete

  const sentinelRef = useRef(null);

  // TODO: useEffect for IntersectionObserver
  // TODO: loadMore() function that dedupes (no overlapping fetches)
  // TODO: handle initial load separately if needed

  return (
    <div>
      <ul>{items.map(i => <li key={i.id}>{i.title}</li>)}</ul>
      <div ref={sentinelRef} aria-hidden="true" />
      {/* TODO: loading / error / end-of-feed UI */}
    </div>
  );
}

/**
 * THINK about:
 * - IntersectionObserver's rootMargin to fetch BEFORE bottom is visible.
 * - What if the user scrolls back up — should already-fetched items stay?
 *   (Yes — append, never replace.)
 * - Cursor pagination is better than offset because new items don't shift pages.
 * - What if a fetch errors mid-feed? Retry button BELOW the items, not replacing them.
 * - Tests are hard for IntersectionObserver — describe how you'd test (mock IO).
 */
