import { useState } from 'react';
import { createMember } from '../api/client';
import { useApp } from '../context/AppContext';

export function AddMemberForm() {
  const { refreshTeam, addNotification } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');

  async function handleSubmit(e) {
    e.preventDefault();
    const created = await createMember({ name, email, role });
    refreshTeam();
    addNotification(`Added ${created.name}`);
    setName('');
    setEmail('');
    setRole('member');
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, padding: 16 }}>
      <input
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <select value={role} onChange={(e) => setRole(e.target.value)}>
        <option>member</option>
        <option>admin</option>
        <option>viewer</option>
      </select>
      <button>Add member</button>
    </form>
  );
}
