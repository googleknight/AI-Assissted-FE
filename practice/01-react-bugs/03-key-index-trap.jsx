/**
 * PRACTICE 03 — List keys
 * Difficulty: Medium
 * Time target: 2 minutes
 *
 * Task: Users report that when they delete one row, the WRONG row's input
 * keeps its typed text and focus. Find the bug. Fix it.
 *
 * Stretch: explain in writing how to demo the bug step-by-step to a teammate.
 */

import { useState } from 'react';

export function TodoEditor() {
  const [todos, setTodos] = useState([
    { id: 'a', label: 'Apples', notes: '' },
    { id: 'b', label: 'Bananas', notes: '' },
    { id: 'c', label: 'Cherries', notes: '' },
  ]);

  function remove(id) {
    setTodos((t) => t.filter((x) => x.id !== id));
  }

  function updateNotes(i, v) {
    setTodos((t) => t.map((x, idx) => (idx === i ? { ...x, notes: v } : x)));
  }

  return (
    <ul>
      {todos.map((t, i) => (
        <li key={i}>
          <span>{t.label}</span>
          <input
            placeholder="notes"
            value={t.notes}
            onChange={(e) => updateNotes(i, e.target.value)}
          />
          <button onClick={() => remove(t.id)}>Delete</button>
        </li>
      ))}
    </ul>
  );
}

/**
 * QUESTIONS:
 * 1. Why does focus / typed text land on the wrong row after delete?
 * 2. Two things are wrong here — find both. (key + index-based update)
 * 3. What's a stable identifier you should use throughout?
 */
