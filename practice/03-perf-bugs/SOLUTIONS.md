# SOLUTIONS — 03-perf-bugs

## 01 — Inline props defeat memo

**Three unstable props:**
1. `onSelect={(id) => setSelectedId(id)}` — new fn each render.
2. `style={{ background: ... }}` — new object each render.
3. `item` — stable IF the parent passes the same array ref; rebuild it and you re-render all rows.

**Fix:**
```jsx
const handleSelect = useCallback((id) => setSelectedId(id), []);

// hoist style maker or include selectedId in Row so it computes its own
const Row = memo(function Row({ item, isSelected, onSelect }) {
  const style = useMemo(() => ({ background: isSelected ? 'yellow' : 'white' }), [isSelected]);
  return <li style={style} onClick={() => onSelect(item.id)}>{item.name}</li>;
});

{items.map((item) => (
  <Row key={item.id} item={item} isSelected={item.id === selectedId} onSelect={handleSelect} />
))}
```

**Is memo worth it for a small list?** No — overhead > savings for <100 items where each render is cheap. Memo pays off when rows are expensive (subtrees, formatting) or list is large.

---

## 02 — Filter recomputed every keystroke

**Causes:**
1. `expensiveScore` runs on every item every keystroke (`5000 * scoring`).
2. Sort runs on the full result.
3. React renders synchronously, so input remains "stuck" until done.

**Fix A — useMemo:**
```jsx
const ranked = useMemo(() =>
  items.map(item => ({ ...item, score: expensiveScore(item, query) }))
       .sort((a, b) => b.score - a.score)
       .slice(0, 100),
  [items, query]
);
```
Only helps if you re-render for OTHER reasons. Here `query` is itself a dep, so every keystroke still recomputes.

**Fix B — useDeferredValue:**
```jsx
const deferredQuery = useDeferredValue(query);
const ranked = useMemo(() => /* ... uses deferredQuery */, [items, deferredQuery]);
```
The input stays responsive (uses `query`). The expensive list uses the lagging `deferredQuery`, so it can be interrupted.

**Fix C — useTransition:**
```jsx
const [isPending, startTransition] = useTransition();
const [filter, setFilter] = useState('');

const onChange = e => {
  const v = e.target.value;
  setQuery(v); // urgent — input stays responsive
  startTransition(() => setFilter(v)); // non-urgent
};
```
Then compute based on `filter` not `query`. Same effect as useDeferredValue but more explicit.

**Fix D — Web Worker:**
Offload `expensiveScore` to a worker. Necessary for genuinely heavy work (image processing); overkill here.

**Virtualization for 100 rendered items?** Marginal — virt helps with large DOM. 100 is fine; the bottleneck is scoring. Combine with B/C for max effect.

---

## 03 — Large list no virtualization

**Why it freezes:** 10,000 `<tr>` + 50,000 `<td>` + 10,000 `<img>` = huge DOM. Style recalc, layout, paint all linear in element count.

**Additional bugs:**
1. `new Date().toLocaleString()` per row — 10k Date constructions on every render. Memoize or precompute.
2. `<img>` without dimensions — every image causes reflow as it loads.

**Fix sketch (TanStack Virtual is the modern choice for tables):**
```jsx
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';

function UserTable({ users }) {
  const parentRef = useRef();
  const rowVirtualizer = useVirtualizer({
    count: users.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
    overscan: 10,
  });
  return (
    <div ref={parentRef} style={{ height: 500, overflow: 'auto' }}>
      <div style={{ height: rowVirtualizer.getTotalSize(), position: 'relative' }}>
        {rowVirtualizer.getVirtualItems().map(v => (
          <div key={v.index} style={{
            position: 'absolute', top: 0, left: 0, transform: `translateY(${v.start}px)`,
            height: v.size, width: '100%',
          }}>
            <Row user={users[v.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Tables vs lists:** virtual tables are trickier because `<thead>` must stick, column widths must align across rows, and `<tr>` semantics fight absolute positioning. Use a library like TanStack Table + Virtual.

**Variable heights:** use `estimateSize` + `measureElement` ref callback to actual-measure. TanStack supports it.

---

## 04 — Monolithic context

**Why DataGrid re-renders on modal open:** `setModal` updates `modal` → AppProvider re-renders → `value` object is new → every consumer re-renders, including DataGrid (which doesn't even read `modal`).

**Fix A — useMemo on value:** Doesn't help much here. Every state update triggers a Provider render and the memo deps change too.

**Fix B — split contexts:**
```jsx
<UserContext.Provider value={userValue}>
  <DataContext.Provider value={dataValue}>
    <ModalContext.Provider value={modalValue}>
      <NotificationContext.Provider value={notifValue}>
        <ThemeContext.Provider value={themeValue}>
          {children}
```
DataGrid only consumes DataContext. Opening a modal doesn't change DataContext's value → DataGrid skips.

**Fix C — Zustand:**
```jsx
const useStore = create((set) => ({
  user: null, data: [], modal: null, ...
  setModal: (m) => set({ modal: m }),
}));

function DataGrid() {
  const data = useStore(s => s.data); // selector — subscribes only to `data`
  return <div>{data.length}</div>;
}
```
Selectors give per-slice subscriptions with one provider.

**Brownfield choice:** if you already have context, splitting is least invasive. If you're allowed to add a dep, Zustand is more ergonomic at scale.

---

## 05 — Lodash and bundle

| Line | Issue | Fix |
|---|---|---|
| 1 | `import _ from 'lodash'` — full lib | `import uniq from 'lodash/uniq'` (or native: `[...new Set(arr)]`) |
| 2 | `import * as MUI` — tree-shaking fragile | `import Button from '@mui/material/Button'` (deep path) |
| 3 | moment — bloat | swap to `dayjs` (2KB) or `date-fns` (tree-shaken) |
| 4 | date-fns `format` — fine if bundler tree-shakes | verify with bundle analyzer |
| 5 | chart.js named imports — fine; lazy load chart route | `const Chart = lazy(() => import('./Chart'))` |
| 6 | Sentry eager — heavy on initial bundle | `Sentry.lazyLoad()` or split via dynamic import |
| 7 | uuid — small (~1KB) | OK; can use `crypto.randomUUID()` natively if you support modern browsers |

**Barrel file:** an `index.js` that re-exports many things. Bundlers may struggle to drop unused exports if the barrel is non-trivial (side-effectful). Deep imports avoid this.

**Verify:** run `npm run build` → `webpack-bundle-analyzer` / `vite-bundle-visualizer` / `source-map-explorer`. Compare before/after.

---

## 06 — Images / CLS

**Hero:**
```jsx
<img
  src={product.heroImage}
  alt={product.name}
  width={1200}
  height={600}
  loading="eager"
  fetchPriority="high"
/>
```
And in `<head>`:
```html
<link rel="preload" as="image" href={product.heroImage} />
```

**Gallery:**
```jsx
<img
  src={src}
  alt=""
  width={200}
  height={200}
  loading="lazy"
  decoding="async"
/>
```

For responsive:
```jsx
<img
  src={src}
  srcSet={`${src}?w=200 200w, ${src}?w=400 400w`}
  sizes="(max-width: 600px) 200px, 400px"
/>
```

**Logo:**
```jsx
<img className="logo" src="/brand-logo.svg" alt="Brand" width={120} height={32} />
```
Or inline if reused as icon set.

**Next.js `<Image>`:** auto resize / format negotiation / blur placeholder / lazy load / required width/height to prevent CLS.

---

Done. Next: `04-state-bugs/`.
