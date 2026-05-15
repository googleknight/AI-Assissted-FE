import { createContext, useContext, useEffect, useState } from 'react';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [team, setTeam] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/team').then(r => r.json()).then(setTeam);
    fetch('/api/notifications').then(r => r.json()).then(setNotifications);
  }, []);

  function refreshTeam() {
    fetch('/api/team').then(r => r.json()).then(setTeam);
  }

  function addNotification(text) {
    setNotifications([...notifications, { id: Date.now(), text }]);
  }

  return (
    <AppContext.Provider value={{
      user, setUser,
      team, setTeam, refreshTeam,
      notifications, addNotification,
      theme, setTheme,
      search, setSearch,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
