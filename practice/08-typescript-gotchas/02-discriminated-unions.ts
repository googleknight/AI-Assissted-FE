/**
 * PRACTICE 02 — Discriminated unions
 * Difficulty: Medium
 * Time target: 3 minutes
 *
 * Task: This state shape allows impossible combinations. Refactor to a
 * discriminated union that makes them unrepresentable.
 */

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

// e.g. for users:
const users: FetchState<{ id: string; name: string }[]> = {
  data: null,
  loading: false,
  error: null,
};

// What does `{ data: [...], loading: true, error: new Error() }` mean? Nothing valid.

/**
 * QUESTIONS:
 * 1. Define a discriminated union `FetchState<T>` with cases:
 *    - idle (no data, no error)
 *    - loading (no data, no error)
 *    - success (data, no error)
 *    - error (error, no data)
 *    (Note: some patterns keep stale `data` on error for retry UX — design choice.)
 * 2. Write a switch over it that exhausts every case (use `assertNever`).
 * 3. Why are exhaustive checks valuable here?
 * 4. Rewrite the calling code so TypeScript guarantees data is non-null inside success.
 */

export type FetchStateV2<T> = unknown; // TODO replace
