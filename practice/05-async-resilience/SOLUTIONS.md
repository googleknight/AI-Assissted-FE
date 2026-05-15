# SOLUTIONS — 05-async-resilience

## 01 — fetchWithTimeout + safeFetch

```js
export async function fetchWithTimeout(url, opts = {}, ms = 8000) {
  const controller = new AbortController();
  const signal = opts.signal
    ? mergeSignals(opts.signal, controller.signal)
    : controller.signal;
  const id = setTimeout(() => controller.abort(new DOMException('Timeout', 'TimeoutError')), ms);
  try {
    return await fetch(url, { ...opts, signal });
  } finally {
    clearTimeout(id);
  }
}

function mergeSignals(a, b) {
  // simple form; modern browsers have AbortSignal.any([a, b])
  if (typeof AbortSignal !== 'undefined' && AbortSignal.any) return AbortSignal.any([a, b]);
  const c = new AbortController();
  const onAbort = () => c.abort();
  a.addEventListener('abort', onAbort);
  b.addEventListener('abort', onAbort);
  return c.signal;
}

function isRetryable(err, res) {
  if (err?.name === 'TypeError') return true;          // network failure
  if (err?.name === 'TimeoutError') return true;
  if (res?.status >= 500) return true;
  if (res?.status === 429) return true;                // rate limited
  return false;
}

export async function safeFetch(url, opts = {}, { timeoutMs = 8000, retries = 2, baseMs = 300 } = {}) {
  const isSafeMethod = !opts.method || ['GET', 'HEAD', 'PUT', 'DELETE'].includes(opts.method.toUpperCase());
  let attempt = 0;
  while (true) {
    try {
      const res = await fetchWithTimeout(url, opts, timeoutMs);
      if (!res.ok) {
        if (isSafeMethod && isRetryable(null, res) && attempt < retries) {
          await sleep(baseMs * 2 ** attempt + Math.random() * baseMs);
          attempt++;
          continue;
        }
        throw new HttpError(res.status, await res.text());
      }
      return res;
    } catch (err) {
      if (err.name === 'AbortError' && !err.message?.includes('Timeout')) throw err; // user-cancelled
      if (isSafeMethod && isRetryable(err) && attempt < retries) {
        await sleep(baseMs * 2 ** attempt + Math.random() * baseMs);
        attempt++;
        continue;
      }
      throw err;
    }
  }
}

class HttpError extends Error {
  constructor(status, body) { super(`HTTP ${status}: ${body.slice(0, 200)}`); this.status = status; }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
```

Key points: timer cleanup in `finally`; never retry POST/PATCH without idempotency keys; backoff + jitter; preserve user-initiated aborts.

---

## 02 — Double submit

**Why double-clicks charge twice:**
1. Two clicks → two POSTs to `/api/payments`.
2. No client guard; backend has no idempotency check.
3. Two payment records created.

**Combined fix:**
```jsx
import { useRef, useState } from 'react';

export function CheckoutButton({ cartId, total }) {
  const [submitting, setSubmitting] = useState(false);
  const idempotencyKey = useRef(crypto.randomUUID());

  async function handlePay() {
    if (submitting) return; // belt
    setSubmitting(true);
    try {
      const r = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey.current, // suspenders
        },
        body: JSON.stringify({ cartId, total }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      window.location.assign(`/receipt/${data.id}`);
    } catch (e) {
      setSubmitting(false); // allow retry on error
      // show error toast
    }
  }

  return (
    <button onClick={handlePay} disabled={submitting}>
      {submitting ? 'Processing...' : `Pay $${total}`}
    </button>
  );
}
```

Why all three:
- Disabled button: stops double-clicks reaching the handler.
- `submitting` guard: defense if the button isn't disabled fast enough (race between click batches).
- Idempotency key: server-side defense if network blip causes legitimate retry.

**Enter-key in form:** if it's a `<form onSubmit>`, the form fires submit; the button isn't directly clicked. Disable the form OR set `submitting` and `e.preventDefault()` early.

---

## 03 — Error boundaries

```jsx
class ErrorBoundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught', error, info);
    // send to Sentry/Datadog with info.componentStack
  }
  render() {
    if (this.state.error) {
      const Fallback = this.props.fallback ?? (() => <div>Something went wrong</div>);
      return <Fallback error={this.state.error} reset={() => this.setState({ error: null })} />;
    }
    return this.props.children;
  }
}

function Sidebar() {
  return (
    <aside>
      <ErrorBoundary fallback={() => null /* silently hide */}><UserBadge /></ErrorBoundary>
      <ErrorBoundary fallback={() => <div>Notifications unavailable</div>}><NotificationsWidget /></ErrorBoundary>
      <ErrorBoundary fallback={() => null}><RecentActivity /></ErrorBoundary>
    </aside>
  );
}
```

**Where it throws:** first render, `data` is `null`. `null.map(...)` throws synchronously during render → boundary catches.

**Fix the widget itself too:**
```jsx
function NotificationsWidget() {
  const [state, setState] = useState({ status: 'loading' });
  useEffect(() => {
    fetch('/api/notifications')
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(json => setState({ status: 'success', data: Array.isArray(json) ? json : (json.items ?? []) }))
      .catch(error => setState({ status: 'error', error }));
  }, []);

  if (state.status === 'loading') return <Skeleton />;
  if (state.status === 'error') return <div>Could not load notifications</div>;
  if (!state.data.length) return <div>No notifications</div>;
  return <ul>{state.data.map(n => <li key={n.id}>{n.text}</li>)}</ul>;
}
```

**Async error → boundary:**
```jsx
function useErrorBoundary() {
  const [, setState] = useState();
  return (err) => setState(() => { throw err; });
}
// usage: in a catch, call throwIt(err) → next render throws → boundary catches.
```

`react-error-boundary` ships `useErrorHandler` for this. Use it.

---

## 04 — Four states

```jsx
import { useEffect, useState, useCallback } from 'react';

export function useFetch(url, { timeoutMs = 8000, retries = 1 } = {}) {
  const [state, setState] = useState({ status: 'idle', data: null, error: null });

  const run = useCallback((signal) => {
    setState({ status: 'loading', data: null, error: null });
    safeFetch(url, { signal }, { timeoutMs, retries })
      .then(r => r.json())
      .then(data => setState({ status: 'success', data, error: null }))
      .catch(error => {
        if (error.name !== 'AbortError') setState({ status: 'error', data: null, error });
      });
  }, [url, timeoutMs, retries]);

  useEffect(() => {
    const c = new AbortController();
    run(c.signal);
    return () => c.abort();
  }, [run]);

  const refetch = useCallback(() => run(), [run]);
  return { ...state, refetch };
}

export function SearchResults({ query }) {
  const { status, data, error, refetch } = useFetch(`/api/search?q=${encodeURIComponent(query)}`);

  if (status === 'loading' || status === 'idle') return <Skeleton />;
  if (status === 'error') return (
    <div role="alert">
      Could not load results: {error.message}
      <button onClick={refetch}>Retry</button>
    </div>
  );
  if (!data.length) return <p>No results for "{query}"</p>;
  return <ul>{data.map(r => <li key={r.id}>{r.title}</li>)}</ul>;
}
```

`safeFetch` from problem 01.

**Delay-show spinner pattern:**
```jsx
function useDelayedFlag(active, delay = 300) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (!active) return setShown(false);
    const id = setTimeout(() => setShown(true), delay);
    return () => clearTimeout(id);
  }, [active, delay]);
  return shown;
}
```

---

## 05 — Optimistic update

```jsx
import { useRef, useState } from 'react';

export function LikeButton({ post: initial, onChange }) {
  const [post, setPost] = useState(initial);
  const inFlight = useRef(false);

  async function handleClick() {
    if (inFlight.current) return;
    inFlight.current = true;

    const prev = post;
    const optimistic = {
      ...post,
      liked: !post.liked,
      likes: post.likes + (post.liked ? -1 : 1),
    };
    setPost(optimistic);
    onChange?.(optimistic);

    try {
      const r = await fetch(`/api/posts/${post.id}/like`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() },
        body: JSON.stringify({ liked: optimistic.liked }), // deterministic, not toggle
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const server = await r.json();
      setPost(server); // reconcile to server truth
      onChange?.(server);
    } catch (e) {
      setPost(prev);   // rollback
      onChange?.(prev);
      // toast: 'Could not save'
    } finally {
      inFlight.current = false;
    }
  }

  return (
    <button onClick={handleClick} aria-pressed={post.liked}>
      {post.liked ? '❤️' : '🤍'} {post.likes}
    </button>
  );
}
```

**Triple-click:** `inFlight` ref blocks the 2nd and 3rd until the first resolves. Drop them on the floor. (Alternative: queue — usually overkill for likes.)

**Websocket race:** if `onChange` propagates the server-truth value up to a store, the store can be the single source of truth. When a WS message arrives mid-flight, it updates the store; on flight resolve, we set the server response (which matches). The risk is ordering — server response is authoritative.

**Deterministic API beats toggle:** "set liked=true" is idempotent; "toggle" depends on current state. Idempotent calls retry safely.

**React Query equivalent:**
```jsx
const mutation = useMutation({
  mutationFn: ({ liked }) => fetch(...),
  onMutate: async ({ liked }) => {
    await queryClient.cancelQueries({ queryKey: ['post', post.id] });
    const prev = queryClient.getQueryData(['post', post.id]);
    queryClient.setQueryData(['post', post.id], (old) => ({ ...old, liked, likes: ... }));
    return { prev };
  },
  onError: (err, vars, ctx) => queryClient.setQueryData(['post', post.id], ctx.prev),
  onSettled: () => queryClient.invalidateQueries({ queryKey: ['post', post.id] }),
});
```

---

Next: `06-testing-incomplete/`.
