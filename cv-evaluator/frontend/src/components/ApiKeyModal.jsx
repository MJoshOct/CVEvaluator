import React, { useState } from 'react';

const PROVIDERS = [
  {
    id: 'groq',
    name: 'Groq',
    prefix: 'gsk_',
    badge: 'Free · Ultra-Fast',
    badgeColor: 'var(--green)',
    badgeBg: 'var(--green-tint)',
    badgeBorder: 'var(--green-border)',
    link: 'https://console.groq.com/keys',
    model: 'Llama 3.3 70B',
    icon: '⚡',
    desc: 'Free API, fastest inference, recommended for most users.',
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    prefix: 'AIza',
    badge: 'Free Tier',
    badgeColor: 'var(--blue)',
    badgeBg: 'var(--blue-tint)',
    badgeBorder: 'rgba(56,189,248,0.25)',
    link: 'https://aistudio.google.com/app/apikey',
    model: 'Gemini 1.5 Flash',
    icon: '🔵',
    desc: 'Google AI Studio — generous free quota.',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    prefix: 'sk-',
    badge: 'Paid',
    badgeColor: 'var(--amber)',
    badgeBg: 'var(--amber-tint)',
    badgeBorder: 'var(--amber-border)',
    link: 'https://platform.openai.com/api-keys',
    model: 'GPT-4o Mini',
    icon: '🤖',
    desc: 'Premium quality, requires paid credits.',
  },
];

export default function ApiKeyModal({ isOpen, onClose, currentKey, onSaveKey }) {
  const [keyInput, setKeyInput] = useState(currentKey || '');
  const [showKey, setShowKey] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveKey(keyInput.trim());
    onClose();
  };

  const handleClear = () => {
    setKeyInput('');
    onSaveKey('');
  };

  // Detect provider from key prefix
  const detectedProvider = keyInput
    ? PROVIDERS.find(p => keyInput.startsWith(p.prefix))
    : null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Configure AI Key</h2>
            <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: 2 }}>
              Stored in browser localStorage only — never sent to our servers
            </p>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Provider cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {PROVIDERS.map((p) => (
            <div
              key={p.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                border: `1px solid ${detectedProvider?.id === p.id ? p.badgeBorder : 'var(--border-color)'}`,
                background: detectedProvider?.id === p.id ? p.badgeBg : 'rgba(255,255,255,0.02)',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: '1.2rem' }}>{p.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{p.name}</span>
                  <span style={{
                    fontSize: '0.6rem', fontWeight: 700,
                    padding: '1px 7px', borderRadius: 'var(--radius-pill)',
                    color: p.badgeColor, background: p.badgeBg, border: `1px solid ${p.badgeBorder}`,
                  }}>{p.badge}</span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>{p.model}</span>
                </div>
                <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: 0 }}>{p.desc}</p>
              </div>
              <a
                href={p.link}
                target="_blank"
                rel="noreferrer"
                style={{
                  fontSize: '0.72rem', fontWeight: 600, color: p.badgeColor,
                  padding: '4px 10px', borderRadius: 'var(--radius-sm)',
                  border: `1px solid ${p.badgeBorder}`, background: p.badgeBg,
                  whiteSpace: 'nowrap', textDecoration: 'none',
                }}
              >
                Get Key →
              </a>
            </div>
          ))}
        </div>

        {/* Key input */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: 7, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Your API Key
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showKey ? 'text' : 'password'}
              className="api-input"
              placeholder="gsk_...  or  AIzaSy...  or  sk-..."
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              autoFocus
              style={{ paddingRight: 44 }}
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              style={{
                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-muted)', fontSize: '0.75rem', padding: '2px 6px',
                borderRadius: 'var(--radius-xs)', transition: 'color 0.15s',
              }}
            >
              {showKey ? '🙈' : '👁'}
            </button>
          </div>

          {/* Detection feedback */}
          {keyInput && (
            <div style={{ marginTop: 7, fontSize: '0.75rem' }}>
              {detectedProvider ? (
                <span style={{ color: detectedProvider.badgeColor }}>
                  ✓ Detected: <strong>{detectedProvider.name}</strong> key — will use {detectedProvider.model}
                </span>
              ) : (
                <span style={{ color: 'var(--text-dim)' }}>
                  ⚠ Unrecognized key prefix — make sure you're copying the full key
                </span>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {currentKey ? (
            <button
              type="button"
              className="btn-ghost"
              style={{ color: 'var(--red)', fontSize: '0.82rem' }}
              onClick={handleClear}
            >
              🗑 Clear Key
            </button>
          ) : <div />}

          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button
              type="button"
              className="btn-primary"
              onClick={handleSave}
              disabled={!keyInput.trim()}
            >
              Save Key
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
