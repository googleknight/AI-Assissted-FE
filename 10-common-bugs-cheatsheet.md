# 10 — Common Bugs Cheatsheet (Fast Scan List)

> A condensed, scanable list of bugs you should be able to spot in under 30 seconds each. Re-read this 20 minutes before the interview.

---

## React: useEffect

```jsx
// ❌ Empty deps but uses `count`
useEffect(() => setCount(count + 1), []);
// → stale closure; fix: functional update or correct deps

// ❌ Object dep recreated each render
useEffect(() => fetch(opts.url), [opts]);
// → fires every render; fix: depend on primitives or useMemo opts

// ❌ Missing dependency
useEffect(() => doX(value), []);
// → eslint react-hooks/exhaustive-deps; fix: add value or refactor

// ❌ No cleanup on subscription
useEffect(() => { window.addEventListener('resize', h); }, []);
// → leak / multiple handlers; fix: return remove

// ❌ setState during render
function C() { setX(1); return <div>{x}</div>; }
// → infinite loop

// ❌ Effect fetch with no cleanup → stale response overwrites
useEffect(() => { fetch(...).then(setData); }, [id]);
// → race condition; fix: AbortController or ignore-stale flag

// ❌ Conditional hook
if (cond) useEffect(...);
// → Rules of Hooks violation
```

---

## React: state

```jsx
// ❌ Initial value computed every render
useState(expensive());
// → fix: useState(() => expensive())

// ❌ Two updaters reading stale state
setCount(count + 1); setCount(count + 1);
// → only +1; fix: setCount(c => c + 1)

// ❌ Storing derived data
const [items, setItems] = useState([]);
const [count, setCount] = useState(0); // count === items.length
// → fix: derive inline

// ❌ Mutating state
state.items.push(x); setState(state);
// → no re-render (same ref); fix: setState({...state, items: [...state.items, x]})
```

---

## React: rendering / reconciliation

```jsx
// ❌ List without key
items.map(x => <Item value={x} />)
// → React warning; fix: key={x.id}

// ❌ key={index} on mutable list
items.map((x, i) => <Item key={i} {...x} />)
// → state leaks across reorders / deletions

// ❌ The `&&` zero trap
{items.length && <List />}
// → renders literal "0"; fix: items.length > 0

// ❌ Inline object/array/function props on memo'd children
<Child onClick={() => x()} style={{margin: 1}} />
// → defeats memo; fix: useCallback / useMemo / hoist

// ❌ Context value not memoized
<Ctx.Provider value={{ user, theme }}>
// → every consumer re-renders every render; fix: useMemo

// ❌ Modal mount/unmount destroying state
{isOpen && <Modal />}
// → state resets each open; fix: lift state or keep mounted

// ❌ Unstable component identity
function Parent() {
  const Inner = () => <div/>; // ❌ new component each render
  return <Inner />;
}
// → remounts every render
```

---

## Async / network

```js
// ❌ No timeout
fetch('/api'); // → hangs forever on bad network

// ❌ No error handling
fetch('/api').then(r => r.json()).then(setData);
// → silent failure on network error

// ❌ Doesn't check r.ok
fetch('/api').then(r => r.json());
// → 500 returns JSON error; you treat it as success

// ❌ Race condition
useEffect(() => { fetch(`/u/${id}`).then(setData); }, [id]);
// → stale response can overwrite fresh; fix: AbortController

// ❌ Naive retry on POST
async function r() { for(...) try return post(); catch... }
// → double-submit; fix: idempotency key + only retry on retriable

// ❌ JSON.parse without try
JSON.parse(localStorage.getItem('x'));
// → throws on null/corrupted; wrap in try/catch
```

---

## Security (XSS hit list)

```jsx
// ❌ dangerouslySetInnerHTML with user content
<div dangerouslySetInnerHTML={{__html: user.bio}} />
// → stored XSS; sanitize with DOMPurify

// ❌ v-html with user content
<div v-html="userBio" />
// → same

// ❌ innerHTML assignment
el.innerHTML = userText; // same risk

// ❌ Dynamic href without validation
<a href={user.url}> // javascript: protocol XSS

// ❌ Token in localStorage
localStorage.setItem('token', jwt); // exfilable via XSS

// ❌ Secret in NEXT_PUBLIC_*
NEXT_PUBLIC_API_KEY=sk_... // ships to client

// ❌ JSON in <script> without escape
<script>{`window.__DATA = ${JSON.stringify(d)}`}</script>
// → </script> in value breaks out

// ❌ eval / new Function / setTimeout(string)
eval(userInput); setTimeout(userInput, 0); // all eval
```

---

## Performance

```jsx
// ❌ Lodash full import
import _ from 'lodash'; // → 70KB
// fix: import debounce from 'lodash/debounce'

// ❌ Unmemoized derived value
const sorted = items.sort(); // sort every render, mutates items!
// fix: const sorted = useMemo(() => [...items].sort(), [items]);

// ❌ Large list, no virtualization
items.map(... over 1000 items)
// fix: react-window

// ❌ Synchronous expensive work in render
const fib = computeFib(40);
// fix: web worker / useDeferredValue / memo

// ❌ Image without dimensions
<img src="hero.jpg" />
// → CLS; fix: width + height

// ❌ Monolithic context
<Ctx.Provider value={{user, posts, theme, modals}}>
// → unrelated updates re-render everything
// fix: split contexts or use store with selectors

// ❌ Filter recomputed every keystroke
const visible = items.filter(i => i.name.includes(q));
// fix: useDeferredValue(q) + useMemo
```

---

## Accessibility

```jsx
// ❌ div as button
<div onClick={...}>Save</div>
// → not keyboard accessible; fix: <button>

// ❌ Missing alt
<img src="logo.png" />
// fix: alt="..." (use "" if decorative)

// ❌ Input without label
<input type="text" />
// fix: <label>Name <input /></label> or htmlFor

// ❌ Color-only signal
<span style={{color: 'red'}}>Error</span>
// fix: also include icon or text "Error:"

// ❌ Modal without focus trap
// → tab navigates to elements behind the modal

// ❌ Custom widget without ARIA
<div role="button"> // need aria-pressed if toggle, etc.
```

---

## TypeScript / JavaScript gotchas

```ts
// ❌ any escape hatch
function f(x: any) { ... }
// → loses type safety; fix: unknown + narrow

// ❌ Type assertion lying
const u = data as User;
// → not validated; runtime may be different; fix: Zod / parse / guard

// ❌ Non-null assertion masking bugs
const x = maybeNull!;
// → crash at runtime; fix: handle null

// ❌ Empty object type
function f(x: {}) {} // matches anything non-null/undefined, not "empty"
// fix: use Record<string, never> or unknown

// JS coercion bugs:
'2' + 1   // '21' (string concat)
'2' - 1   // 1 (numeric)
[] + []   // '' (both ToString)
[] + {}   // '[object Object]'
true + 1  // 2
null + 1  // 1
undefined + 1 // NaN

// Date pitfalls
new Date('2026-05-15') // UTC midnight, may be previous day in negative TZ
new Date('05/15/2026') // browser-dependent parsing — avoid

// Number pitfalls
0.1 + 0.2 === 0.3 // false → use cents/integers for money
Number('')        // 0 (not NaN!) — common form-validation bug
parseInt('10', 8) // 8 (octal) — always pass radix: parseInt('10', 10)
```

---

## Forms

```jsx
// ❌ Controlled input without onChange
<input value={x} />
// → readonly, React warns

// ❌ Validation on every keystroke shows errors before user finishes
<input onChange={e => validate(e.target.value)} />
// fix: validate on blur or submit

// ❌ Trusting client validation
<input required minLength={8} />
// → must also validate server-side

// ❌ Double-submit
<button onClick={handleSubmit}>Submit</button>
// → user clicks twice; fix: disabled state + idempotency
```

---

## Routing / navigation

```jsx
// ❌ <a href> for internal nav (full page reload)
<a href="/users">Users</a>
// fix: <Link to="/users"> or Next <Link>

// ❌ Push state in render
useEffect(() => { history.push('/x'); }); // no deps → infinite loop

// ❌ Window.location for SPA nav
window.location = '/users'; // full reload

// ❌ Unguarded route
<Route path="/admin" element={<Admin />} />
// → no auth check; fix: wrap in <RequireAuth>
```

---

## Memory / cleanup

```jsx
// ❌ Long timer without cleanup
useEffect(() => { setInterval(tick, 1000); }, []);

// ❌ Event listener without remove
useEffect(() => { window.addEventListener('scroll', h); }, []);

// ❌ Subscription without unsubscribe
useEffect(() => { source.subscribe(h); }, []);

// ❌ Fetch without abort + setState after unmount
// → "Can't perform setState on unmounted component" warning
```

---

## Logging / observability

```js
// ❌ Swallowed errors
try { ... } catch (e) {}
// → silent failure; fix: log at minimum

// ❌ Errors without context
console.error(e.message);
// fix: log error + relevant state (userId, route, request id)

// ❌ console.log left in code
console.log('debug', data); // → noisy in prod
```

---

## Next.js specific

```jsx
// ❌ localStorage during render in server component
const theme = localStorage.getItem('theme'); // SSR crash

// ❌ Date during render
<span>{new Date().toLocaleString()}</span> // hydration mismatch

// ❌ Math.random in render
<div id={Math.random()} /> // hydration mismatch

// ❌ Secret in NEXT_PUBLIC_*
NEXT_PUBLIC_DB_PASSWORD=... // public bundle

// ❌ <img> instead of next/image
<img src="..." width="..." /> // missing optimization

// ❌ getServerSideProps used unnecessarily
// → could be SSG; site fully dynamic where it doesn't need to be

// ❌ No revalidation after mutation
// → stale data in cache after form submit
```

---

## Vue specific

```vue
<!-- ❌ Destructured reactive loses reactivity -->
<script setup>
const state = reactive({ x: 0 });
const { x } = state; // ❌ x is no longer reactive
</script>

<!-- ❌ Watching reactive shallowly -->
watch(state, fn) // → only on assignment, not nested mutations
// fix: { deep: true } or watch(() => state.x, fn)

<!-- ❌ v-html with user content -->
<div v-html="userBio" />
// → XSS

<!-- ❌ v-for without key -->
<li v-for="i in items">{{ i }}</li>

<!-- ❌ ref forgot .value in JS -->
const c = ref(0); c++; // ❌ no-op; c.value++
```

---

## CSS

```css
/* ❌ Animating layout properties */
.box { transition: top 0.2s; } /* causes reflow */
/* fix: animate transform */

/* ❌ z-index without context */
.modal { z-index: 9999; } /* doesn't help if parent has stacking */

/* ❌ Vague units */
font-size: 14px; /* doesn't scale with user prefs; use rem */

/* ❌ Hardcoded breakpoints inconsistent across files */
@media (max-width: 768px) /* and elsewhere 800px, 700px... */
```

---

## The 60-second scan order (when you open a file)

Run through the file with these mental queries in this order:

1. `useEffect` — deps array, cleanup, fetch
2. `useState` — initial values, derived state
3. `dangerouslySetInnerHTML` / `v-html`
4. `.map(` — keys
5. `fetch(` / `axios(` — timeout, error, abort
6. Event handlers — inline objects/functions on memoized children
7. `<a href` / `<img src` — dynamic, validated
8. `localStorage` — tokens, JSON parse safety
9. Forms — controlled/uncontrolled, validation, double submit
10. Context provider — value memoized? monolithic?

This sequence finds 80% of bugs in a typical React file in 60 seconds.

---

## What to add to your scratchpad as you scan

For each bug, write the WWIF in your scratchpad:

```
[file:line] ISSUE-TYPE — short description
  Impact: who breaks, how bad
  Fix: one-liner
```

Example:
```
UserProfile.tsx:42  XSS — dangerouslySetInnerHTML on user.bio
  Impact: stored XSS; attacker can run JS in every viewer's session
  Fix: sanitize with DOMPurify, or render as text

UserList.tsx:15  RACE — fetch on id change, no abort
  Impact: prior user's data can overwrite current
  Fix: AbortController in cleanup

App.tsx:80  PERF — Provider value not memoized
  Impact: every consumer re-renders on every parent render
  Fix: useMemo({user, theme}, [user, theme])
```

The scratchpad IS the artifact you present to the interviewer in Part 1.

Next: `11-ai-strategy-antigravity.md`.
