/**
 * PRACTICE 05 — Optimistic update
 * Difficulty: Hard
 * Time target: 5 minutes
 *
 * Task: Implement a "like" button that updates UI immediately and rolls back
 * on failure. Handle: double-click, server error, network offline,
 * concurrent updates from other places.
 */

import { useState } from 'react';

export function LikeButton({ post, onChange }) {
  // post = { id, liked, likes }

  async function handleClick() {
    // TODO: implement optimistic update
    //   1. compute optimistic next state (toggle liked, ±1 likes)
    //   2. update UI immediately
    //   3. send PATCH /api/posts/:id/like
    //   4. on success: confirm
    //   5. on failure: rollback
    //   6. on double-click during in-flight: prevent stacking
  }

  return (
    <button onClick={handleClick} aria-pressed={post.liked}>
      {post.liked ? '❤️' : '🤍'} {post.likes}
    </button>
  );
}

/**
 * QUESTIONS:
 * 1. Sketch the full implementation. What state do you need locally?
 *    (in-flight flag, pre-optimistic snapshot for rollback)
 * 2. What if the user clicks 3 times fast — does your impl debounce or
 *    queue?
 * 3. What if a websocket pushes a different `likes` count while your
 *    optimistic update is in flight?
 *    (Server is the truth — reconcile to server response.)
 * 4. Mutation idempotency: PATCH /like is naturally idempotent if it's
 *    "set to X" not "toggle". Refactor to a deterministic API.
 * 5. How does React Query's useMutation help here?
 *    (onMutate / onError / onSettled for rollback + invalidate.)
 */
