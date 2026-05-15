/**
 * HALF-DONE 04 — Drag-to-reorder with optimistic save
 * Difficulty: Hard
 * Time target: 20 minutes (or skip if you're not familiar with dnd)
 *
 * Task: Allow user to reorder items by drag. Persist new order to server
 * with optimistic UI + rollback on failure.
 *
 * API: PUT /api/items/reorder  body: { orderedIds: [...] }
 *
 * You may use:
 * - HTML5 drag-and-drop (no library), OR
 * - @dnd-kit/core (preferred, accessible), OR
 * - react-beautiful-dnd (legacy)
 *
 * Requirements:
 * - Visual feedback during drag (cursor, placeholder, snap-back on cancel).
 * - Optimistic reorder; rollback if server rejects.
 * - Keyboard-accessible drag (use dnd-kit's KeyboardSensor or roll your own).
 * - At least one test that asserts order changes after drop.
 *
 * STRETCH: undo via toast after successful reorder.
 */

import { useState } from 'react';

export function ReorderableList({ initialItems, onReorder }) {
  const [items, setItems] = useState(initialItems);
  // TODO: drag state, rollback snapshot, in-flight flag

  // TODO: drag handlers (onDragStart, onDragOver, onDrop)
  // OR set up dnd-kit's DndContext, SortableContext

  async function commit(newOrder) {
    // TODO: optimistic update, fetch, rollback on error
  }

  return (
    <ul>
      {items.map((item) => (
        <li key={item.id}>
          {item.name}
        </li>
      ))}
    </ul>
  );
}

/**
 * THINK about:
 * - Why is HTML5 dnd hard for accessibility? (Screen reader support is poor.)
 * - How would you announce reorder for AT users? (aria-live with "Moved X to position Y").
 * - What if two reorders queue up rapidly? (Latest-wins or queue serial.)
 * - Server validation: what if server reorders differently due to permissions?
 *   (Reconcile to server response after success.)
 */
