/**
 * HALF-DONE 02 — Multi-step form
 * Difficulty: Medium-Hard
 * Time target: 20 minutes
 *
 * Task: Complete this 3-step signup flow.
 *
 * Steps:
 *   1. Account: email + password (+ confirm)
 *   2. Profile: name + bio
 *   3. Review: read-only summary + submit
 *
 * Requirements:
 * - Per-step validation. Cannot proceed if invalid.
 * - Going Back preserves entered values.
 * - Submit on step 3 calls `createUser(formData)` and shows loading + error.
 * - At least one new test.
 * - Refresh recovers form draft from localStorage (clear on successful submit).
 *
 * Anti-requirements:
 * - DON'T use a form library. We're testing your ability to manage state.
 *
 * STRETCH: progress bar, keyboard nav between steps, accessible step indicators.
 */

import { useState } from 'react';

const STEPS = ['account', 'profile', 'review'];

export function SignupWizard({ createUser }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [data, setData] = useState({ email: '', password: '', confirm: '', name: '', bio: '' });
  // TODO: errors, submitting, submitError
  // TODO: rehydrate from localStorage on mount
  // TODO: persist to localStorage on every change

  const step = STEPS[stepIndex];

  function validateStep() {
    // TODO: return { ok, errors }
    return { ok: true, errors: {} };
  }

  function next() {
    // TODO
  }
  function back() {
    setStepIndex((i) => Math.max(0, i - 1));
  }
  async function submit() {
    // TODO: call createUser, handle loading/error/success
  }

  return (
    <div role="form" aria-label="Signup">
      <ol aria-label="Steps">
        {STEPS.map((s, i) => (
          <li aria-current={i === stepIndex ? 'step' : undefined}>{s}</li>
        ))}
      </ol>

      {step === 'account' && <AccountStep data={data} onChange={setData} />}
      {step === 'profile' && <ProfileStep data={data} onChange={setData} />}
      {step === 'review' && <ReviewStep data={data} />}

      <button onClick={back} disabled={stepIndex === 0}>Back</button>
      {step !== 'review'
        ? <button onClick={next}>Next</button>
        : <button onClick={submit}>Submit</button>}
    </div>
  );
}

function AccountStep({ data, onChange }) {
  return (
    <div>
      <label>Email <input value={data.email} onChange={(e) => onChange({ ...data, email: e.target.value })} /></label>
      <label>Password <input type="password" value={data.password} onChange={(e) => onChange({ ...data, password: e.target.value })} /></label>
      <label>Confirm <input type="password" value={data.confirm} onChange={(e) => onChange({ ...data, confirm: e.target.value })} /></label>
    </div>
  );
}
function ProfileStep({ data, onChange }) {
  return (
    <div>
      <label>Name <input value={data.name} onChange={(e) => onChange({ ...data, name: e.target.value })} /></label>
      <label>Bio <textarea value={data.bio} onChange={(e) => onChange({ ...data, bio: e.target.value })} /></label>
    </div>
  );
}
function ReviewStep({ data }) {
  return (
    <dl>
      <dt>Email</dt><dd>{data.email}</dd>
      <dt>Name</dt><dd>{data.name}</dd>
      <dt>Bio</dt><dd>{data.bio}</dd>
    </dl>
  );
}

/**
 * THINK about:
 * - Where do per-field errors render? When do they appear (blur vs next-click)?
 * - localStorage: how to handle SSR? When to clear?
 * - What if `createUser` returns server errors per field?
 * - Accessibility: focus management on step change.
 */
