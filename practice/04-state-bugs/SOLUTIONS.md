# SOLUTIONS — 04-state-bugs

## 01 — State mutation

**Bug:** `list.items.push(item)` and `list.title = ...` mutate the existing object/array. `setList(list)` passes the same reference. React bails out (Object.is is true) → no re-render.

**Fix:**
```jsx
function addItem(item) {
  setList(prev => ({ ...prev, items: [...prev.items, item] }));
}

function renameTitle(newTitle) {
  setList(prev => ({ ...prev, title: newTitle }));
}
```

**Secondary bug — `key={idx}`:** if a user adds/removes/reorders items, React reuses DOM by index. Today the list is append-only so it works, but it's a footgun. Use stable ids:
```jsx
const [list, setList] = useState({
  items: [{ id: 'a', text: 'apples' }, ...],
});
```

**Deep state — Immer:**
```jsx
import { produce } from 'immer';
setList(produce(draft => {
  draft.items.push({ id: '...', text: item });
}));
```
You "mutate" the draft; Immer produces a new immutable state. Built into Redux Toolkit.

---

## 02 — Server state in Context

(Covered in the file's comment.) Recap:

**Minimal in-place fix:**
```jsx
const [state, dispatch] = useReducer(reducer, {
  users: { status: 'idle', data: [], error: null },
  posts: { status: 'idle', data: [], error: null },
});

useEffect(() => {
  let cancelled = false;
  dispatch({ type: 'USERS_LOADING' });
  fetch('/api/users')
    .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
    .then(data => { if (!cancelled) dispatch({ type: 'USERS_SUCCESS', data }); })
    .catch(error => { if (!cancelled) dispatch({ type: 'USERS_ERROR', error }); });
  return () => { cancelled = true; };
}, []);

const value = useMemo(() => ({ ...state, refetch... }), [state]);
```

**Better (React Query):**
```jsx
const { data: users, isLoading, error, refetch } = useQuery({
  queryKey: ['users'],
  queryFn: () => fetch('/api/users').then(r => { if (!r.ok) throw new Error(...); return r.json(); }),
});

const addUser = useMutation({
  mutationFn: (user) => fetch('/api/users', { method: 'POST', body: JSON.stringify(user) }).then(r => r.json()),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
});
```

Gets you: caching, dedup, refetch on focus, retry, optimistic updates, devtools.

**Interview phrasing:**
> "This Context is doing server-state badly — no loading/error/cache/retry/dedup. In-place I'd refactor to a status-shaped reducer; bigger picture I'd adopt React Query to retire this entire pattern."

---

## 03 — localStorage in SSR

**Crashes on server:** `localStorage` is a browser global. SSR runtimes don't define it. The `useState(initial)` call evaluates `localStorage.getItem(...)` synchronously during render.

**Fix A — typeof guard:**
```jsx
const [theme, setTheme] = useState(() =>
  typeof window !== 'undefined' ? localStorage.getItem('theme') ?? 'light' : 'light'
);
```
Works. Now server renders 'light'. If user's stored theme is 'dark', they see a flash.

**Fix B — effect hydration:**
```jsx
const [theme, setTheme] = useState('light');
useEffect(() => {
  setTheme(localStorage.getItem('theme') ?? 'light');
}, []);
```
Always renders 'light' on server and first client paint, then swaps. Flicker.

**Fix C — cookie:**
Server reads cookie → renders correct theme into HTML. No flicker. Requires cookie sync on theme change.

**Fix D — inline script (no flicker for client-only theme):**
```html
<head>
<script>
(function () {
  var t = localStorage.getItem('theme') || 'light';
  document.documentElement.dataset.theme = t;
})();
</script>
</head>
```
Run before React hydrates. Sets a data attr that CSS uses. React's `useState('light')` is fine because CSS already applied dark.

**Hydration mismatch:** server says `<button>Theme: light</button>`, client first render says `<button>Theme: dark</button>` (because storage). React warns. Avoid by deferring the read to useEffect (fix B) — the first client render matches the server output.

---

## 04 — State derived from prop

**Bug:** `useState(initialValue)` only uses `initialValue` on first render. Later prop changes don't reset state.

**Fix A — useEffect resets:**
```jsx
useEffect(() => { setValue(initialValue); }, [initialValue]);
```
Risk: if `initialValue` is recreated each parent render (`user.name + ''`), this wipes the user's in-progress edits.

**Fix B — key prop (preferred for "reset on identity change"):**
```jsx
<EditField key={user.id} initialValue={user.name} onSave={save} />
```
React unmounts/remounts when key changes → fresh state. Idiomatic.

**Fix C — fully controlled:**
```jsx
export function EditField({ value, onChange, onSave }) {
  return (
    <div>
      <input value={value} onChange={(e) => onChange(e.target.value)} />
      <button onClick={onSave}>Save</button>
    </div>
  );
}
```
Parent owns the state. No internal `useState`.

**Best for interview:** B for "reset on user-id change," C for "I want the parent to know the in-progress value."

---

## 05 — Reducer bugs

**Bug 1:** `LOAD_START` mutates. Same ref → no re-render. Fix: `return { ...state, loading: true, error: null };`

**Bug 2:** `LOAD_SUCCESS` returns `{ items, loading: false }` — loses `selectedId` and `error`. Fix: `return { ...state, items: action.items, loading: false, error: null };`

**Bug 3:** `ADD_ITEM` mutates `state.items.push`. Even though it spreads at the top, the array itself is mutated. Selectors that did `Object.is` on `state.items` get fooled (same ref). Memoized children pass-thru'd.
Fix: `return { ...state, items: [...state.items, action.item] };`

**Bug 4:** `default` returns same state — typos silently no-op. Prefer `throw new Error('Unknown action: ' + action.type)` in dev (or just trust TS).

**Bug 5:** No types. Use a discriminated union:
```ts
type Action =
  | { type: 'LOAD_START' }
  | { type: 'LOAD_SUCCESS'; items: Item[] }
  | { type: 'LOAD_ERROR'; error: Error }
  | { type: 'SELECT'; id: string }
  | { type: 'ADD_ITEM'; item: Item };
```

**Cleaned up:**
```jsx
function reducer(state, action) {
  switch (action.type) {
    case 'LOAD_START':   return { ...state, loading: true, error: null };
    case 'LOAD_SUCCESS': return { ...state, items: action.items, loading: false, error: null };
    case 'LOAD_ERROR':   return { ...state, error: action.error, loading: false };
    case 'SELECT':       return { ...state, selectedId: action.id };
    case 'ADD_ITEM':     return { ...state, items: [...state.items, action.item] };
    default:             return state;
  }
}
```

**Immer / RTK:** if reducers grow, Immer lets you "mutate" safely:
```js
import { produce } from 'immer';
const reducer = produce((draft, action) => {
  switch (action.type) {
    case 'ADD_ITEM': draft.items.push(action.item); break;
  }
});
```
RTK's `createSlice` bundles this + action creators + types.

---

Next: `05-async-resilience/`.
