# 06 — Resilience: Error Boundaries, Retries, Timeouts, UX States

> The interview brief explicitly calls out "timeouts" and "error boundaries." Resilience is a top senior signal — production code is judged on what happens when things go wrong, not on the happy path. If you only fix the bug, you're junior. If you also handle "what if this fails twice," you're senior.

---

## The four UI states every async UI must handle

For every component that fetches data, there are four states. **If your component handles only the success case, you have three bugs.**

1. **Loading** — request in flight, no data yet.
2. **Success** — data is here, but consider: is it empty?
3. **Empty** — request succeeded but returned nothing (`[]`, `null`). Often needs a different UI than "no data yet."
4. **Error** — request failed. Network, 4xx, 5xx, parse error.

**Anti-pattern in brownfield code:**
```jsx
function Users() {
  const [users, setUsers] = useState([]);
  useEffect(() => { fetch('/api').then(r => r.json()).then(setUsers); }, []);
  return <List items={users} />;
}
```

Failure modes:
- Network fails → silent. User sees empty list forever, no clue why.
- API returns `null` instead of `[]` → `users.map` crashes.
- API is slow → user stares at blank list, doesn't know if it's loading.
- API returns `[]` → user can't distinguish "no data" from "still loading."

**The 4-state shape:**

```jsx
function Users() {
  const [state, setState] = useState({ status: 'idle', data: null, error: null });

  useEffect(() => {
    setState({ status: 'loading', data: null, error: null });
    let cancelled = false;
    fetch('/api/users')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(data => { if (!cancelled) setState({ status: 'success', data, error: null }); })
      .catch(error => { if (!cancelled) setState({ status: 'error', data: null, error }); });
    return () => { cancelled = true; };
  }, []);

  if (state.status === 'loading') return <Spinner />;
  if (state.status === 'error')   return <ErrorView error={state.error} onRetry={retry} />;
  if (!state.data?.length)        return <EmptyState />;
  return <List items={state.data} />;
}
```

The status field is a discriminated union. It eliminates impossible states (you can't have both `data` and `error` populated simultaneously).

Better: use React Query / SWR — they give you this shape out of the box plus caching, dedup, retry, refetch.

---

## Error boundaries — what they do and don't catch

Error boundaries are React's mechanism for catching render-time errors in a subtree and showing a fallback UI instead of unmounting the whole app.

### What they catch
- Errors during rendering.
- Errors in lifecycle methods.
- Errors in constructors of child components.

### What they DO NOT catch
- Event handlers (`onClick` throws → not caught).
- Async code (`setTimeout`, promises). The fetch rejection above will NOT trigger an error boundary.
- Server-side rendering (in Next.js, server errors have a separate `error.tsx` mechanism).
- Errors in the error boundary itself.

### The pattern

```jsx
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    logToService(error, info); // send to Sentry / Datadog / your logger
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? <DefaultFallback />;
    }
    return this.props.children;
  }
}
```

Modern alternative: `react-error-boundary` package — a more ergonomic wrapper around the same primitive.

```jsx
import { ErrorBoundary } from 'react-error-boundary';

<ErrorBoundary FallbackComponent={Fallback} onReset={refetch} resetKeys={[userId]}>
  <UserProfile userId={userId} />
</ErrorBoundary>
```

### Where to place them

- **Global** — one at the app root. Catches everything. Shows a "something went wrong" page.
- **Route level** — at each route. A failed page doesn't kill the shell.
- **Widget level** — around a non-critical widget (sidebar, comments). The main flow keeps working.

Brownfield code typically has zero or one (global). Adding route-level or widget-level boundaries is a senior-tier improvement.

### Logging from error boundaries

`componentDidCatch` is where you ship errors to your error tracking. Include:
- The error stack.
- Component stack from `info.componentStack`.
- User id, session id, route.
- Build version.

---

## Timeouts on network requests

The `fetch` API has **no default timeout**. A request can hang forever (or until the OS/browser gives up — minutes).

### The pattern

```js
async function fetchWithTimeout(url, opts = {}, ms = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  try {
    const r = await fetch(url, { ...opts, signal: controller.signal });
    return r;
  } finally {
    clearTimeout(id);
  }
}
```

### Pick the right timeout for the use case

- Health check / autocomplete: 2-3s
- User-initiated action: 5-10s
- Background sync: 30s
- Long upload: longer or chunk-based

**Senior signal:** different timeouts for different operations. A blanket 30s timeout on autocomplete makes autocomplete feel broken.

---

## Retry strategy

Naive retry:
```js
async function retry(fn, attempts = 3) {
  for (let i = 0; i < attempts; i++) {
    try { return await fn(); } catch (e) { if (i === attempts - 1) throw e; }
  }
}
```

Three problems:
1. **No backoff** — hammers the server, makes outages worse.
2. **Retries non-idempotent operations** — POSTing twice can double-charge a credit card.
3. **Retries non-recoverable errors** — 4xx errors (auth, validation) won't get better.

### Better retry

```js
async function retry(fn, { attempts = 3, baseMs = 500, isRetryable } = {}) {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i === attempts - 1) throw e;
      if (isRetryable && !isRetryable(e)) throw e;
      const jitter = Math.random() * baseMs;
      const delay = baseMs * 2 ** i + jitter;
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

// Only retry network / 5xx
function isRetryable(err) {
  if (err.name === 'TypeError') return true;  // network error
  if (err.status >= 500) return true;
  if (err.status === 429) return true;        // rate limited
  return false;
}
```

Key points:
- **Exponential backoff with jitter** — prevents thundering herd.
- **Only retry idempotent operations** — GETs, PUTs are safe; POSTs need idempotency keys.
- **Only retry recoverable errors** — 5xx, network, 429. Not 4xx.

### Idempotency keys

For non-idempotent POSTs that you want to retry safely:

```js
const idempotencyKey = crypto.randomUUID();
fetch('/api/charge', {
  method: 'POST',
  headers: { 'Idempotency-Key': idempotencyKey, ... },
  body: ...,
});
```

The server uses the key to dedupe. Stripe, Square, etc., use this pattern. If the brownfield codebase POSTs without idempotency, that's worth flagging.

---

## Race conditions in async UI (deep dive)

The classic bug from doc 03 — async response arrives after the input changed.

### Race scenario

```
t=0   user types 'a' → fetch('?q=a')
t=10  user types 'ab' → fetch('?q=ab')
t=50  '?q=ab' returns → setResults(['ab results'])
t=100 '?q=a' returns → setResults(['a results']) ❌ overwrites
```

User typed 'ab' but sees results for 'a'.

### Defense 1: AbortController

```jsx
useEffect(() => {
  const controller = new AbortController();
  fetch(`/search?q=${q}`, { signal: controller.signal })
    .then(r => r.json())
    .then(setResults)
    .catch(e => { if (e.name !== 'AbortError') console.error(e); });
  return () => controller.abort();
}, [q]);
```

Each new effect aborts the previous. The catch must ignore AbortError (it's not a real error).

### Defense 2: track the latest request

```jsx
const latest = useRef(0);
useEffect(() => {
  const id = ++latest.current;
  fetch(`/search?q=${q}`).then(r => r.json()).then(data => {
    if (id === latest.current) setResults(data);
  });
}, [q]);
```

Cheap if you can't easily abort (e.g., third-party SDK that returns a promise).

### Defense 3: use a query library
React Query / SWR handle this via "query key" — they automatically discard stale responses.

---

## Loading state UX patterns

- **Spinner** — universal but overused. For >1s waits.
- **Skeleton** — gray placeholder shapes that match the eventual layout. Better than spinner because no layout shift on load. Used by Linear, Github, Slack.
- **Optimistic UI** — show the expected result immediately; reconcile on response.
- **Suspense** — declarative loading boundaries. Pairs with data libraries that throw promises (React Query in suspense mode, Relay, Next App Router).

**Anti-pattern:** showing a spinner that flashes for 50ms because the data was cached. Better: delay-show pattern (only show spinner after 300ms).

```jsx
const [showSpinner, setShowSpinner] = useState(false);
useEffect(() => {
  if (!isLoading) return;
  const id = setTimeout(() => setShowSpinner(true), 300);
  return () => clearTimeout(id);
}, [isLoading]);
```

---

## Empty state UX

Don't show an empty list with no context. Show:
- "No users match your filter. Try clearing the search." + button.
- "You haven't added any items yet. [Add your first item]" — onboarding.
- Distinct from error: don't say "Something went wrong" when there's just no data.

---

## Optimistic UI — when to use, when not

Use for:
- High-confidence operations (like toggle, bookmark, drag-reorder).
- Operations where the user expects immediate feedback.
- Where rollback is harmless (just toggles back).

Don't use for:
- Operations with side effects beyond UI (payments, deletes that can't be undone).
- Operations whose result depends on server state the client can't compute.

Pattern: see doc 03 for the basic shape. Add explicit "saving" or "syncing" indicators so users see when something is actually persisted.

---

## Concurrency control: double-submit prevention

User clicks "Submit" twice — second click fires while first is in flight.

```jsx
const [submitting, setSubmitting] = useState(false);

async function handleSubmit() {
  if (submitting) return;
  setSubmitting(true);
  try {
    await api.submit(data);
  } finally {
    setSubmitting(false);
  }
}

<button disabled={submitting} onClick={handleSubmit}>
  {submitting ? 'Submitting...' : 'Submit'}
</button>
```

Belt and suspenders:
- Disable the button.
- Guard in the handler.
- Idempotency key on the server.

---

## Graceful degradation

What happens if a part of the page fails?
- Critical path (cart, checkout) must work.
- Nice-to-have widgets (recently viewed, ads) should fail silently.
- Surround non-critical widgets with their own error boundaries.

```jsx
<ErrorBoundary fallback={null}>
  <RecentlyViewedSidebar />
</ErrorBoundary>
```

If `RecentlyViewedSidebar` crashes, the rest of the page still works. The user doesn't see "Something went wrong" for a feature they don't care about.

---

## Offline / poor network

For real apps:
- Detect online/offline with `navigator.onLine` + `online`/`offline` events.
- Queue mutations when offline; replay on reconnect.
- Service workers for caching critical assets.
- Show a banner: "You're offline — changes will sync when you reconnect."

In a 60-minute interview you won't build this. Mentioning it as a future improvement is a senior signal.

---

## Logging and observability

When something fails, you need to know:
- **Who** — user id, session id.
- **What** — operation, parameters (sanitized — no passwords).
- **When** — timestamp, sequence relative to other events.
- **Where** — route, component, browser, OS.
- **Why** — error message, stack, response status.

```js
function logError(error, context = {}) {
  console.error(error, context);
  if (typeof window !== 'undefined' && window.errorTracker) {
    window.errorTracker.captureException(error, {
      extra: context,
      tags: { route: window.location.pathname },
    });
  }
}
```

In a brownfield codebase, look for:
- Catches that swallow errors (`catch (e) {}` or `catch (e) { console.log(e); }`).
- Errors with no context (just `error.message`).
- No central error tracker (Sentry, Datadog, Rollbar).

Flag every one of these.

---

## Resilience patterns checklist

For each change you make in Part 2, run through:

- [ ] What happens if the network is offline?
- [ ] What happens if the request times out?
- [ ] What happens if the server returns 500 / 503?
- [ ] What happens if the response is malformed JSON?
- [ ] What happens if the user double-clicks?
- [ ] What happens if the user navigates away mid-request?
- [ ] What happens if the data is empty (`[]`, `null`)?
- [ ] Is there an error boundary protecting this subtree?
- [ ] Are errors logged with enough context to debug in prod?
- [ ] Is there a way for the user to recover (retry button)?

You won't fix all of these. Mentioning them out loud is the point.

---

## Talking points

> "Before I add the feature, let me make sure the failure path is handled — right now this fetch has no error state, so if the API is down the user sees nothing."

> "I'd add an error boundary at the route level so a single bad request doesn't kill the rest of the app."

> "This timeout is set to 30s — that's fine for uploads but feels broken for autocomplete. I'd parameterize it."

> "I'd put an idempotency key on this POST so it's safe to retry — right now a retry on a network blip could double-submit."

Next: `07-testing.md`.
