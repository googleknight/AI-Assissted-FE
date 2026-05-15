/**
 * PRACTICE 02 — Double submit
 * Difficulty: Medium
 * Time target: 2 minutes
 *
 * Task: A user double-clicks "Pay" and gets charged twice. Find every
 * contributor (client + server) and fix the client side.
 */

import { useState } from 'react';

export function CheckoutButton({ cartId, total }) {
  async function handlePay() {
    const r = await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cartId, total }),
    });
    const data = await r.json();
    window.location.href = `/receipt/${data.id}`;
  }

  return <button onClick={handlePay}>Pay ${total}</button>;
}

/**
 * QUESTIONS:
 * 1. Why does double-click cause double-charge here?
 * 2. Fix A: disable button while in flight.
 * 3. Fix B: guard in handler with isSubmitting state.
 * 4. Fix C: idempotency key on the request — what does the server need to do?
 * 5. Combine A+B+C for production. Why all three?
 * 6. What about Enter key submitting twice in a form? (button vs <form onSubmit>)
 */
