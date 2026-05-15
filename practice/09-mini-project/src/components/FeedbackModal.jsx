import { useState } from 'react';
import { authedFetch } from '../api/client';

export function FeedbackModal({ onClose }) {
  const [category, setCategory] = useState('bug');
  const [message, setMessage] = useState('');

  async function send() {
    await authedFetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, message }),
    });
    onClose();
  }

  return (
    <div style={overlay}>
      <div style={dialog} role="dialog">
        <h2>Send feedback</h2>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="bug">Bug</option>
          <option value="feature">Feature</option>
        </select>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={6}
          placeholder="What's on your mind?"
        />
        <div>
          <button onClick={onClose}>Cancel</button>
          <button onClick={send}>Send</button>
        </div>
      </div>
    </div>
  );
}

const overlay = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};
const dialog = {
  background: 'white', padding: 16, borderRadius: 8, minWidth: 400,
};
