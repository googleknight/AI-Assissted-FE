/**
 * PRACTICE 04 — The four UI states
 * Difficulty: Medium
 * Time target: 4 minutes
 *
 * Task: This component handles only the success case. Refactor to handle
 * loading, error, and empty distinctly. Add retry. Add timeout.
 *
 * STRETCH: refactor into a custom hook `useFetch(url)` that returns
 *   { status, data, error, refetch }.
 */

import { useEffect, useState } from 'react';

export function SearchResults({ query }) {
  const [results, setResults] = useState([]);

  useEffect(() => {
    fetch(`/api/search?q=${encodeURIComponent(query)}`)
      .then(r => r.json())
      .then(setResults);
  }, [query]);

  return (
    <ul>
      {results.map(r => <li key={r.id}>{r.title}</li>)}
    </ul>
  );
}

/**
 * QUESTIONS:
 * 1. What does the user see on:
 *    - first paint (data not yet loaded)?
 *    - network failure?
 *    - empty results?
 *    - slow response (8s)?
 * 2. Refactor to handle all four states. UI suggestions:
 *    - loading: skeleton or spinner (with delay-show pattern)
 *    - error: message + retry button
 *    - empty: "No results for X — try Y"
 *    - success: list
 * 3. Add AbortController for race protection.
 * 4. Add 8s timeout.
 * 5. Add 2x retry on 5xx (not on 4xx).
 * 6. Extract into `useFetch(url)` hook reusable across the app.
 */
