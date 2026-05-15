# 07 — Testing: RTL Patterns, What to Test, Mocking

> The interview **requires** at least one new test alongside your change. The test you write is judged on: (1) does it actually verify the fix, (2) does it test behavior not implementation, (3) is it readable, (4) will it not break on innocent refactors.

---

## The single most important testing principle

**Test behavior, not implementation.**

A user doesn't care that you used `useState` instead of `useReducer`. They care that when they click "Save", the data is saved. Your test should reflect what a user does, not what the code does internally.

Kent C. Dodds's framing: "The more your tests resemble the way your software is used, the more confidence they can give you."

This is why React Testing Library (RTL) won over Enzyme — RTL pushes you toward user-facing queries; Enzyme let you reach into component internals.

---

## The testing pyramid (still useful, with caveats)

```
       /\
      /E2E\        ← Playwright, Cypress. Few. Slow. High confidence.
     /------\
    /  INT   \    ← RTL component tests. Most useful. Medium speed.
   /----------\
  /    UNIT    \  ← Pure functions, reducers, utils. Fast. Cheap.
 /--------------\
```

Modern thinking shifts the middle (integration tests) higher than classical pyramid suggests. RTL component tests give the best ROI for frontend.

---

## React Testing Library — the patterns

### Query priority (memorize this)

RTL pushes you toward queries that resemble user behavior:

1. **By role** — `getByRole('button', { name: /save/i })`. Accessible, robust.
2. **By label** — `getByLabelText('Email')`. Forms.
3. **By placeholder** — `getByPlaceholderText('Search')`. Fine.
4. **By text** — `getByText('Welcome')`. Content.
5. **By display value** — `getByDisplayValue('admin@x.com')`. Inputs with value.
6. **By alt text / title** — for images.
7. **By test id** — `getByTestId('submit-btn')`. Last resort.

If you find yourself reaching for `getByTestId` constantly, the component's a11y is probably bad — that's a separate signal.

### Query variants

- `getBy...` — throws if not found. Use for required elements.
- `queryBy...` — returns null if not found. Use to assert absence (`expect(queryByText('error')).toBeNull()`).
- `findBy...` — async, retries until present. Use for elements that appear after async work.
- `...All` — multiple matches.

### The structure of a good test

```jsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

test('submits form with entered values', async () => {
  const onSubmit = vi.fn(); // or jest.fn()
  const user = userEvent.setup();

  // ARRANGE
  render(<LoginForm onSubmit={onSubmit} />);

  // ACT
  await user.type(screen.getByLabelText(/email/i), 'a@b.com');
  await user.type(screen.getByLabelText(/password/i), 'secret');
  await user.click(screen.getByRole('button', { name: /sign in/i }));

  // ASSERT
  expect(onSubmit).toHaveBeenCalledWith({ email: 'a@b.com', password: 'secret' });
});
```

Note:
- One concept per test, with a clear name.
- `userEvent` over `fireEvent` — userEvent simulates real user interactions (clicks involve focus, hover, mousedown, mouseup; typing fires keydown/up/press).
- Async via `await` — never `setTimeout` or arbitrary sleeps.

---

## What to test, what to skip

### Test
- User-visible behavior on the happy path.
- Error / empty / loading states (the four-state shape from doc 06).
- Forms: validation rules, submit behavior, edge cases (empty, max length, invalid).
- Interactions that change state.
- Accessibility-critical features (role, label, focus).
- The specific bug you fixed — write a test that fails without your fix.

### Don't test
- Implementation details (which hook was called, internal state shape).
- Third-party library behavior (don't test that `react-query` caches).
- Trivial getters/setters.
- Styles (in unit tests — visual regression has its own tools).
- Things already covered by TypeScript (types).

---

## The "test that fails without the fix" rule

Whenever you fix a bug, your new test should:
1. **Fail on the broken code.**
2. **Pass on the fixed code.**

Verify both directions in the interview. Demonstrate it to the interviewer: comment out the fix, watch the test fail, restore, watch it pass. That's the strongest possible signal.

---

## Async testing — getting it right

### findBy for things that appear

```jsx
render(<UserProfile id={1} />);
expect(await screen.findByText('Alice')).toBeInTheDocument();
// findByText waits up to default timeout (1s) for the element
```

### waitFor for assertions on existing elements

```jsx
await waitFor(() => {
  expect(spinner).not.toBeInTheDocument();
});
```

### Avoid these anti-patterns

```jsx
await new Promise(r => setTimeout(r, 1000)); // ❌ flaky, slow
act(() => {}); // ❌ usually unnecessary with user-event v14+
```

---

## Mocking — when and how

### What to mock

| Layer | Mock? | Why |
|---|---|---|
| Pure utils | No | Test the real thing |
| Your own components | Usually no | You want integration |
| Network (fetch / axios) | Yes | Avoid real HTTP |
| Date / time | Yes for deterministic | `Date.now()`, `setTimeout` |
| Crypto / randomness | Yes for determinism | `Math.random`, `crypto.randomUUID` |
| Third-party services | Yes | No network |
| Browser APIs (localStorage, IntersectionObserver) | Usually | jsdom may not implement them |

### Mocking network with MSW (Mock Service Worker)

MSW is the modern standard. It intercepts network requests at the boundary, so your code uses the real `fetch`.

```js
// tests/handlers.js
import { http, HttpResponse } from 'msw';
export const handlers = [
  http.get('/api/users', () => HttpResponse.json([{ id: 1, name: 'Alice' }])),
];

// tests/setup.js
import { setupServer } from 'msw/node';
import { handlers } from './handlers';
export const server = setupServer(...handlers);
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// In a test, override per-test if needed:
server.use(http.get('/api/users', () => HttpResponse.error()));
```

Benefits:
- Your code under test doesn't know it's tested.
- Switch responses to test error/loading states.
- Same handlers work for browser dev (offline mock mode).

If the brownfield repo doesn't use MSW, **don't introduce it for one test** — match what they use (jest.mock, msw, manual mock, etc.).

### Mocking modules with Jest/Vitest

```js
vi.mock('./api', () => ({
  fetchUsers: vi.fn(),
}));

import { fetchUsers } from './api';
fetchUsers.mockResolvedValue([{ id: 1 }]);
```

Pitfall: `vi.mock`/`jest.mock` is hoisted to the top of the file. Don't put references to test variables in the factory body without using `vi.hoisted` or returning factories that read variables lazily.

### Mocking time

```js
vi.useFakeTimers();
vi.setSystemTime(new Date('2026-01-01'));

// component uses Date.now()
render(<Comp />);

vi.useRealTimers();
```

```js
// Advance timers in tests of debounce/throttle
vi.advanceTimersByTime(500);
```

---

## Coverage — useful and misleading

Coverage tells you what code was *executed* by tests, not what's *verified*. A test that just renders a component covers 100% of the lines but verifies nothing.

Use coverage to find untested code, not to grade your suite.

**Senior signal:** mention coverage limitations if asked. "I aim for 100% on critical paths but accept lower elsewhere; coverage is a floor, not a ceiling."

---

## Common test smells (flag these in code review)

- **Snapshot tests for everything** — locks you into the current output; changes look scary; coverage feels false.
- **Tests that re-implement the component** — "the test mirrors the code; they always pass together; they catch nothing."
- **Mocking everything** — at that point you're testing your mocks.
- **Tests with no assertions** — they only check that the code doesn't throw.
- **Tests with `act` wrappers everywhere** — usually a sign of fighting RTL, not using it.
- **Tests that depend on order** — a failing test in one file affects the next.
- **`screen.debug()` left in** — noisy CI logs.
- **Hardcoded timing** — `setTimeout(... 100)` in tests = flaky.

---

## A complete example: testing a fix

You fixed a bug where the search input filter wasn't applied because `filter` wasn't in the useEffect deps. Test:

```jsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

test('filters items as user types', async () => {
  const user = userEvent.setup();
  render(<ItemList items={[
    { id: 1, name: 'Apple' },
    { id: 2, name: 'Banana' },
    { id: 3, name: 'Avocado' },
  ]} />);

  // initially all items visible
  expect(screen.getAllByRole('listitem')).toHaveLength(3);

  // type "A" — only Apple and Avocado match
  await user.type(screen.getByPlaceholderText(/search/i), 'A');

  expect(screen.getByText('Apple')).toBeInTheDocument();
  expect(screen.getByText('Avocado')).toBeInTheDocument();
  expect(screen.queryByText('Banana')).not.toBeInTheDocument();
});
```

This test:
- Reflects user behavior (typing into a search box).
- Asserts UI outcomes (which items are visible).
- Doesn't care HOW filtering is implemented.
- Would fail if the bug came back.

---

## Vitest vs Jest — practical differences

- Same APIs (`describe`, `test`, `expect`, mocking). Vitest is faster and Vite-native.
- Vitest: `vi.fn()`, `vi.mock()`. Jest: `jest.fn()`, `jest.mock()`.
- Setup file locations differ slightly.
- Vitest has built-in ESM support; Jest needs config gymnastics.

If you encounter either, the patterns above work. Match the repo's existing style.

---

## E2E quick mention (Playwright / Cypress)

Brownfield interviews rarely require E2E in the 60 min. But know:
- Playwright is the modern standard.
- E2E tests run against the real browser, real app, real network (or mocked).
- They're slow — use sparingly for critical user flows.

---

## Test setup for the interview

Before your test:
1. Identify the test runner (`package.json`: `jest`, `vitest`, `mocha`).
2. Identify the test file convention (`*.test.tsx`, `*.spec.ts`, `__tests__/`).
3. Identify the existing testing library (`@testing-library/react`, Enzyme — match it).
4. Run existing tests once — confirm green baseline.
5. Add YOUR test in the right place. Match conventions.

---

## Talking points

> "I'll write a failing test first, then make my change — that way I'm sure the test verifies the fix and not something incidental."

> "I'm testing behavior — what the user sees — so the test won't break if we refactor the hook internals later."

> "I'll mock the network at the boundary with MSW rather than the fetch import, so the component code path is the same as in production."

> "I'd add coverage for the empty and error states too — those are the cases most likely to regress."

Next: `08-nextjs-essentials.md`.
