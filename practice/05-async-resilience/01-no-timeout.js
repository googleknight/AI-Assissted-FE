/**
 * PRACTICE 01 — fetch without timeout
 * Difficulty: Easy
 * Time target: 2 minutes
 *
 * Task: Implement `fetchWithTimeout(url, opts, ms)` that aborts after `ms`.
 * Then implement `safeFetch(url, opts)` that combines timeout + retry + ok check.
 */

export async function fetchWithTimeout(url, opts = {}, ms = 8000) {
  // TODO: implement
}

export async function safeFetch(url, opts = {}, { timeoutMs = 8000, retries = 2 } = {}) {
  // TODO: implement
  //   - call fetchWithTimeout
  //   - throw on !r.ok
  //   - retry on network error / 5xx / 429 with exponential backoff + jitter
  //   - do NOT retry on 4xx
}

/**
 * REQUIREMENTS:
 * 1. Timeout uses AbortController.
 * 2. Cleanup the setTimeout id even on success.
 * 3. Distinguishes AbortError from real errors.
 * 4. Backoff = baseMs * 2^attempt + random jitter.
 * 5. Retry only on idempotent verb (assume GET unless opts.method otherwise).
 * 6. Final failure throws with helpful message.
 *
 * STRETCH: write a unit test that fakes a slow server and asserts timeout fires.
 *          (Use vi.useFakeTimers if you have vitest, or MSW with delay.)
 */
