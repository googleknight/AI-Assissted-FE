/**
 * PRACTICE 01 — `any` and unsafe assertions
 * Difficulty: Easy-Medium
 * Time target: 2 minutes
 *
 * Task: Identify every type-safety hole. Rewrite without lying.
 */

interface User {
  id: string;
  name: string;
  email: string;
}

export function getUserFromCache(cache: any): User {
  return cache.users[0];
}

export async function fetchUser(id: string): Promise<User> {
  const r = await fetch(`/api/users/${id}`);
  return (await r.json()) as User;
}

export function getRole(user: User | null): string {
  return user!.name; // hmm, "role" returning "name"? But TS doesn't care about that semantic.
}

export function safeProp<T>(obj: T, key: string): unknown {
  return (obj as any)[key];
}

/**
 * QUESTIONS:
 * 1. Each function lies about its types. How?
 * 2. `any` vs `unknown` — when to use which?
 * 3. How would you safely parse the fetch response? (Zod / valibot / hand-rolled guard)
 * 4. `user!.name` — when is non-null assertion OK and when is it lying?
 * 5. Rewrite each safely.
 */
