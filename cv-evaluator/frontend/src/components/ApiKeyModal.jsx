import React, { useState } from 'react';

export default function ApiKeyModal({ isOpen, onClose, currentKey, onSaveKey }) {
  const [keyInput, setKeyInput] = useState(currentKey || '');
  const [provider, setProvider] = useState('auto');

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveKey(keyInput.trim());
    onClose();
  };

  const handleClear = () => {
    setKeyInput('');
    onSaveKey('');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Configure AI API Key</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16 }}>
          The web app evaluates legitimate CVs using an AI model. You can provide your free <strong>Groq API key</strong> (<a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-blue)', textDecoration: 'underline' }}>console.groq.com</a>), or a Google Gemini / OpenAI key. Keys are saved in your local browser session.
        </p>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6 }}>
            API Key (Groq / Gemini / OpenAI)
          </label>
          <input
            type="password"
            className="api-input"
            placeholder="gsk_... (Groq Free), AIza... (Gemini), or sk-... (OpenAI)"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            autoFocus
          />
          <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: 5 }}>
            ⚡ Groq keys (starting with <code style={{ color: 'var(--accent-blue)' }}>gsk_</code>) run on ultra-fast free Llama 3.3 70B models automatically.
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 }}>
          {currentKey ? (
            <button 
              type="button" 
              className="btn-secondary" 
              style={{ color: 'var(--accent-red)' }} 
              onClick={handleClear}
            >
              Clear Key
            </button>
          ) : <div />}

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="btn-primary" onClick={handleSave}>
              Save Key
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
