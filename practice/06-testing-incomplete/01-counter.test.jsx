/**
 * Write tests for Counter.
 *
 * REQUIRED test cases (don't skip any):
 * 1. Renders the initial value.
 * 2. Clicking + increments.
 * 3. Clicking - decrements.
 * 4. + button is disabled at max.
 * 5. - button is disabled at min.
 * 6. Reset returns to initial regardless of current value.
 * 7. Does NOT go above max even via rapid clicks. (use clicks * 20 or so)
 *
 * RULES:
 * - Use @testing-library/react + user-event.
 * - Use semantic queries (getByRole) where possible.
 * - One concept per test.
 * - No setTimeout / waitFor without justification.
 * - Tests must FAIL if a bug is introduced (e.g. inc stops respecting max).
 *
 * STRETCH:
 * - Test keyboard accessibility (Tab order, Enter/Space activates button).
 * - Test aria-live announces changes.
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Counter } from './01-counter';

describe('Counter', () => {
  // TODO: implement
});
