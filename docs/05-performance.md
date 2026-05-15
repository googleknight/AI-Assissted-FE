# 05 — Performance: Re-renders, Memoization, Virtualization, Profiling

> The interview brief explicitly calls out "unnecessary re-renders." Performance is the area where seniors get separated from juniors — not because of esoteric optimizations, but because seniors **measure before optimizing** and **know when NOT to memoize**.

---

## The two performance categories

Frontend perf has two distinct concerns:

1. **Runtime perf** — how the app behaves after it's loaded (re-renders, scroll jank, input lag).
2. **Load perf** — how fast it gets interactive (bundle size, network, hydration, Core Web Vitals).

Brownfield interviews skew toward runtime perf because it's easier to demonstrate in 30 minutes.

---

## The render cycle — what causes a re-render

A React component re-renders when:
1. Its **own** state changes (`useState`, `useReducer`).
2. Its **parent** re-renders (children render by default unless memoized).
3. The **context** it consumes changes (`useContext`).
4. A subscribed **store slice** changes (Redux/Zustand selectors).

**Critical insight:** props changing does NOT by itself cause a re-render. The parent rendering does. Children render because their parent rendered. Memoization breaks that propagation.

---

## Diagnosing unnecessary re-renders

### Step 1: Profile

- **React DevTools Profiler**: record a session, look for components that render when they shouldn't, see what triggered each render (state change? props? parent?).
- **Why Did You Render** library (in dev): logs to console why a component re-rendered.
- **Chrome Perf tab**: long tasks, layout thrashing, paint storms.

**Senior signal:** "Before I optimize, let me profile." Saying this out loud in the interview is a huge win.

### Step 2: Identify the cause

A component re-rendered. Why?
- Did state change? → expected, but check if you're storing derivable data.
- Did context change? → check if context value is memoized.
- Did parent render? → check if children should be memoized.
- Did a prop change? → is it a new reference each render?

---

## The "new reference each render" antipattern

Most "unnecessary re-render" bugs trace to this:

```jsx
function Parent({ items }) {
  return (
    <Child
      items={items}
      onClick={() => doThing()}          // ❌ new function each render
      style={{ marginTop: 10 }}            // ❌ new object each render
      options={items.filter(i => i.active)} // ❌ new array each render
    />
  );
}

const Child = React.memo(function Child(props) { ... });
```

`React.memo` compares props with `Object.is`. New references = new props = re-renders. The memo is useless.

### Fixes

```jsx
function Parent({ items }) {
  const handleClick = useCallback(() => doThing(), []);
  const activeItems = useMemo(() => items.filter(i => i.active), [items]);
  const style = useMemo(() => ({ marginTop: 10 }), []);

  return <Child items={items} onClick={handleClick} style={style} options={activeItems} />;
}
```

Or hoist truly static values to module scope:
```js
const childStyle = { marginTop: 10 }; // module scope, defined once
```

---

## When memoization is worth it (and when it's not)

### Worth it
- The component is expensive (large subtree, lots of children).
- It re-renders often due to parent renders.
- Its props are stable or made stable via memoization.

### Not worth it
- The component is trivial (renders 3 elements). Memo overhead > saved render cost.
- Props change every render anyway. Memo runs, props don't match, render anyway, plus overhead.
- The component owns most of its data via state — it'll re-render itself regardless.

### The "memo everything" antipattern
Wrapping every component in `React.memo` and every callback in `useCallback`:
- Adds memory cost.
- Adds CPU cost on every render (the comparison).
- Adds cognitive cost (developers expect the memo to be load-bearing).

Memoize **deliberately**, where you've identified an actual problem.

---

## Lists — the perf hot spot

### Always have keys
Covered in doc 02. `key={item.id}`, never `key={index}` for mutable lists.

### Virtualize large lists

If a list can grow >100-200 items, render only visible ones.

Tools: `react-window`, `react-virtual`, `TanStack Virtual`.

```jsx
import { FixedSizeList } from 'react-window';

<FixedSizeList height={400} itemCount={10000} itemSize={50} width="100%">
  {({ index, style }) => <div style={style}>{items[index].name}</div>}
</FixedSizeList>
```

Without virtualization, 10,000 DOM nodes = slow paint, slow scroll, memory bloat.

### Avoid re-computing filters/sorts each render

```jsx
const sorted = useMemo(() => [...items].sort(byDate), [items]);
const filtered = useMemo(() => sorted.filter(i => i.active), [sorted]);
```

### Don't index into a sorted/filtered list with the original index

Common bug: derived list with `items.filter().map((x, i) => onClick(originalItems[i]))` — `i` is the filtered index, not the original. Use `x.id` to look up.

---

## Bundle size — the loading-perf concern

### Common bloat sources

1. **Whole library imports**
   ```js
   import _ from 'lodash';              // ❌ ~70KB
   import { debounce } from 'lodash';   // ⚠️ depends on tree-shaking
   import debounce from 'lodash/debounce'; // ✅ ~2KB
   ```

2. **Moment.js** — 67KB minified + locales. Replace with `date-fns` (tree-shakable) or `dayjs` (2KB).

3. **Unused polyfills** — `core-js` shipped to evergreen browsers.

4. **Large images** — use modern formats (AVIF, WebP) and proper sizing.

5. **Unused routes/code** — code-split with `React.lazy` + `Suspense`.

   ```jsx
   const Settings = React.lazy(() => import('./Settings'));
   <Suspense fallback={<Spinner />}><Settings /></Suspense>
   ```

### Tools to find bloat
- `webpack-bundle-analyzer` / `vite-bundle-visualizer`
- `source-map-explorer`
- Next.js: `@next/bundle-analyzer`

---

## Network perf

### Common issues

- **No HTTP caching** on static assets — set immutable cache headers, hash filenames.
- **Re-fetching identical data** on every navigation — use a query cache (React Query, SWR).
- **Waterfalls** — A waits for B waits for C. Parallelize with `Promise.all`.
- **N+1 fetch** — list of 50 items each fetching detail individually. Batch endpoint or fetch only when needed.
- **No request dedup** — two components mount, both fetch same URL. Query cache solves this.

### Streaming and progressive rendering

For Next.js / RSC, see doc 08. The TL;DR: streaming HTML to the client and progressively hydrating beats waiting for the full page.

---

## Core Web Vitals (loading perf, 30-second summary)

| Metric | What | Good | Common issues |
|---|---|---|---|
| **LCP** (Largest Contentful Paint) | When main content appears | <2.5s | Big hero image not preloaded, slow server, render-blocking JS |
| **INP** (Interaction to Next Paint) | Input responsiveness | <200ms | Heavy event handlers, big re-renders on input |
| **CLS** (Cumulative Layout Shift) | Visual stability | <0.1 | Images without dimensions, ads, late-loading fonts |

Quick wins:
- `<img width height>` always set (prevents CLS).
- Preload critical assets (`<link rel="preload" as="image" href="...">`).
- `font-display: swap` (CLS tradeoff for FOIT).
- Lazy-load below-the-fold images (`loading="lazy"`).

---

## Input lag — the "typing into a textbox feels slow" bug

Causes:
- Controlled input where each keystroke re-renders a huge tree.
- Filter/search computed synchronously on every keystroke against a large list.
- Expensive validation on every keystroke.

Fixes:
- **Debounce** the side effect (search), not the input value itself:
  ```jsx
  const [query, setQuery] = useState('');
  const debouncedQuery = useDeferredValue(query); // React 18+
  // or useDebouncedValue from a library
  const results = useMemo(() => bigSearch(debouncedQuery), [debouncedQuery]);
  ```
- **Move heavy work to a worker** for truly expensive computation.
- **`useTransition`** to mark non-urgent state updates so urgent ones (typing) stay smooth.

  ```jsx
  const [isPending, startTransition] = useTransition();
  const onChange = e => {
    setQuery(e.target.value); // urgent, keeps input responsive
    startTransition(() => setFilter(e.target.value)); // non-urgent
  };
  ```

---

## Concurrent React features (React 18)

This is what 99% of brownfield codebases use. Master these first — React 19 additions are below in their own section.

### useTransition (React 18+)
Marks state updates as non-urgent. React can interrupt them to keep the UI responsive. Pair with Suspense for graceful loading.

```jsx
const [isPending, startTransition] = useTransition();
startTransition(() => setFilter(value)); // non-urgent
```

### useDeferredValue (React 18+)
Returns a "lagging" version of a value. Same effect as debouncing without timer logic.

```jsx
const deferredQuery = useDeferredValue(query);
```

### Suspense (React 18+)
Declarative loading boundary.
```jsx
<Suspense fallback={<Spinner />}>
  <SlowComponent />
</Suspense>
```
Originally for code splitting; with frameworks (Next.js App Router, Relay, React Query in suspense mode) it works for data too.

### What changed in React 19 (only if the codebase is on it — check `package.json`)

Don't reach for these unless you've confirmed the repo's React version. If it's React 18, the patterns above are still the right answer.

- **Async `startTransition`** — pass an async function; `isPending` stays true for its whole duration. Useful for form submit + state update in one transition.
  ```jsx
  startTransition(async () => { await save(); setSaved(true); });
  ```
- **`useDeferredValue(value, initialValue)`** — second arg is what the hook returns on first render before the real value is available. Helps with SSR.
- **`useOptimistic`** — built-in optimistic state that auto-reverts when the wrapping transition resolves. Replaces a lot of hand-rolled rollback code.
  ```jsx
  const [optimisticName, setOptimisticName] = useOptimistic(name);
  ```

If you mention these in the interview, **say "if we're on React 19 — let me check the version"** rather than assuming.

---

## Premature optimization — the senior signal

The senior thing to say in an interview is:

> "I see this pattern that *could* cause re-renders, but I'd want to profile before optimizing — if it's not on the critical path, the memoization just adds complexity without benefit."

Or, when asked to optimize:

> "Before I add memo here, let me check if this component actually re-renders often, and whether each render is expensive enough to matter."

This is the inverse of what juniors do (memoize everything reflexively). It signals real production experience.

---

## Common perf bugs in brownfield React (memorize for scanning)

| Symptom | Cause | Fix |
|---|---|---|
| Every component re-renders on mouse move | Context value not memoized, mousemove in state | Memoize value; move to ref or local |
| Typing in input is laggy | Big subtree re-renders on every keystroke | Lift state to smaller component; useDeferredValue |
| List of 1000 items is slow | No virtualization | react-window |
| Page slow on filter change | filter not memoized; runs every render | useMemo |
| Image causes layout jump | Missing width/height | Set explicit dimensions |
| First load is 3MB JS | No code splitting; importing whole libs | React.lazy; per-import paths |
| Modal close re-renders entire grid | Modal state in shared context | Move modal state local or to separate context |
| Two fetches every navigation | No query cache | React Query / SWR |
| Hover effect causes scroll jank | CSS triggering reflow (top/left instead of transform) | Use `transform`, `will-change` |
| Animation drops frames | Heavy work on main thread during animation | Move work off-frame; use `requestIdleCallback` |

---

## Image and asset optimization

- Always specify `width` and `height` on `<img>` (prevents CLS).
- Use `loading="lazy"` for below-the-fold images.
- Modern formats: AVIF > WebP > JPEG/PNG.
- Use `<picture>` for responsive images.
- Next.js `<Image>` does most of this automatically — see doc 08.
- Inline SVG when small; reference external when reused (caching).
- Compress with `imagemin`, `squoosh`.

---

## CSS perf gotchas

- **Avoid layout-triggering properties in animations.** Animate `transform` and `opacity`, not `top`/`left`/`width`.
- **Avoid expensive selectors in big trees** — `*:hover`, deep descendant selectors. Rare modern bottleneck but still real on large DOMs.
- **Avoid `!important` cascades** that force the browser into slower style resolution.
- CSS-in-JS at runtime (styled-components, emotion) adds runtime cost vs. compile-time (linaria, vanilla-extract). Often negligible; profile before changing.

---

## Memory leaks — silent perf killers

Common sources:
- Subscriptions not cleaned up (`addEventListener` without remove).
- Timers not cleared (`setInterval` without `clearInterval`).
- Closures holding refs to large objects (a callback in a long-lived store referencing a huge array).
- Detached DOM nodes (held by JS but removed from document).

How to find: Chrome DevTools Memory tab → take heap snapshots before/after an action, compare.

---

## Quick interview talking points on perf

> "I'd profile first to see if this is actually a problem. Memoization isn't free."

> "Memoizing this won't help — the child isn't memoized, so it'll re-render anyway from the parent."

> "The cheapest win here is splitting the context — the modal state is causing the grid to re-render."

> "For a list this size, I'd reach for virtualization rather than micro-optimizing each row."

Next: `06-resilience.md`.
