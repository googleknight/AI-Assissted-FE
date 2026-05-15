/**
 * PRACTICE 03 — No error boundary
 * Difficulty: Medium
 * Time target: 3 minutes
 *
 * Task: One widget in the sidebar throws (data shape changed). The entire app
 * crashes to white screen. Refactor.
 *
 * Then: where do error boundaries NOT catch?
 */

import { Suspense, useEffect, useState } from 'react';

export function App() {
  return (
    <div className="layout">
      <Header />
      <Sidebar />
      <Main />
    </div>
  );
}

function Sidebar() {
  return (
    <aside>
      <UserBadge />
      <NotificationsWidget />  {/* this one explodes */}
      <RecentActivity />
    </aside>
  );
}

function NotificationsWidget() {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch('/api/notifications').then(r => r.json()).then(setData);
  }, []);
  // BUG: data shape changed; assumes array but returns { items: [...] }
  return <ul>{data.map(n => <li key={n.id}>{n.text}</li>)}</ul>;
}

function Header() { return <header>Hello</header>; }
function UserBadge() { return <div>User</div>; }
function RecentActivity() { return <div>Activity</div>; }
function Main() { return <main>Main</main>; }

/**
 * QUESTIONS:
 * 1. Implement an ErrorBoundary class component. Where to place it for
 *    graceful degradation? (route level vs widget level)
 * 2. Refactor so a broken widget doesn't bring down the sidebar or the page.
 * 3. Why doesn't `data.map(...)` throw at first — and where does it actually throw?
 *    (First render: `data` is null → `null.map` throws synchronously.)
 * 4. Bonus: error boundaries DON'T catch errors in:
 *    - event handlers
 *    - async code (promise rejections)
 *    - SSR (in the App Router, use error.tsx)
 *    - error boundary itself
 *    How do you handle async errors? (try/catch, set error state, re-throw in render.)
 *
 * STRETCH: implement a useErrorBoundary hook that lets you trigger the boundary
 * from an async catch. (Sketch: setState that throws in render.)
 */
