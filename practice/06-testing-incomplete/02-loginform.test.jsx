/**
 * Write tests for LoginForm.
 *
 * REQUIRED:
 * 1. Submitting with empty fields shows BOTH validation errors.
 * 2. Invalid email format shows email error after blur.
 * 3. Short password shows error after blur.
 * 4. Valid form calls onSubmit with the entered values.
 * 5. While onSubmit is pending, button is disabled and shows "Signing in...".
 * 6. If onSubmit rejects, the error message is displayed.
 * 7. Submitting twice fast triggers onSubmit only once.
 *
 * NOTES:
 * - Use a fake `onSubmit` promise you can resolve/reject manually for #5/#6/#7.
 * - Validate that error messages have role="alert".
 *
 * STRETCH:
 * - Verify aria-invalid toggles correctly.
 * - Verify that fixing the field clears the error.
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './02-loginform';

describe('LoginForm', () => {
  // TODO: implement

  // helper for #5/6/7:
  function deferredOnSubmit() {
    let resolve, reject;
    const fn = vi.fn(() => new Promise((res, rej) => { resolve = res; reject = rej; }));
    return { fn, resolve: (v) => resolve(v), reject: (e) => reject(e) };
  }
});
