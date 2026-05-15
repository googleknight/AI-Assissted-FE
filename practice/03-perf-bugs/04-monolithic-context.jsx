/**
 * PRACTICE 04 — Monolithic context causes cascades
 * Difficulty: Medium-Hard
 * Time target: 3 minutes
 *
 * Task: Opening any modal causes the DataGrid (rendering 500 rows) to
 * re-render. Find why. Restructure.
 */

import { createContext, useContext, useState } from 'react';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [data, setData] = useState([]);
  const [modal, setModal] = useState(null);          // which modal is open
  const [notifications, setNotifications] = useState([]);
  const [theme, setTheme] = useState('light');

  return (
    <AppContext.Provider value={{
      user, setUser,
      data, setData,
      modal, setModal,
      notifications, setNotifications,
      theme, setTheme,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() { return useContext(AppContext); }

export function DataGrid() {
  const { data } = useApp();
  console.log('DataGrid render');
  // imagine this renders 500 rows
  return <div>{data.length} rows</div>;
}

export function ModalRoot() {
  const { modal, setModal } = useApp();
  if (!modal) return null;
  return <div role="dialog">{modal} <button onClick={() => setModal(null)}>x</button></div>;
}

export function HeaderBell() {
  const { notifications } = useApp();
  return <span>🔔 {notifications.length}</span>;
}

/**
 * QUESTIONS:
 * 1. Why does opening a modal re-render DataGrid?
 * 2. Fix A: useMemo on the provider value — does this help here? (No — value
 *    changes whenever any slice changes.)
 * 3. Fix B: split contexts (ModalContext, DataContext, etc.).
 * 4. Fix C: useReducer + state+dispatch split.
 * 5. Fix D: external store (Zustand) with selectors.
 *    Which fits a brownfield codebase best?
 */
