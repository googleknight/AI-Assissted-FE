import { useEffect, useState } from 'react';
import { authedFetch, updateMemberNotes } from '../api/client';

export function MemberProfile({ memberId }) {
  const [member, setMember] = useState(null);
  const [notesDraft, setNotesDraft] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    authedFetch(`/api/team/${memberId}`)
      .then(r => r.json())
      .then(m => {
        setMember(m);
        setNotesDraft(m.notes);
      });

    authedFetch(`/api/team/${memberId}/activity`)
      .then(r => r.json())
      .then(a => setMember(prev => ({ ...prev, activity: a })));
  }, [memberId]);

  async function handleSave() {
    setSaving(true);
    await updateMemberNotes(memberId, notesDraft);
    setSaving(false);
  }

  return (
    <section style={{ padding: 16, flex: 1 }}>
      <h2>{member.name}</h2>
      <a href={member.website} target="_blank">{member.website}</a>
      <h3>Bio</h3>
      <div dangerouslySetInnerHTML={{ __html: member.bio }} />
      <h3>Notes</h3>
      <textarea
        value={notesDraft}
        onChange={(e) => setNotesDraft(e.target.value)}
        rows={6}
        style={{ width: '100%' }}
      />
      <button onClick={handleSave}>
        {saving ? 'Saving...' : 'Save notes'}
      </button>
      <h3>Recent activity</h3>
      <ul>
        {member.activity && member.activity.map(a => <li>{a.text}</li>)}
      </ul>
    </section>
  );
}
