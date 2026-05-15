import { useEffect, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { TeamList } from './components/TeamList';
import { MemberProfile } from './components/MemberProfile';
import { AddMemberForm } from './components/AddMemberForm';
import { FeedbackModal } from './components/FeedbackModal';
import { Header } from './components/Header';
import { login } from './api/client';

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}

function Shell() {
  const { user, setUser } = useApp();
  const [selectedId, setSelectedId] = useState(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch('/api/me', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(setUser);
    }
  }, []);

  async function handleLogin(email, password) {
    const u = await login(email, password);
    setUser(u);
  }

  if (!user) {
    return (
      <div>
        <h1>Sign in</h1>
        <button onClick={() => handleLogin('demo@x.com', 'pw')}>Demo login</button>
      </div>
    );
  }

  return (
    <div>
      <Header onOpenFeedback={() => setFeedbackOpen(true)} />
      <main style={{ display: 'flex' }}>
        <TeamList onSelect={(id) => setSelectedId(id)} selectedId={selectedId} />
        {selectedId && <MemberProfile memberId={selectedId} />}
      </main>
      <AddMemberForm />
      {feedbackOpen && <FeedbackModal onClose={() => setFeedbackOpen(false)} />}
    </div>
  );
}
