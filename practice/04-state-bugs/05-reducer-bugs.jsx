/**
 * PRACTICE 05 — useReducer pitfalls
 * Difficulty: Medium
 * Time target: 3 minutes
 *
 * Task: This reducer has several bugs. Find at least four.
 */

import { useReducer } from 'react';

const initial = {
  items: [],
  loading: false,
  error: null,
  selectedId: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'LOAD_START':
      state.loading = true;
      state.error = null;
      return state;

    case 'LOAD_SUCCESS':
      return { items: action.items, loading: false };

    case 'LOAD_ERROR':
      return { ...state, error: action.error, loading: false };

    case 'SELECT':
      return { ...state, selectedId: action.id };

    case 'ADD_ITEM':
      state.items.push(action.item);
      return { ...state, items: state.items };

    default:
      return state;
  }
}

export function ItemsView() {
  const [state, dispatch] = useReducer(reducer, initial);
  return (
    <div>
      <button onClick={() => dispatch({ type: 'LOAD_START' })}>Reload</button>
      <p>{state.loading ? 'loading' : `${state.items.length} items`}</p>
    </div>
  );
}

/**
 * QUESTIONS — find at least 4 bugs:
 * 1. `LOAD_START` mutates state (no spread). React's bail-out: same ref = no re-render.
 * 2. `LOAD_SUCCESS` drops `selectedId` and `error`. Spread to preserve.
 * 3. `ADD_ITEM` mutates `state.items` array. Mutation breaks time-travel + memo'd selectors.
 * 4. `default` returns the same state but no `throw` for unknown actions — typos silently no-op.
 * 5. No action type constants — typos in dispatch are silent.
 * 6. No TS — types catch most of this.
 *
 * Rewrite. Mention Immer/RTK if you'd reach for them.
 */
