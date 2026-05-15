/**
 * PRACTICE 04 — Stale state when prop changes
 * Difficulty: Medium-Hard
 * Time target: 3 minutes
 *
 * Task: When the parent passes a different `initialValue`, the input
 * doesn't update. Why? Two valid fixes.
 */

import { useState } from 'react';

export function EditField({ initialValue, onSave }) {
  const [value, setValue] = useState(initialValue);

  return (
    <div>
      <input value={value} onChange={(e) => setValue(e.target.value)} />
      <button onClick={() => onSave(value)}>Save</button>
    </div>
  );
}

/**
 * QUESTIONS:
 * 1. Why does `value` not sync when `initialValue` prop changes?
 * 2. Fix A: useEffect resetting value on initialValue change.
 *    What's wrong with this? (overwrites user's in-progress edit on any parent render)
 * 3. Fix B: use `key` prop to remount on identity change.
 *    `<EditField key={user.id} initialValue={user.name} ... />`
 * 4. Fix C: "controlled" — caller owns value, EditField is purely controlled.
 * 5. Which fix communicates intent best?
 *    (B is React-idiomatic for "reset state when identity changes.")
 */
