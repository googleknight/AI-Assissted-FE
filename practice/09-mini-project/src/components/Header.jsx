import { useApp } from '../context/AppContext';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useEffect, useState } from 'react';
import { logout } from '../api/client';

export function Header({ onOpenFeedback }) {
  const { user, theme, setTheme, notifications, setSearch } = useApp();
  const [localSearch, setLocalSearch] = useState('');
  const debounced = useDebouncedValue(localSearch, 250);

  useEffect(() => {
    setSearch(debounced);
  }, [debounced]);

  return (
    <header style={{ display: 'flex', padding: 8, borderBottom: '1px solid #ddd' }}>
      <h1>TeamSync</h1>
      <input
        placeholder="Search team..."
        value={localSearch}
        onChange={(e) => setLocalSearch(e.target.value)}
      />
      <div>
        <span>🔔 {notifications.length}</span>
        <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
          Theme: {theme}
        </button>
        <button onClick={onOpenFeedback}>Send feedback</button>
        <button onClick={logout}>Sign out ({user.name})</button>
      </div>
    </header>
  );
}
