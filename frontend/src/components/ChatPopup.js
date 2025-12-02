// ChatPopup.js (No logic change, just assuming it needs a structural element for a new KickedOut component)

import React, { useState } from 'react';
import '../styles/chat.css';

export default function ChatPopup({ messages, participants, onSend }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('chat');
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    onSend?.(input.trim());
    setInput('');
  };

  if (!open) {
    return (
      <button className="chat-fab" onClick={() => setOpen(true)}>
        💬
      </button>
    );
  }

  return (
    <div className="chat-popup">
      <div className="chat-header">
        <button
          className={tab === 'chat' ? 'active' : ''}
          onClick={() => setTab('chat')}
        >
          Chat
        </button>
        <button
          className={tab === 'participants' ? 'active' : ''}
          onClick={() => setTab('participants')}
        >
          Participants
        </button>
        <span className="chat-close" onClick={() => setOpen(false)}>×</span>
      </div>

      {tab === 'chat' ? (
        <div className="chat-body">
          <div className="chat-messages">
            {messages.map((m, idx) => (
              <div key={idx} className={`chat-message ${m.role}`}>
                <span className="chat-author">{m.author}</span>
                <span className="chat-text">{m.text}</span>
              </div>
            ))}
          </div>
          <div className="chat-input-row">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message…"
            />
            <button onClick={handleSend}>Send</button>
          </div>
        </div>
      ) : (
        <div className="chat-body participants">
          {participants.map((p) => (
            <div key={p.id} className="participant-row">
              {p.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}