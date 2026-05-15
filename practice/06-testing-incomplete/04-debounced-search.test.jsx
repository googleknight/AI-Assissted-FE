/**
 * Write tests for DebouncedSearch.
 *
 * REQUIRED:
 * 1. Typing fires onSearch ONCE after the debounce delay.
 * 2. Typing more before delay elapses resets the timer (only fires once with final value).
 * 3. Clearing the input fires onSearch('') immediately (no debounce on empty).
 * 4. Unmounting before delay elapses doesn't fire onSearch.
 *
 * APPROACH:
 * - Use vi.useFakeTimers() / vi.useRealTimers().
 * - Use userEvent.setup({ advanceTimers: vi.advanceTimersByTime }) for v14+ compatibility.
 * - vi.advanceTimersByTime(300) to elapse the debounce.
 *
 * STRETCH:
 * - Verify keyboard accessibility.
 * - Use real timers + a short delay (e.g., delay={10}) and `waitFor` — compare DX.
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DebouncedSearch } from './04-debounced-search';

describe('DebouncedSearch', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  // TODO: implement
});
