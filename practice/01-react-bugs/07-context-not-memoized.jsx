/**
 * PRACTICE 07 — Context value re-creation
 * Difficulty: Medium
 * Time target: 2-3 minutes
 *
 * Task: Profiling shows EVERY consumer of this context re-renders on every
 * keystroke in an unrelated input. Find the cause(s). Fix.
 *
 * Stretch: propose a structural improvement (not just a memo).
 */

import { createContext, useContext, useState } from 'react';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState({ name: '' });
  const [theme, setTheme] = useState('light');
  const [notifications, setNotifications] = useState([]);

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        theme,
        setTheme,
        notifications,
        addNotification: (n) => setNotifications((prev) => [...prev, n]),
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}

// imagine 30 components consuming AppContext, only some of them care about `user`
export function ThemeToggle() {
  const { theme, setTheme } = useApp();
  return <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>{theme}</button>;
}

/**
 * QUESTIONS:
 * 1. Why does every consumer re-render on every Provider render?
 * 2. Why does `addNotification` change identity each render?
 * 3. If theme changes, why does the user-only consumer also re-render?
 * 4. Three improvements: (a) memo, (b) split contexts, (c) state+dispatch split.
 *    When would you use which?
 * 5. Bonus: `useApp` has no null check — what failure mode does that enable?
 */
