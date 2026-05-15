# 08 — Next.js Essentials: SSR, SSG, ISR, RSC, Streaming, Hydration

> If the brownfield repo turns out to be Next.js, you need to know the rendering strategies cold and the gotchas unique to each. Most teams blur SSR/SSG/ISR/RSC in conversation — being precise is a senior signal.

---

## The rendering strategy decision tree

Next.js gives you **five** ways to render a page. The art is picking the right one for each page.

| Strategy | When HTML is generated | When to use |
|---|---|---|
| **CSR** (Client-Side Rendering) | In the browser, on demand | Highly dynamic per-user content; you've opted out of SSR |
| **SSR** (Server-Side Rendering) | On every request, on the server | Personalized + needs-SEO; data changes per request |
| **SSG** (Static Site Generation) | At build time | Content rarely changes; max perf; CDN-cacheable |
| **ISR** (Incremental Static Regeneration) | At build, then regenerated on a schedule or on-demand | "Mostly static" content that does change occasionally |
| **RSC** (React Server Components, App Router) | On the server, streamed | New default in App Router; lets you mix server and client components |

---

## Pages Router vs App Router

You'll encounter both in 2026 codebases.

### Pages Router (`/pages` folder, the older system)
- Each file in `/pages` is a route.
- Data fetching via `getServerSideProps` (SSR), `getStaticProps` + `getStaticPaths` (SSG/ISR), `getInitialProps` (legacy, avoid).
- Layouts via `_app.tsx`, `_document.tsx`.

### App Router (`/app` folder, the new system, Next 13+)
- Each `page.tsx` is a route; nested folders nest the layout.
- Server Components by default.
- Layouts via `layout.tsx`. Loading via `loading.tsx`. Errors via `error.tsx`. Not-found via `not-found.tsx`.
- Data fetching: just `await fetch(...)` in async server components.
- Client components opt in with `'use client'` directive at the top.

### How to tell which you're in
- See `/pages/api/` or `/pages/index.tsx`? Pages Router.
- See `/app/layout.tsx`? App Router.
- Both can coexist during migration.

---

## App Router: Server Components by default

This is the biggest mental shift. By default, every component is a **server component**:
- Runs on the server only.
- Can directly access the database, file system, env vars (including secret ones).
- Cannot use hooks (`useState`, `useEffect`) or browser APIs.
- Cannot have event handlers (`onClick`).
- Can be async (`async function Page() { ... }`).
- Smaller bundle: server component code doesn't ship to the client.

To make a component a client component, add `'use client'` at the top of the file:

```jsx
'use client';
import { useState } from 'react';

export default function Counter() {
  const [c, setC] = useState(0);
  return <button onClick={() => setC(c + 1)}>{c}</button>;
}
```

`'use client'` marks a boundary. Everything imported into a client component is also client (in terms of bundle).

### The pattern: server fetches, client interacts

```jsx
// app/users/page.tsx — server component
import { UserList } from './UserList'; // client component

export default async function UsersPage() {
  const users = await fetch('https://api/users', { cache: 'no-store' }).then(r => r.json());
  return <UserList initialUsers={users} />;
}

// app/users/UserList.tsx
'use client';
import { useState } from 'react';

export function UserList({ initialUsers }) {
  const [filter, setFilter] = useState('');
  return (...);
}
```

Server fetches the data with full server privileges; client takes over for interactivity.

---

## Data fetching in App Router

`fetch` is patched by Next.js. The second arg controls caching:

```js
// Persistent cache; reused forever until manually invalidated.
fetch('/api', { cache: 'force-cache' });

// Fresh every request (SSR-equivalent).
fetch('/api', { cache: 'no-store' });

// ISR. Cached, revalidated every N seconds.
fetch('/api', { next: { revalidate: 60 } });

// Tagged for on-demand revalidation.
fetch('/api', { next: { tags: ['users'] } });
// Later, from a Server Action or route handler:
//   import { revalidateTag } from 'next/cache';
//   revalidateTag('users');
```

This replaces the Pages Router's `getServerSideProps` / `getStaticProps` distinction. The caching strategy is **per-fetch**, not per-page.

### ⚠️ Default cache changed in Next 15

**Next 14:** `fetch` defaulted to `force-cache` (static / cached forever).
**Next 15:** `fetch` defaults to `no-store` (dynamic / no cache) when no explicit option is set. Server Actions internally set the fetch cache to `default-no-store`.

This is the single biggest source of "why is my data stale?" or "why is my app suddenly slower?" confusion when reading or migrating Next 14 → 15 code. To restore old behavior either:

- Per request: `fetch(url, { cache: 'force-cache' })`
- Per route/layout: `export const fetchCache = 'default-cache'`

Interview talking point: if the codebase mixes Next 14 patterns assuming caching is automatic, that's a finding. Always check the Next major version in `package.json` before reasoning about cache behavior.

---

## SSR pitfalls (apply to both routers)

### Hydration mismatches

Server renders HTML "A". Client renders "B" on first pass. React panics: "Hydration failed because the initial UI does not match what was rendered on the server."

Common causes:
- `Date.now()`, `Math.random()`, `new Date().toLocaleString()` — server time ≠ client time.
- `window.matchMedia` / `localStorage` accessed during render — server doesn't have these.
- Conditional rendering based on `typeof window !== 'undefined'`.
- Time-zone-dependent formatting.

### Fixes

- Avoid the divergence: render the same thing on both. If you need client-only logic, use `useEffect` (runs after hydration).
- For genuine client-only widgets: dynamic import with `ssr: false`.

```jsx
const ClientOnly = dynamic(() => import('./ClientOnly'), { ssr: false });
```

- For "render placeholder server, real content client":

```jsx
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);
return mounted ? <RealContent /> : <Placeholder />;
```

### localStorage in SSR

```js
const theme = localStorage.getItem('theme'); // ❌ server crashes
```

Fix:
```js
const [theme, setTheme] = useState('light'); // safe default
useEffect(() => setTheme(localStorage.getItem('theme') ?? 'light'), []);
```

But this causes a hydration flash. Better: read the value server-side from a cookie, render with the correct theme on first paint.

---

## Streaming and Suspense (App Router)

The killer feature of App Router: stream the page in chunks.

```jsx
// app/dashboard/page.tsx
import { Suspense } from 'react';

export default function Dashboard() {
  return (
    <div>
      <Header />
      <Suspense fallback={<UsersSkeleton />}>
        <Users />  {/* slow data fetch, streamed in when ready */}
      </Suspense>
      <Suspense fallback={<ChartsSkeleton />}>
        <Charts />
      </Suspense>
    </div>
  );
}
```

The shell + skeletons stream first. Each Suspense boundary unblocks independently. The user sees structure within ~100ms even if the data takes 2s.

This was the whole motivation for RSC. Compare to traditional SSR where the slowest request blocks the entire HTML response.

---

## The `loading.tsx` and `error.tsx` files

In App Router, special files create automatic boundaries around a route segment:

- `loading.tsx` → wraps the segment in Suspense, with this as fallback.
- `error.tsx` → wraps the segment in an Error Boundary.
- `not-found.tsx` → custom 404 page for the segment.

```jsx
// app/users/loading.tsx
export default function Loading() {
  return <UsersSkeleton />;
}

// app/users/error.tsx
'use client';
export default function Error({ error, reset }) {
  return (
    <div>
      <h2>Could not load users</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

Note `error.tsx` must be a client component (it uses state internally).

---

## Server Actions

A way to call server functions directly from forms/buttons in the App Router.

```jsx
// app/users/actions.ts
'use server';
export async function createUser(formData) {
  const name = formData.get('name');
  await db.user.create({ data: { name } });
  revalidatePath('/users');
}

// app/users/page.tsx
import { createUser } from './actions';
export default function Page() {
  return (
    <form action={createUser}>
      <input name="name" />
      <button>Create</button>
    </form>
  );
}
```

Pros: no manual API route, full type-safety, progressive enhancement (works without JS).

Pitfalls:
- They're POST endpoints under the hood. CSRF protection is handled by Next, but verify in security-sensitive contexts.
- `'use server'` exposes the function as an endpoint — sensitive operations must verify auth inside the action.
- Don't return non-serializable data.

---

## API Routes

Both routers support API routes for client-callable HTTP endpoints:

- Pages: `/pages/api/users.ts` → handler function.
- App: `/app/api/users/route.ts` → `GET`, `POST` named exports.

```ts
// app/api/users/route.ts
import { NextResponse } from 'next/server';

export async function GET(request) {
  const url = new URL(request.url);
  const users = await db.user.findMany();
  return NextResponse.json(users);
}
```

API routes default to running on the Node runtime; you can opt into Edge runtime (faster cold start, less Node API surface) with `export const runtime = 'edge'`.

---

## SSE and streaming responses

(You mentioned wanting Next coverage for SSE — I'm including both meanings.)

### Server-Sent Events
A streaming HTTP response of `text/event-stream` content. One-way (server → client). Good for live updates without WebSockets.

```ts
// app/api/events/route.ts
export const runtime = 'edge';

export async function GET() {
  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(`data: ${JSON.stringify({ tick: 1 })}\n\n`);
      // ...
    },
  });
  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream' },
  });
}
```

Client:
```js
const es = new EventSource('/api/events');
es.onmessage = (e) => console.log(JSON.parse(e.data));
```

Useful for: AI chat streaming, notifications, live counters.

### Streaming RSC
Streaming server components: the HTML and React tree are streamed as `text/x-component`. The framework handles it; you don't write the stream protocol yourself.

---

## Image optimization with `<Image>`

```jsx
import Image from 'next/image';
<Image src="/hero.jpg" alt="..." width={800} height={400} priority />
```

Features:
- Auto resize / format (WebP/AVIF).
- Lazy load by default; `priority` for above-the-fold (LCP candidates).
- `placeholder="blur"` for blurred preview.
- Layout-stable (requires width/height to prevent CLS).

In a brownfield review, plain `<img>` tags with no width/height are flag-worthy.

---

## Font optimization

```jsx
import { Inter } from 'next/font/google';
const inter = Inter({ subsets: ['latin'] });

<html className={inter.className}>
```

Self-hosts the font (no third-party CDN), reduces CLS, no FOIT/FOUT.

---

## Route caching nuances

Next.js has FOUR caches (App Router):

1. **Request Memoization** — same fetch in one render is deduped.
2. **Data Cache** — `fetch` results cached server-side, persistent.
3. **Full Route Cache** — the rendered HTML cached at build (static routes).
4. **Router Cache** — client-side cache of previously visited routes.

This is genuinely confusing. When `fetch` returns stale data, identify which cache.

To bust:
- Function-level: `fetch(..., { cache: 'no-store' })` or `{ next: { revalidate: 0 } }`.
- Path-level: `export const dynamic = 'force-dynamic'` in the page or layout.
- On demand: `revalidatePath('/users')` or `revalidateTag('users')` from a server action.

---

## Environment variables

- `NEXT_PUBLIC_*` — bundled into the client. **Anything here is public.**
- Others — server-only. Available in `getServerSideProps`, server components, API routes.

Common bug: putting an API secret in `NEXT_PUBLIC_API_KEY`. Now it's in the JS bundle and indexable by Google.

---

## Middleware

A function that runs before the request hits a page or API route. Use for: auth gating, redirects, A/B test cookies, geo routing.

```ts
// middleware.ts
import { NextResponse } from 'next/server';

export function middleware(request) {
  if (!request.cookies.get('token') && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = { matcher: ['/dashboard/:path*'] };
```

Runs on the Edge runtime. Tight constraints (no Node API). Don't use for heavy logic.

---

## Common Next-specific brownfield bugs

| Bug | Symptom | Fix |
|---|---|---|
| Calling `localStorage` during render | SSR crash | Move to `useEffect` or check `typeof window` |
| Using `useEffect` for data that should be server-fetched | Loading spinners and extra round trips | Move to server component / loader |
| Mixing `'use client'` into a server component file by accident | Confusing client/server boundary | Audit the directive |
| Importing a server-only module in a client component | Build error or bundle bloat | Use `import 'server-only'` marker |
| Forgetting `revalidatePath` after a mutation | Stale UI | Add revalidation after writes |
| Hardcoded base URLs in fetch | Breaks in preview/prod | Use env var or relative paths |
| Image without width/height | CLS / unoptimized | Use `<Image>` with dims |
| Stale cache after a deploy | Old code paths | Configure `staleTimes`, deploy verification |
| Putting auth in client | Bypassable | Auth in middleware or layout (server side) |

---

## When the interview repo IS Next.js

First three minutes:
1. `app/` or `pages/`? Pin down the router.
2. Read `next.config.js` for special config (image domains, redirects, runtime).
3. Read root `layout.tsx` / `_app.tsx` for providers (auth, theme, query).
4. Look at one route end-to-end before judging.

---

## Talking points

> "This component uses `localStorage` during render — that'll crash in SSR. I'd move it to useEffect, or read the value from a cookie on the server so we don't flash."

> "I'd Suspense-boundary the slow query so the rest of the page can stream — right now the slowest fetch blocks the whole page."

> "This API key is in `NEXT_PUBLIC_*` — that ships to the client. We need to move it server-side and proxy."

> "I'd add `revalidateTag` here after the mutation so the affected lists refresh without a full reload."

Next: `09-vue-quick-ref.md`.
