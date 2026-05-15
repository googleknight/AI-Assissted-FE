# 03 — State Management: Context, Lifting, Derived State, Stores

> The interview doc explicitly mentions a "Global State / Context API" that loads user + app data and exposes methods. So expect a Context-based store. Below: how to recognize good vs bad context patterns, when to escalate to a real store, and the bugs unique to each.

---

## The state ladder (when to use what)

Climb only as high as you need:

1. **Local `useState`** — component-private state (input value, accordion open/close).
2. **Lift state up** — shared by 2-3 sibling components.
3. **Context** — read by many components across the tree; rarely changes.
4. **Reducer (context + useReducer)** — complex transitions, validation, undo.
5. **External store (Zustand, Redux, Jotai, Recoil)** — frequently changing state read by many places; performance matters.
6. **Server state (React Query, SWR, RTK Query)** — anything that lives on a server. **Different from client state — treat differently.**

**Senior signal:** Knowing #6 is a different beast. Most brownfield code conflates client state and server state, which is a huge source of bugs.

---

## Server state vs client state — the most important distinction

| | Client state | Server state |
|---|---|---|
| Source of truth | Lives in browser | Lives on server |
| Examples | Modal open, form draft, theme | User list, posts, settings |
| Lifetime | Tied to session | Persistent across users/sessions |
| Concerns | Sync UI to data | Cache invalidation, staleness, retries, race conditions |
| Tool | useState / context / Zustand | React Query / SWR / RTK Query |

**Brownfield bug pattern:** server data stuffed into `useState`/Context with no caching, no refetch, no staleness, no error handling. Every component fetches independently. Refetches happen on every mount. No retry on failure.

**Senior fix:** introduce React Query (or accept the existing Context store but fix the missing pieces — error states, cache, dedupe).

---

## Context API: anatomy and the common bugs

### Minimal correct usage

```jsx
const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('light');

  const value = useMemo(
    () => ({ user, setUser, theme, setTheme }),
    [user, theme]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (ctx === null) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
```

Note the three patterns:
1. **`useMemo` on value** — otherwise every consumer re-renders every render.
2. **Custom hook (`useApp`)** — encapsulates context, throws if used outside.
3. **Explicit null check** — catches forgotten providers immediately.

### Bug: unmemoized value

```jsx
return <AppContext.Provider value={{ user, theme }}>{children}</AppContext.Provider>;
```

Every render of `AppProvider` creates a new `{ user, theme }` object → every consumer re-renders even if `user` and `theme` haven't changed. In a brownfield codebase, **this is one of the most common perf bugs to flag**.

### Bug: monolithic context

One mega context with everything: user, posts, theme, settings, modals, notifications.

Problem: any update to anything re-renders every consumer. Example — opening a modal causes the data grid to re-render.

**Fix patterns:**
- Split into multiple contexts (`UserContext`, `ThemeContext`, `NotificationsContext`).
- Or split state and dispatch (`StateContext` + `DispatchContext`) — components that only dispatch don't re-render on state change.
- Or use a real store with selector subscriptions (Zustand, Redux with `useSelector`).

### Pattern: state + dispatch split

```jsx
const StateCtx = createContext();
const DispatchCtx = createContext();

function reducer(state, action) { /* ... */ }

function Provider({ children }) {
  const [state, dispatch] = useReducer(reducer, initial);
  return (
    <StateCtx.Provider value={state}>
      <DispatchCtx.Provider value={dispatch}>
        {children}
      </DispatchCtx.Provider>
    </StateCtx.Provider>
  );
}

// Consumers that only dispatch (like a button) don't re-render on state change.
```

This is "good enough" for many apps that would otherwise reach for Redux.

### Bug: provider re-creates expensive resources

```jsx
function Provider({ children }) {
  const api = new ApiClient(); // ❌ new client every render
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}
```

**Fix:** `useMemo(() => new ApiClient(), [])` or define it as a module-level singleton.

---

## Lifting state — when and how

Lift only as high as the lowest common ancestor of the components that need to share it.

Lifting too high → prop drilling and unnecessary re-renders.
Lifting too low → broken sharing.

```
        <App>
        /    \
   <Sidebar>  <Main>
                |
              <Detail>  <-- needs `selectedId`
              <Edit>    <-- needs `selectedId`
```

`selectedId` should live in `<Main>`, not `<App>`. Don't push state up further than necessary.

---

## Derived state — don't store what you can compute

### Bug: stored derivation

```jsx
function List({ items }) {
  const [filtered, setFiltered] = useState([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    setFiltered(items.filter(i => i.name.includes(filter)));
  }, [items, filter]);

  return <ItemList items={filtered} />;
}
```

Three problems:
1. **Two renders per update** — filter changes, render, effect runs, setState, second render.
2. **Off-by-one staleness** — first render after filter change shows old `filtered`.
3. **Extra state to keep in sync.**

### Fix: compute during render

```jsx
function List({ items }) {
  const [filter, setFilter] = useState('');
  const filtered = items.filter(i => i.name.includes(filter)); // or useMemo if expensive
  return <ItemList items={filtered} />;
}
```

### When to memoize the derivation

`useMemo` only when:
- The computation is expensive (>1ms on a typical render).
- OR the derived value is passed to a memoized child as a prop.

For trivial filters/maps, just compute inline.

---

## Reducer pattern (useReducer)

When state transitions get complex, a reducer wins over multiple `useState` calls.

```jsx
const initial = { items: [], loading: false, error: null };

function reducer(state, action) {
  switch (action.type) {
    case 'LOAD_START':   return { ...state, loading: true, error: null };
    case 'LOAD_SUCCESS': return { ...state, loading: false, items: action.payload };
    case 'LOAD_ERROR':   return { ...state, loading: false, error: action.error };
    case 'ITEM_ADD':     return { ...state, items: [...state.items, action.item] };
    default: return state;
  }
}

const [state, dispatch] = useReducer(reducer, initial);
```

Benefits:
- All state transitions in one place — easy to audit.
- Dispatch is stable (doesn't change identity) — safer dep for effects.
- Easy to test in isolation (`reducer(state, action)`).

Drawback: more boilerplate. Use it when complexity earns it.

---

## External stores — when to escalate

Use a real store when:
- Many components read overlapping slices of state.
- Updates are frequent and you need selector-based subscriptions to avoid re-renders.
- You need devtools (Redux/Zustand), middleware, persistence, time-travel.

### Zustand (lightweight, common in modern brownfield code)

```jsx
import { create } from 'zustand';

const useStore = create((set) => ({
  user: null,
  setUser: (u) => set({ user: u }),
}));

function Comp() {
  const user = useStore(state => state.user); // selector — re-renders only when user changes
  return <span>{user?.name}</span>;
}
```

Key feature: **selectors**. Subscribing components only re-render when their selector's output changes. This eliminates the monolithic-context problem.

### Redux Toolkit (still common, especially older codebases)

Core ideas: slice + reducer + selector. Same selector-subscription benefit via `useSelector(state => ...)`.

Pitfalls:
- Mutating state inside reducers (in older Redux, not RTK which uses Immer).
- Storing server data in Redux without a query layer — re-implements React Query badly.
- Putting derived data in store instead of selectors.

---

## Normalization — the data shape pattern

For lists of entities (users, posts), store as a normalized map:

```js
// ❌ array
items: [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }]

// ✅ normalized
itemsById: { a: { id: 'a', name: 'A' }, b: { id: 'b', name: 'B' } }
itemIds: ['a', 'b']
```

Wins:
- O(1) lookup by id (no `.find()`).
- Updating one item doesn't require recreating the array.
- No duplicate sources of truth when an item appears in multiple lists.

Cost: more setup code; need to maintain `itemIds` order separately.

For interview: recognize the pattern. Don't introduce it unless asked.

---

## Optimistic updates — the pattern

When a user action triggers a server mutation, you can:
- **Pessimistic:** wait for server response, then update UI. Feels slow.
- **Optimistic:** update UI immediately, send request in background, rollback on failure.

```jsx
async function toggleLike(postId) {
  setPosts(prev => prev.map(p => p.id === postId ? {...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1)} : p));
  try {
    await api.toggleLike(postId);
  } catch (e) {
    // rollback
    setPosts(prev => prev.map(p => p.id === postId ? {...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1)} : p));
    showError('Could not save');
  }
}
```

**Footguns:**
- Rollback math wrong → permanent desync.
- Multiple concurrent optimistic updates collide (user double-clicks).
- No clear "saving" indicator → user doesn't know action is in flight.

React Query / RTK Query / SWR have built-in optimistic mutation helpers — use them if the codebase already includes one.

---

## Race conditions in data fetching

The classic bug:

```jsx
useEffect(() => {
  fetch(`/api/users/${id}`).then(r => r.json()).then(setUser);
}, [id]);
```

Scenario: user navigates `id=1` → fetch starts (slow). User clicks `id=2` → fetch starts (fast). `id=2` resolves first → setUser(B). `id=1` resolves later → setUser(A). **You're now showing user A while the URL says user 2.**

### Fix 1: AbortController (cancel in-flight requests)
```jsx
useEffect(() => {
  const controller = new AbortController();
  fetch(`/api/users/${id}`, { signal: controller.signal })
    .then(r => r.json())
    .then(setUser)
    .catch(e => {
      if (e.name !== 'AbortError') console.error(e);
    });
  return () => controller.abort();
}, [id]);
```

### Fix 2: ignore stale responses
```jsx
useEffect(() => {
  let cancelled = false;
  fetch(`/api/users/${id}`).then(r => r.json()).then(d => {
    if (!cancelled) setUser(d);
  });
  return () => { cancelled = true; };
}, [id]);
```

### Fix 3: use a library (React Query, SWR)
They handle this automatically with request keys.

---

## Storage layer: localStorage, sessionStorage, cookies

| | Persists | Sent with requests | Size | XSS-readable |
|---|---|---|---|---|
| localStorage | Forever | No | ~5MB | Yes (risky for tokens) |
| sessionStorage | Tab lifetime | No | ~5MB | Yes |
| Cookies (httpOnly) | Configurable | Yes | ~4KB per cookie | **No** ✅ |

### Bug pattern: auth tokens in localStorage
If your XSS, the token is exfilable. Best practice: **httpOnly + Secure + SameSite cookies** for session tokens. localStorage is OK for non-sensitive preferences.

### Bug pattern: storing JSON without try/catch
```js
JSON.parse(localStorage.getItem('user')) // throws on null or corrupted
```

**Fix:**
```js
function safeParse(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}
```

### Bug pattern: SSR + localStorage
`localStorage` doesn't exist on the server. Calling it during render in Next.js SSR crashes. Use `useEffect` or check `typeof window !== 'undefined'`.

---

## Vue brief note (since you wanted some Vue)

Vue 3 uses **reactivity refs/reactive** + Composition API. The state mental model differs:

- `ref(value)` → `.value` is the actual value; reactivity tracked.
- `reactive(obj)` → returns a proxy; mutations are tracked.
- `computed(() => ...)` → derived value, recomputed when deps change.
- `watch(source, cb)` / `watchEffect(cb)` → effects that re-run when reactive deps change.

```vue
<script setup>
import { ref, computed } from 'vue';
const count = ref(0);
const double = computed(() => count.value * 2);
function inc() { count.value++; }
</script>
<template>
  <button @click="inc">{{ count }} / {{ double }}</button>
</template>
```

**Pinia** is the modern store (replaced Vuex). Selector subscriptions, devtools.

Key differences from React:
- Mutation is fine in Vue (proxies track changes); in React you must replace state immutably.
- Templates use `v-if`, `v-for`, `v-model` (two-way binding).
- Keyed `<v-for>` matters for the same reasons as React lists.

You won't be asked Vue if the repo is React. But if you open the repo and see `.vue` files, the mental model above gets you to a working code review.

---

## Quick mental checklist for state code

- [ ] Is the value's source of truth clear? (one place)
- [ ] Is server state cached and deduped, or do we re-fetch on every mount?
- [ ] Is context value memoized?
- [ ] Are derived values computed, not stored?
- [ ] Are setState callbacks used when prev state matters (`setX(x => ...)`)?
- [ ] Are race conditions handled on identifier changes?
- [ ] Are subscriptions / timers cleaned up?
- [ ] Is sensitive data in localStorage when it should be httpOnly cookie?

Next: `04-security.md`.
