/**
 * PRACTICE 04 — Narrowing and type guards
 * Difficulty: Medium-Hard
 * Time target: 4 minutes
 *
 * Task: Fix the narrowing in each function. Some need user-defined guards.
 */

type ApiResponse =
  | { kind: 'ok'; data: { id: string; name: string } }
  | { kind: 'error'; message: string };

// A. Misuses typeof
export function isString(x: unknown): boolean {
  return typeof x === 'string';
}
// Caller: if (isString(x)) { x.toUpperCase() } — but inside, x is still `unknown`.

// B. instanceof check that doesn't narrow array
export function getItems(value: unknown): number[] {
  if (Array.isArray(value)) {
    return value;  // value is any[]
  }
  return [];
}

// C. Forgot to narrow union
export function handle(res: ApiResponse): string {
  return res.data.name; // ❌ type error
}

// D. Truthy check on object that could be 0
export function format(value: number | null): string {
  if (!value) return 'N/A';
  return value.toFixed(2);
}

// E. JSON parse to unknown
export function loadUser(raw: string) {
  const obj = JSON.parse(raw);
  return obj.user.name; // assumes shape
}

/**
 * QUESTIONS:
 * 1. A: write `isString` as a type predicate so callers narrow correctly.
 * 2. B: how do you safely assert it's `number[]`?
 *    (Array.isArray narrows to `any[]` — you still need element checks.)
 * 3. C: narrow with `res.kind === 'ok'` first.
 * 4. D: 0 is falsy! Use `value == null` instead.
 * 5. E: validate at the boundary with Zod or a hand-rolled guard.
 */
