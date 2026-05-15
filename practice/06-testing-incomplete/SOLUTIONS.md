# SOLUTIONS — 06-testing-incomplete

> Reference implementations. Yours should look similar in shape — what matters is testing behavior, using semantic queries, and covering the listed cases.

---

## 01 — Counter tests

```jsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Counter } from './01-counter';

describe('Counter', () => {
  test('renders the initial value', () => {
    render(<Counter initial={3} />);
    expect(screen.getByTestId('count')).toHaveTextContent('3');
  });

  test('+ increments', async () => {
    const user = userEvent.setup();
    render(<Counter initial={0} />);
    await user.click(screen.getByRole('button', { name: '+' }));
    expect(screen.getByTestId('count')).toHaveTextContent('1');
  });

  test('- decrements', async () => {
    const user = userEvent.setup();
    render(<Counter initial={5} />);
    await user.click(screen.getByRole('button', { name: '-' }));
    expect(screen.getByTestId('count')).toHaveTextContent('4');
  });

  test('+ is disabled at max', () => {
    render(<Counter initial={10} max={10} />);
    expect(screen.getByRole('button', { name: '+' })).toBeDisabled();
  });

  test('- is disabled at min', () => {
    render(<Counter initial={0} min={0} />);
    expect(screen.getByRole('button', { name: '-' })).toBeDisabled();
  });

  test('reset returns to initial', async () => {
    const user = userEvent.setup();
    render(<Counter initial={3} />);
    await user.click(screen.getByRole('button', { name: '+' }));
    await user.click(screen.getByRole('button', { name: '+' }));
    await user.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.getByTestId('count')).toHaveTextContent('3');
  });

  test('cannot exceed max via rapid clicks', async () => {
    const user = userEvent.setup();
    render(<Counter initial={0} max={3} />);
    const plus = screen.getByRole('button', { name: '+' });
    for (let i = 0; i < 20; i++) {
      if (!plus.disabled) await user.click(plus);
    }
    expect(screen.getByTestId('count')).toHaveTextContent('3');
  });
});
```

---

## 02 — LoginForm tests

```jsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './02-loginform';

function deferred() {
  let resolve, reject;
  const fn = vi.fn(() => new Promise((res, rej) => { resolve = res; reject = rej; }));
  return { fn, resolve: (v) => resolve(v), reject: (e) => reject(e) };
}

describe('LoginForm', () => {
  test('submitting empty form shows both errors', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<LoginForm onSubmit={onSubmit} />);
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    expect(screen.getByText(/valid email/i)).toBeInTheDocument();
    expect(screen.getByText(/8 characters/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test('invalid email shows error on blur', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={vi.fn()} />);
    const email = screen.getByLabelText(/email/i);
    await user.type(email, 'not-an-email');
    await user.tab();
    expect(screen.getByText(/valid email/i)).toBeInTheDocument();
  });

  test('short password shows error on blur', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={vi.fn()} />);
    const pwd = screen.getByLabelText(/password/i);
    await user.type(pwd, 'short');
    await user.tab();
    expect(screen.getByText(/8 characters/i)).toBeInTheDocument();
  });

  test('valid form calls onSubmit with values', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<LoginForm onSubmit={onSubmit} />);
    await user.type(screen.getByLabelText(/email/i), 'a@b.com');
    await user.type(screen.getByLabelText(/password/i), 'longenoughpw');
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    expect(onSubmit).toHaveBeenCalledWith({ email: 'a@b.com', password: 'longenoughpw' });
  });

  test('disables button and shows progress while submitting', async () => {
    const user = userEvent.setup();
    const d = deferred();
    render(<LoginForm onSubmit={d.fn} />);
    await user.type(screen.getByLabelText(/email/i), 'a@b.com');
    await user.type(screen.getByLabelText(/password/i), 'longenoughpw');
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
    d.resolve();
  });

  test('shows server error message on failure', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue(new Error('Invalid credentials'));
    render(<LoginForm onSubmit={onSubmit} />);
    await user.type(screen.getByLabelText(/email/i), 'a@b.com');
    await user.type(screen.getByLabelText(/password/i), 'longenoughpw');
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
  });

  test('double-click only submits once', async () => {
    const user = userEvent.setup();
    const d = deferred();
    render(<LoginForm onSubmit={d.fn} />);
    await user.type(screen.getByLabelText(/email/i), 'a@b.com');
    await user.type(screen.getByLabelText(/password/i), 'longenoughpw');
    const btn = screen.getByRole('button', { name: /sign in/i });
    await user.click(btn);
    await user.click(btn); // button is now disabled, click ignored by user-event
    expect(d.fn).toHaveBeenCalledTimes(1);
    d.resolve();
  });
});
```

---

## 03 — UserList tests

```jsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserList } from './03-userlist';

vi.mock('./api', () => ({ fetchUsers: vi.fn() }));
import { fetchUsers } from './api';

describe('UserList', () => {
  beforeEach(() => { fetchUsers.mockReset(); });

  test('shows loading initially', () => {
    fetchUsers.mockReturnValue(new Promise(() => {})); // pending forever
    render(<UserList />);
    expect(screen.getByRole('status')).toHaveTextContent(/loading/i);
  });

  test('renders users on success', async () => {
    fetchUsers.mockResolvedValue([{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }]);
    render(<UserList />);
    expect(await screen.findByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  test('shows empty state when no users', async () => {
    fetchUsers.mockResolvedValue([]);
    render(<UserList />);
    expect(await screen.findByText(/no users yet/i)).toBeInTheDocument();
  });

  test('shows error and retry on failure', async () => {
    fetchUsers.mockRejectedValue(new Error('boom'));
    render(<UserList />);
    expect(await screen.findByRole('alert')).toHaveTextContent(/boom/i);
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  test('retry re-fetches and recovers', async () => {
    const user = userEvent.setup();
    fetchUsers.mockRejectedValueOnce(new Error('boom'))
              .mockResolvedValueOnce([{ id: 1, name: 'Alice' }]);
    render(<UserList />);
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /retry/i }));
    expect(await screen.findByText('Alice')).toBeInTheDocument();
  });
});
```

**Module mock vs MSW:**
- Module mock: faster, simpler for one component. But you bypass the actual fetch code, so a bug in `api.js` slips through.
- MSW: intercepts at the network layer. The component code runs unchanged from production. Catches bugs in `api.js` too. Slower per test (network plumbing). Worth it when API surface matters.

---

## 04 — DebouncedSearch tests

```jsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DebouncedSearch } from './04-debounced-search';

describe('DebouncedSearch', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  test('fires onSearch once after delay', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onSearch = vi.fn();
    render(<DebouncedSearch onSearch={onSearch} delay={300} />);
    await user.type(screen.getByLabelText(/search/i), 'hello');
    expect(onSearch).not.toHaveBeenCalledWith('hello');
    vi.advanceTimersByTime(300);
    expect(onSearch).toHaveBeenCalledWith('hello');
  });

  test('rapid typing only fires once with final value', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onSearch = vi.fn();
    render(<DebouncedSearch onSearch={onSearch} delay={300} />);
    const input = screen.getByLabelText(/search/i);
    await user.type(input, 'h');
    vi.advanceTimersByTime(100);
    await user.type(input, 'i');
    vi.advanceTimersByTime(100);
    await user.type(input, '!');
    vi.advanceTimersByTime(300);
    // onSearch is fired with '' on first render (initial empty), then once with 'hi!'
    const realCalls = onSearch.mock.calls.filter(([v]) => v !== '');
    expect(realCalls).toHaveLength(1);
    expect(realCalls[0][0]).toBe('hi!');
  });

  test('clearing fires onSearch("") immediately', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onSearch = vi.fn();
    render(<DebouncedSearch onSearch={onSearch} delay={300} />);
    const input = screen.getByLabelText(/search/i);
    await user.type(input, 'abc');
    vi.advanceTimersByTime(300);
    onSearch.mockClear();
    await user.clear(input);
    expect(onSearch).toHaveBeenCalledWith('');
  });

  test('unmounting before delay does not fire', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onSearch = vi.fn();
    const { unmount } = render(<DebouncedSearch onSearch={onSearch} delay={300} />);
    await user.type(screen.getByLabelText(/search/i), 'hi');
    unmount();
    vi.advanceTimersByTime(300);
    expect(onSearch).not.toHaveBeenCalledWith('hi');
  });
});
```

---

**Talking points for the interview:**
- "I'm querying by role/label, not testid — keeps tests resilient to refactors."
- "I'm using `findBy` for async-appearing elements so I don't need explicit waits."
- "For the loading state I returned a never-resolving promise — that's the cleanest way to freeze the component in 'loading' for assertion."
- "I'm testing the user-observable behavior, not the internal `status` state."

Next: `07-half-done-features/`.
