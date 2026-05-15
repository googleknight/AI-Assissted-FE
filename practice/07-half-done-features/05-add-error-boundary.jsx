/**
 * HALF-DONE 05 — Resilience layer
 * Difficulty: Medium
 * Time target: 15 minutes
 *
 * Task: Build an `<AppShell>` that wraps the app with:
 * - A global error boundary (logs to a fake logger; shows reset UI).
 * - Per-route error boundaries (one widget crash doesn't kill the whole route).
 * - A toast container for retry UI.
 * - A "user is offline" banner when navigator.onLine === false.
 *
 * Also: implement a `useErrorHandler()` hook that lets async code rethrow
 * to the nearest boundary.
 *
 * Requirements:
 * - Works in dev (StrictMode double-invoke) and prod.
 * - Logger receives error + componentStack + route + a user id (from a hook).
 * - Reset re-renders the subtree without a full reload.
 * - At least one test that mounts a broken child and asserts the fallback UI.
 *
 * STRETCH: integrate with `react-error-boundary` if you want.
 */

import { Component, createContext, useContext, useEffect, useState } from 'react';

const LoggerContext = createContext({ log: console.error });
const UserContext = createContext({ id: null });

class ErrorBoundary extends Component {
  // TODO: implement; receive `logger` from context via a wrapper, or as prop.
}

export function AppShell({ children, logger, currentRoute }) {
  // TODO: render banner, error boundary, toast container, children
}

export function useErrorHandler() {
  // TODO: returns a function (err) => triggers boundary
}

/**
 * THINK about:
 * - getDerivedStateFromError vs componentDidCatch — which is which?
 * - How do you read context inside a class component? (Wrapper or contextType.)
 * - Are async errors caught by error boundaries? (No — handle with useErrorHandler.)
 * - Why does the boundary need a `resetKeys` mechanism in some cases? (To auto-reset on prop change.)
 */
