import { useApp } from '../context/AppContext';

export function TeamList({ onSelect, selectedId }) {
  const { team, search } = useApp();

  const filtered = team.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <aside style={{ width: 320, borderRight: '1px solid #ddd' }}>
      <h2>Team ({filtered.length})</h2>
      <ul>
        {filtered.map((m, i) => (
          <li
            key={i}
            onClick={() => onSelect(m.id)}
            style={{
              padding: 8,
              background: selectedId === m.id ? '#eef' : 'transparent',
              cursor: 'pointer',
            }}
          >
            <img src={m.avatarUrl} />
            <strong>{m.name}</strong>
            <small>{m.email}</small>
            <span>Last active: {new Date(m.lastActive).toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
