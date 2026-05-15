/**
 * PRACTICE 01 — Mutating state
 * Difficulty: Easy
 * Time target: 90 seconds
 *
 * Task: Clicking "Add" doesn't update the UI even though the data clearly
 * grows in the console. Find the bug. Fix it.
 */

import { useState } from 'react';

export function ChecklistEditor() {
  const [list, setList] = useState({
    title: 'Groceries',
    items: ['apples', 'bread'],
  });

  function addItem(item) {
    list.items.push(item);
    setList(list);
    console.log('list now', list);
  }

  function renameTitle(newTitle) {
    list.title = newTitle;
    setList(list);
  }

  return (
    <div>
      <input value={list.title} onChange={(e) => renameTitle(e.target.value)} />
      <ul>{list.items.map((i, idx) => <li key={idx}>{i}</li>)}</ul>
      <button onClick={() => addItem('eggs')}>Add eggs</button>
    </div>
  );
}

/**
 * QUESTIONS:
 * 1. Why does the UI not update even though `list` changed?
 * 2. Rewrite both setters immutably.
 * 3. There's a secondary bug too — `key={idx}`. Why is that risky here?
 * 4. What if the list was deeply nested? (mention Immer briefly)
 */
