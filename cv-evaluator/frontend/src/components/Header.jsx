import React from 'react';

export default function Header({ apiKey, onOpenKeyModal, onOpenHistory, historyCount }) {
  return (
    <header className="header">
      <div className="brand">
        <div className="brand-icon">CV</div>
        <div>
          <h1 className="brand-title">CV Evaluator</h1>
          <p className="brand-subtitle">AI-powered resume analysis &amp; career advisor</p>
        </div>
      </div>

      <div className="header-actions">
        {/* Powered-by badge */}
        <span className="header-badge">
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--blue)', display: 'inline-block',
            boxShadow: '0 0 6px var(--blue)', flexShrink: 0
          }} />
          Django + React
        </span>

        {/* AI Key button */}
        <button
          className="btn-secondary"
          onClick={onOpenKeyModal}
          title="Configure AI API Key (Groq / Gemini / OpenAI)"
          style={{ gap: 7 }}
        >
          <span style={{
            width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
            background: apiKey ? 'var(--green)' : 'var(--amber)',
            boxShadow: apiKey
              ? '0 0 6px rgba(52,211,153,0.6)'
              : '0 0 6px rgba(251,191,36,0.6)',
          }} />
          {apiKey ? 'AI Key Active' : 'Set AI Key'}
        </button>

        {/* History button */}
        <button
          className="btn-secondary"
          onClick={onOpenHistory}
          title="View evaluation history from database"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          History
          {historyCount > 0 && (
            <span style={{
              background: 'var(--blue-tint)',
              color: 'var(--blue)',
              border: '1px solid rgba(56,189,248,0.25)',
              borderRadius: 'var(--radius-pill)',
              padding: '0 7px',
              fontSize: '0.7rem',
              fontWeight: 700,
              lineHeight: '18px',
              minWidth: 20,
              textAlign: 'center',
            }}>
              {historyCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
