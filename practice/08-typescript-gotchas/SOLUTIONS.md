# SOLUTIONS — 08-typescript-gotchas

## 01 — any and assertions

```ts
// Use unknown + narrow with Zod for unknown structure
import { z } from 'zod';
const UserSchema = z.object({ id: z.string(), name: z.string(), email: z.string().email() });

export async function fetchUser(id: string): Promise<User> {
  const r = await fetch(`/api/users/${id}`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return UserSchema.parse(await r.json()); // validates at runtime
}

export function getUserFromCache(cache: { users: User[] }): User {
  const u = cache.users[0];
  if (!u) throw new Error('Empty cache');
  return u;
}

export function getRole(user: User | null): string {
  if (!user) return 'guest';
  return user.role ?? 'member'; // add `role` to User type; don't pull name and call it role
}

export function safeProp<T extends object, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
```

**`any` vs `unknown`:**
- `any` opts out of the type system entirely. Avoid.
- `unknown` says "I don't know yet" — TS forces narrowing before use. Safe.

**`!` (non-null assertion):**
- OK when you've already proven it's non-null but TS can't track (e.g., after a check that TS doesn't infer).
- Lying when you "know" because of business logic that could change. Prefer explicit narrowing.

---

## 02 — Discriminated unions

```ts
export type FetchState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };

function assertNever(x: never): never {
  throw new Error(`Unexpected case: ${JSON.stringify(x)}`);
}

function render<T>(state: FetchState<T>): string {
  switch (state.status) {
    case 'idle':    return 'Idle';
    case 'loading': return 'Loading...';
    case 'success': return `Got ${JSON.stringify(state.data)}`;
    case 'error':   return `Error: ${state.error.message}`;
    default:        return assertNever(state); // compile error if a case is added
  }
}
```

**Value:** `state.data` is only accessible inside the `success` branch. The earlier shape allowed `loading: true, data: [...]` — meaningless. Exhaustive `switch` + `assertNever` makes new cases force you to update all handlers.

---

## 03 — React component types

```tsx
import { ChangeEvent, ElementType, FormEvent, PropsWithChildren, ReactNode, ComponentPropsWithoutRef } from 'react';

// A
export function Card({ children }: PropsWithChildren) {
  return <div className="card">{children}</div>;
}

// B
export function Section({ children }: { children: ReactNode }) {
  return <section>{children}</section>;
}

// C
export function Form() {
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
  }
  return <form onSubmit={handleSubmit} />;
}

// D
export function List<T>({ items, renderItem }: {
  items: readonly T[];
  renderItem: (item: T, index: number) => ReactNode;
}) {
  return <ul>{items.map(renderItem)}</ul>;
}

// E — Polymorphic component done right
type BoxProps<T extends ElementType> = {
  as?: T;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'children'>;

export function Box<T extends ElementType = 'div'>({ as, children, ...rest }: BoxProps<T>) {
  const Tag = as ?? 'div';
  return <Tag {...rest}>{children}</Tag>;
}

// Usage:
// <Box as="a" href="/x">link</Box>  ✅
// <Box as="div" href="/x">x</Box>   ❌ TS error
```

**Note on `JSX.IntrinsicElements`:** for very precise polymorphic typing you may also need `forwardRef` overload. Most apps don't need full perfection here — `ComponentPropsWithoutRef<T>` is 90% of the value.

---

## 04 — Narrowing and guards

```ts
// A — type predicate
export function isString(x: unknown): x is string {
  return typeof x === 'string';
}

// B — narrow element type explicitly
export function isNumberArray(v: unknown): v is number[] {
  return Array.isArray(v) && v.every(e => typeof e === 'number');
}
export function getItems(value: unknown): number[] {
  return isNumberArray(value) ? value : [];
}

// C — narrow the union
export function handle(res: ApiResponse): string {
  if (res.kind === 'ok') return res.data.name;
  return res.message;
}

// D — explicit null check, not truthy
export function format(value: number | null): string {
  if (value == null) return 'N/A'; // == catches both null and undefined
  return value.toFixed(2);
}

// E — validate
import { z } from 'zod';
const UserResponse = z.object({ user: z.object({ name: z.string() }) });
export function loadUser(raw: string) {
  return UserResponse.parse(JSON.parse(raw)).user.name;
}
```

**Truthy-on-numbers trap (D):** `if (!value)` treats `0` as missing. Bugs like "user can't enter quantity 0" trace here. Always be explicit at the type boundary: `value == null` or `Number.isFinite(value) === false`.

---

Next: `09-mini-project/`.
