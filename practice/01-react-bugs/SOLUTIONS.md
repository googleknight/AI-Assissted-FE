# SOLUTIONS — 01-react-bugs

> Don't peek until you've written your own answers. For each bug, the principle behind it matters more than the syntax of the fix.

---

## 01 — Stale closure in interval

**Bug:** Empty dep array `[]` means the effect runs once. The interval callback closes over `count` from that first render — forever 0. `setCount(0 + 1)` = always 1.

**Symptom:** After 5 ticks, UI shows 1 (not 5). `console.log` prints "tick — count is 0" repeatedly.

**Fix A (preferred): functional updater.**
```jsx
useEffect(() => {
  const id = setInterval(() => setCount(c => c + 1), 1000);
  return () => clearInterval(id);
}, []);
```
Pros: keeps interval long-lived (single setup). Doesn't restart per tick.

**Fix B: include `count` in deps.**
```jsx
useEffect(() => {
  const id = setInterval(() => setCount(count + 1), 1000);
  return () => clearInterval(id);
}, [count]);
```
Restarts the interval after every tick — usually wrong (drift).

**Fix C (advanced): ref to latest callback.** For when you genuinely need a stable interval but a callback that reads fresh state.

---

## 02 — Object dependency infinite loop

**Bug:** `queryOptions = { ... }` is a new object literal every render. The dep array compares by `Object.is` → new ref every render → effect fires every render → setState → re-render → new object → effect fires again.

**Symptom:** Infinite re-renders, hammered API.

**Fix A (this file): depend on primitives, not the object.**
```jsx
useEffect(() => {
  fetch('/api/posts?' + new URLSearchParams({ userId, status, includeArchived: false }))
    .then(...);
}, [userId, status]);
```

**Fix B (this file): memoize the object.**
```jsx
const queryOptions = useMemo(() => ({ userId, status, includeArchived: false }), [userId, status]);
```

**Fix B (parent side):** if `queryOptions` was passed as a prop, the parent should `useMemo` it before passing.

**Lesson:** every object/array/function in a dep array must have stable identity unless you WANT the effect to re-run.

---

## 03 — List keys + index-based update

**Two bugs:**

**Bug 1 (key):** `key={i}` on a deletable list. After deleting index 0, item formerly at index 1 is now at index 0. React reuses index 0's DOM node — including any focus, scroll position, or uncontrolled state — for what's now a different item.

**Bug 2 (update by index):** `updateNotes(i, v)` uses the array index `i` captured at render time. If items shift, the index could update the wrong row.

**Fix:** use stable id everywhere.
```jsx
{todos.map((t) => (
  <li key={t.id}>
    <input value={t.notes} onChange={(e) => updateNotes(t.id, e.target.value)} />
    <button onClick={() => remove(t.id)}>Delete</button>
  </li>
))}

function updateNotes(id, v) {
  setTodos((t) => t.map((x) => (x.id === id ? { ...x, notes: v } : x)));
}
```

**Demo:** Type "abc" in row B's input. Delete row A. Row B's notes appear on what's now first row (visually moved up), and React preserved the input across re-association.

---

## 04 — Missing cleanup (three issues)

**Issue 1: resize listener never removed.** On unmount, the listener still fires and tries to setState on an unmounted component. Multiple mount/unmounts accumulate listeners.

**Issue 2: setInterval never cleared.** Same — leaks timer.

**Issue 3: `document.title` reads stale `size`.** The effect closes over `size` from the first render (deps `[]`). The title is set once with "0 x 0" then never updated. Also, in StrictMode the effect runs twice → title set twice (cosmetic). And the title isn't reverted on unmount.

**Fixed:**
```jsx
useEffect(() => {
  function onResize() {
    setSize({ w: window.innerWidth, h: window.innerHeight });
  }
  onResize();
  window.addEventListener('resize', onResize);
  const id = setInterval(() => console.log('still mounted'), 5000);

  return () => {
    window.removeEventListener('resize', onResize);
    clearInterval(id);
  };
}, []);

useEffect(() => {
  const prev = document.title;
  document.title = `Window: ${size.w} x ${size.h}`;
  return () => { document.title = prev; };
}, [size]);
```

---

## 05 — Derived state

**Bugs:**
1. `filtered` and `count` are derived from `products` + `filter`. Storing them creates:
   - **A one-render lag** — when filter changes, render happens with old `filtered`, THEN effect runs, sets state, second render shows updated.
   - **An extra render** per change.
   - **A bug surface** — could desync if anything writes to one but not the other.
2. The effect is doing what `useMemo` (or just inline compute) does, but worse.

**Rewrite:**
```jsx
export function ProductList({ products }) {
  const [filter, setFilter] = useState('');
  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div>
      <input value={filter} onChange={(e) => setFilter(e.target.value)} />
      <p>{filtered.length} results</p>
      <ul>{filtered.map(p => <li key={p.id}>{p.name}</li>)}</ul>
    </div>
  );
}
```

**When to `useMemo`?** Only if `products` is huge and filter is expensive — profile first.

---

## 06 — Batched setState

**Bug:** All three `setCount(count + 1)` calls read the same `count` from the current render's closure. After all three updates, `count` is `count + 1`, not `count + 3`.

React 18 has automatic batching, including in `setTimeout`, so the timeout version has the same bug.

**Fix:** functional updaters.
```jsx
setCount(c => c + 1);
setCount(c => c + 1);
setCount(c => c + 1);
```

**Junior-friendly explanation:** "Inside this render, `count` is a number, not a live reference. All three lines see the same value. Use the function form when the new state depends on the previous state."

---

## 07 — Context not memoized

**Three problems:**

1. **Object literal `value={...}`** — new object every Provider render → every consumer re-renders even if no actual state changed.
2. **`addNotification` is a new function each render** → its consumers see new identity.
3. **Monolithic context** — anyone consuming `theme` also re-renders on `user` changes (and vice versa), even if their selector doesn't read both.
4. **`useApp` no null check** — if used outside a provider, returns `null`, and consumers do `.theme` → crash deep in the tree with unhelpful error.

**Fix A (memo):**
```jsx
const value = useMemo(() => ({
  user, setUser, theme, setTheme, notifications,
  addNotification: (n) => setNotifications(prev => [...prev, n])
}), [user, theme, notifications]);
```

(`setUser`/`setTheme` are stable from useState; you don't need them in deps.)

**Fix B (split contexts):**
```jsx
<UserContext.Provider value={userValue}>
  <ThemeContext.Provider value={themeValue}>
    <NotificationContext.Provider value={notifValue}>
      {children}
```

**Fix C (state+dispatch split):**
```jsx
<StateContext.Provider value={state}>
  <DispatchContext.Provider value={dispatch}>
```

**When to use which:** A) for small contexts. B) when sections of UI need different slices. C) for complex apps where the reducer fits.

**Don't forget the null check:**
```jsx
export function useApp() {
  const ctx = useContext(AppContext);
  if (ctx === null) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}
```

---

## 08 — Conditional hook violations

**Violation 1:** `useState` called *after* an early return. The hook call order differs between renders that have / don't have a userId. React tracks hooks by call order; this corrupts the order.

**Violation 2:** `useEffect` inside a `for` loop. Loop iteration count must be constant; if `userId` changed and the loop ran a different number of times, hooks order is corrupted.

**Violation 3:** `useState` inside a regular function (`handleClick`). Hooks can only be called from React components or other hooks, at the top level.

**Symptoms:** Cryptic errors like "Rendered fewer hooks than expected" or wrong state values landing in wrong hooks.

**Fix:**
```jsx
export function UserCard({ userId }) {
  const [user, setUser] = useState(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (!userId) return;
    fetch(`/api/users/${userId}`).then(r => r.json()).then(setUser);
  }, [userId]);

  // role-checking loop doesn't need a hook per role:
  useEffect(() => {
    ['admin', 'editor', 'viewer'].forEach(role => console.log(`checking role: ${role}`));
  }, []);

  if (!userId) return <div>Sign in to see your profile</div>;
  return <div onClick={() => setHovered(true)}>{user ? user.name : 'Loading...'}</div>;
}
```

**Rule:** hooks at the top level, in the same order, every render.

---

## 09 — Race condition

**Scenario:**
- t=0: click user 1. `setUser(null); setPosts(null);` fired. Two fetches start.
- t=20ms: click user 2. Effect cleanup is empty. `setUser(null); setPosts(null);` again. Two new fetches start. Now 4 in flight.
- t=50: user 1's `/api/users/1` resolves → `setUser(user1)`.
- t=80: user 2's `/api/users/2` resolves → `setUser(user2)`.
- t=120: user 1's `/api/users/1/posts` resolves → `setPosts(posts1)`. UI now shows **user2 + posts1**.

**Fix A (AbortController):**
```jsx
useEffect(() => {
  const c = new AbortController();
  setUser(null); setPosts(null);

  Promise.all([
    fetch(`/api/users/${userId}`, { signal: c.signal }).then(r => r.json()),
    fetch(`/api/users/${userId}/posts`, { signal: c.signal }).then(r => r.json()),
  ])
    .then(([u, p]) => { setUser(u); setPosts(p); })
    .catch(e => { if (e.name !== 'AbortError') setError(e); });

  return () => c.abort();
}, [userId]);
```

**Fix B (ignore-stale):**
```jsx
useEffect(() => {
  let cancelled = false;
  setUser(null); setPosts(null);
  fetch(`/api/users/${userId}`).then(r => r.json()).then(u => { if (!cancelled) setUser(u); });
  fetch(`/api/users/${userId}/posts`).then(r => r.json()).then(p => { if (!cancelled) setPosts(p); });
  return () => { cancelled = true; };
}, [userId]);
```

**Fix C (latest-id ref):**
```jsx
const latest = useRef(0);
useEffect(() => {
  const id = ++latest.current;
  fetch(...).then(d => { if (id === latest.current) setUser(d); });
}, [userId]);
```

**Compare:**
- A: cancels work too. Best on slow APIs.
- B: doesn't cancel, just ignores. Simple, but request still runs.
- C: doesn't cancel. Works when you can't abort (third-party SDK).

**Other bugs:** if both fetches fail, only the latter's error wins. `r.json()` doesn't check `r.ok` — 500 responses go to setUser/setPosts as if success. No timeout. No retry.

---

## 10 — Modal state reset

**Cause:** `{open && <FeedbackModal />}` unmounts and re-mounts the modal on every open/close. Component state is destroyed on unmount.

**Fix A — lift state up:**
```jsx
function FeedbackPage() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [category, setCategory] = useState('bug');
  return (
    <>
      <button onClick={() => setOpen(true)}>Send feedback</button>
      {open && <FeedbackModal
        text={text} setText={setText}
        category={category} setCategory={setCategory}
        onClose={() => setOpen(false)} />}
    </>
  );
}
```
Pro: simple. Con: modal becomes controlled-only.

**Fix B — keep mounted, toggle visibility:**
```jsx
return (
  <FeedbackModal hidden={!open} onClose={() => setOpen(false)} />
);
// inside modal:
return <div style={{ display: hidden ? 'none' : 'block' }}>...</div>;
```
Pro: trivial. Con: hidden DOM still in tree (a11y considerations).

**Fix C — persist to localStorage:**
```jsx
const [text, setText] = useState(() => localStorage.getItem('fb:text') ?? '');
useEffect(() => { localStorage.setItem('fb:text', text); }, [text]);
```
Pro: survives refresh, navigation. Con: needs cleanup, must guard for SSR (`typeof window`).

**Interview pick:** Fix A — minimal, explicit, demonstrates lifting state. Mention C as future improvement for "save draft."

---

Done. Re-run any you got wrong. Then `02-security-bugs/`.
