# 02 — React Deep Dive: Hooks, Closures, Lifecycles, Subtle Bugs

> The most common interview bugs live in three places: **useEffect dependencies, stale closures, and reconciliation (keys / refs)**. Master these three and you'll spot ~70% of the bugs in any brownfield React code.

---

## Mental model: React's three core mechanics

Internalize these. Every React bug is a violation of one.

### 1. Rendering is "calling the function"
A render = React calls your component function and computes JSX. Your component runs **top to bottom every time** state or props change. There is no magic; the closures captured during a render see the values from THAT render.

### 2. Effects run AFTER render, AFTER paint
`useEffect` does NOT run during render. It fires after the browser has painted. By the time it runs, the values it captured are already "old" from the next render's perspective — but they're consistent with the render they belong to.

### 3. Reconciliation matches by position + key
React compares this render's tree to the previous render's. Same position, same type, same key → reuse the DOM node and component state. Different → unmount + remount (state is lost).

If you understand those three, the rest is detail.

---

## The useEffect dependency array — the #1 interview bug

### The rule
**Every value from the component scope that's used inside the effect must be in the dependency array.**

Including: state, props, functions defined in the component, derived values.

### Common breakages

**(a) Missing dep → stale value**
```jsx
function Counter({ start }) {
  const [count, setCount] = useState(start);
  useEffect(() => {
    const id = setInterval(() => {
      setCount(count + 1); // ❌ `count` is stale — always +1 from initial
    }, 1000);
    return () => clearInterval(id);
  }, []); // ❌ no deps means count is the closure from first render only
}
```

**Fix A (functional update):**
```jsx
setCount(c => c + 1); // ✅ doesn't read stale count
```

**Fix B (correct deps):**
```jsx
useEffect(() => {
  const id = setInterval(() => setCount(count + 1), 1000);
  return () => clearInterval(id);
}, [count]); // ⚠️ but now the interval restarts every tick — usually wrong
```

**(b) Object/array dep that changes every render → infinite loop or thrash**
```jsx
useEffect(() => { fetchData(filter); }, [filter]);
// where filter is { type: 'a' } defined in the component body
// ❌ new object every render → effect fires every render → infinite loop if it sets state
```

**Fix:**
```jsx
// Stabilize with useMemo
const filter = useMemo(() => ({ type }), [type]);

// Or depend on primitives
useEffect(() => { fetchData({ type }); }, [type]);
```

**(c) Function dep recreated each render**
```jsx
function Parent() {
  const onLoad = () => console.log('done'); // ❌ new fn each render
  return <Child onLoad={onLoad} />;
}

function Child({ onLoad }) {
  useEffect(() => { fetchAndCallback(onLoad); }, [onLoad]); // fires every parent render
}
```

**Fix:** `useCallback` the function in Parent, or restructure so the effect doesn't depend on the function.

---

## Stale closures — the #2 interview bug

A closure captures the value at the moment of creation. If you create a function inside a render, it sees that render's state — forever, unless replaced.

```jsx
function Search() {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      console.log('searching for', query); // captured `query` at effect creation
      doSearch(query);
    }, 500);
    return () => clearTimeout(handler);
  }, [query]); // ✅ this is fine because deps include query → effect re-runs

  return <input onChange={e => setQuery(e.target.value)} />;
}
```

The above is correct. **It's correct because the effect re-runs.** The closure is "stale" within a single run, but a new effect runs every time `query` changes — so each closure is fresh.

The bug version:

```jsx
function Search() {
  const [query, setQuery] = useState('');
  useEffect(() => {
    setInterval(() => doSearch(query), 1000); // ❌ closure on first `query` only
  }, []);
}
```

### The "useRef escape hatch" for stale closures

When you need a value that's always current but shouldn't trigger re-renders or effect re-runs:

```jsx
const queryRef = useRef(query);
useEffect(() => { queryRef.current = query; });

useEffect(() => {
  const id = setInterval(() => doSearch(queryRef.current), 1000); // always current
  return () => clearInterval(id);
}, []);
```

This pattern is critical for: long-lived intervals, websocket message handlers, event listeners attached once.

---

## useState gotchas

### (a) Initial value computed every render

```jsx
const [data, setData] = useState(expensiveCompute()); // ❌ runs every render (return value ignored after first, but compute still runs)
```

**Fix:** lazy initializer.
```jsx
const [data, setData] = useState(() => expensiveCompute()); // ✅ runs once
```

### (b) State setters are async (batched)

```jsx
setCount(count + 1);
setCount(count + 1);
// count only goes up by 1, not 2 — both reads see the same `count`
```

**Fix:**
```jsx
setCount(c => c + 1);
setCount(c => c + 1);
```

In **React 18+ automatic batching** applies everywhere — event handlers, `setTimeout`, promises, native event listeners. Pre-18 only event handlers were batched. So in modern React this bug exists no matter where you make the updates — never assume `setTimeout` "unbatches" them.

### (c) Storing derived state

```jsx
const [items, setItems] = useState([]);
const [count, setCount] = useState(0); // ❌ count = items.length, just derive it
```

**Fix:** compute `items.length` directly. Storing it doubles the bug surface (the two can desync).

### (d) Updating state with the same value

React bails out only if the value is `Object.is` equal. New objects/arrays always trigger re-render even if "logically equal."

```jsx
setUser({ ...user }); // ❌ triggers re-render even though nothing changed
```

### (e) Setting state during render

```jsx
function C() {
  const [x, setX] = useState(0);
  setX(1); // ❌ infinite render loop
}
```

If you genuinely need to derive state from props, **don't store it** — compute it during render. If you must, use the "during render" pattern with a guard:
```jsx
if (someCondition && x !== expected) setX(expected); // only allowed with strict condition
```

---

## Keys in lists — the #3 interview bug

### Why keys matter
React reconciles list items by key. If keys are missing or unstable, React can:
- Reuse the wrong DOM node for the wrong item (state leaks across items)
- Tear down + rebuild items unnecessarily (lost focus, lost input value, animations replay)

### The cardinal sin: `key={index}`

```jsx
{items.map((item, i) => <Item key={i} value={item} />)}
```

This is fine IF AND ONLY IF the list is append-only and never reordered or filtered. Otherwise:

**Demo bug:** A list `[A, B, C]` rendered with `key={index}`. User deletes `B`. React sees `[A, C]` at positions `[0, 1]`. Position 1 was `B`, now it's `C` — React reuses `B`'s DOM node and just updates its props. If `B` had a focused input, focus is now on `C`'s input with `B`'s old typed text.

**Fix:** `key={item.id}` — a stable identity from the data.

### When you have no stable id

Sometimes data has no id. Options:
- Add one (`crypto.randomUUID()`) when creating items.
- Compose one from stable fields: `key={`${item.userId}-${item.date}`}`.
- Don't use index unless the list is truly static.

---

## useCallback and useMemo — when they actually help

### useCallback
Returns a memoized function whose identity is stable across renders unless deps change.

**Helps when:**
- The function is passed to a `React.memo`'d child as a prop.
- The function is a dep of another hook (`useEffect`, `useMemo`).

**Does NOT help when:**
- The child isn't memoized — the child re-renders anyway because its parent did.
- The function is only used in render or in event handlers attached locally.

**Anti-pattern:** wrapping every callback in `useCallback`. It costs memory and complexity for no benefit. Profile first.

### useMemo
Returns a memoized value whose identity is stable unless deps change.

**Helps when:**
- The computation is genuinely expensive (sorting 10k items, complex math).
- The value is used as a dep in another hook (stabilize a config object).
- The value is passed to a `React.memo`'d child as a prop.

**Does NOT help when:**
- The computation is cheap (`a + b`). Memoization overhead > computation cost.

### React.memo
Wraps a component so it only re-renders when its props change (by `Object.is`).

**Helps when:**
- The component is expensive.
- Its parent re-renders often but props don't.

**Defeats:**
- Inline object/array/function props always look "changed."
- Pass primitives or memoized references for memo to help.

---

## useRef — what it actually is

`useRef(initial)` returns a mutable object `{ current: initial }` that **persists across renders without triggering re-renders**.

Uses:
1. **DOM access:** `<input ref={inputRef} />` → `inputRef.current` is the DOM node.
2. **Mutable values that don't affect rendering:** previous values, timer ids, "is mounted" flags, latest-callback patterns.
3. **Escape stale closure traps** (see above).

**Do NOT use refs for derived UI state.** If something should cause a re-render, it must be in `useState` or `useReducer`.

### Common ref patterns

**Previous value:**
```jsx
function usePrevious(value) {
  const ref = useRef();
  useEffect(() => { ref.current = value; });
  return ref.current;
}
```

**Mounted guard (avoiding setState after unmount):**
```jsx
const isMounted = useRef(true);
useEffect(() => () => { isMounted.current = false; }, []);

async function load() {
  const data = await fetch(...);
  if (isMounted.current) setData(data);
}
```

(Modern React + AbortController is cleaner — see `06-resilience.md`.)

---

## Cleanup functions — the silent killers

Every `useEffect` that creates a subscription, timer, or listener MUST clean up.

```jsx
useEffect(() => {
  const id = setInterval(tick, 1000);
  return () => clearInterval(id); // ✅
}, []);

useEffect(() => {
  window.addEventListener('resize', handler);
  return () => window.removeEventListener('resize', handler); // ✅
}, [handler]);

useEffect(() => {
  const controller = new AbortController();
  fetch(url, { signal: controller.signal });
  return () => controller.abort(); // ✅
}, [url]);
```

**Common omission:** `setTimeout` with a long delay inside an effect. If the component unmounts, the timeout still fires and may call `setState` on an unmounted component (React 18+ silently ignores, but the side effects in the callback still happen).

---

## Strict Mode in dev — double-invoke

React 18 in `<StrictMode>` (dev only) intentionally **double-invokes** components, effects, and state initializers to surface side-effect bugs.

If a piece of code "works" but breaks under StrictMode, the code has a bug — not StrictMode. Common culprit:
- Effect creates a resource but cleanup is incomplete → second invocation leaks.
- Component renders with side effects in the body (mutating refs, console.logs that increment counters).

**Interview tip:** if you see two duplicate fetches in network tab, don't immediately blame React. It's the dev-mode signal that your cleanup isn't bulletproof.

---

## Controlled vs uncontrolled inputs

**Controlled** — value driven by state:
```jsx
<input value={name} onChange={e => setName(e.target.value)} />
```
Pro: predictable, single source of truth, easy validation.
Con: re-renders on every keystroke.

**Uncontrolled** — DOM owns the value:
```jsx
<input defaultValue="" ref={inputRef} />
// read on submit: inputRef.current.value
```
Pro: zero re-renders during typing.
Con: harder to validate live.

**Mixed footgun:** passing `value` but no `onChange` makes the input read-only and silently broken. React warns in dev — watch for it.

---

## Forms: the patterns

### Pattern A: useState per field
Fine for 1-3 fields. Doesn't scale.

### Pattern B: single state object
```jsx
const [form, setForm] = useState({ name: '', email: '' });
const update = (k, v) => setForm(f => ({ ...f, [k]: v }));
```

### Pattern C: useReducer
For complex forms with validation rules and inter-field dependencies. Cleaner than ten setState calls.

### Pattern D: a library (react-hook-form, Formik)
For real forms. Brownfield codebases usually already chose one — match it.

### Validation pitfalls
- Validating on every keystroke can be hostile (showing errors before user finishes typing). Validate on blur, submit on submit.
- Don't trust client validation — always validate server-side too (security).
- HTML5 validation (`type="email"`, `required`) gets you a lot for free.

---

## Conditional rendering pitfalls

### The `&&` falsy trap

```jsx
{items.length && <List items={items} />}
// ❌ if items is [], renders the literal `0` in the DOM
```

**Fix:**
```jsx
{items.length > 0 && <List items={items} />}
// or
{items.length ? <List items={items} /> : null}
```

### Mounting/unmounting destroys state

```jsx
{isOpen && <Modal />}
// every open re-mounts Modal → its internal state resets
```

If you need state to persist across open/close, lift it up or always-mount with a visibility prop.

---

## Context — the basics (deeper coverage in doc 03)

`createContext` + `<Context.Provider value={...}>` + `useContext`.

**Performance footgun:** every consumer re-renders when the provider's `value` changes. If `value={{user, posts, settings}}` is an inline object, EVERY consumer re-renders on EVERY parent render.

**Fix:** memoize the value.
```jsx
const value = useMemo(() => ({ user, posts, settings }), [user, posts, settings]);
return <Ctx.Provider value={value}>...</Ctx.Provider>;
```

**Better:** split into multiple contexts so consumers only subscribe to what they need.

---

## Event handlers: synthetic events and pooling

In React 17+ event pooling is gone — you can hold onto `event` async. But:
- `event.target.value` is fine to read synchronously.
- Don't store entire event objects in state — store the data you need.

---

## Quick mental quiz (answer before reading the next doc)

1. You see `useEffect(() => { fetchData(opts) }, [opts])` where `opts = { id }`. What's wrong?
2. You see `{items.map((x, i) => <Card key={i} {...x} />)}` and items can be deleted. What can go wrong?
3. `setCount(count + 1); setCount(count + 1);` — final count?
4. What happens if you don't return a cleanup function from `useEffect` that calls `addEventListener`?
5. When is `useCallback` useless?

Answers:
1. New object reference each render → effect fires every render. Fix: depend on `[id]` or `useMemo` the opts.
2. Deleting an item by index shifts items down but React reuses DOM by index → wrong item state, wrong DOM. Fix: `key={x.id}`.
3. `count + 1` (not +2). Both setters read the same closure value. Use `setCount(c => c + 1)`.
4. Listener accumulates on every effect run. Memory leak; handlers fire multiple times.
5. When the child receiving the callback isn't memoized — the child re-renders anyway. Premature `useCallback` is just overhead.

Next: `03-state-management.md`.
