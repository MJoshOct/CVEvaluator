import React from 'react';

export default function Header({ apiKey, onOpenKeyModal, onOpenHistory, historyCount }) {
  return (
    <header className="header">
      <div className="brand">
        <div className="brand-icon">CV</div>
        <div>
          <h1 className="brand-title">CV Evaluator & Career Advisor</h1>
          <p className="brand-subtitle">Predefined dataset role matching & AI enhancement roadmap</p>
        </div>
      </div>
      <div className="header-actions">
        <button 
          className="btn-secondary" 
          onClick={onOpenKeyModal}
          title="Configure Google Gemini or OpenAI API Key"
        >
          <span style={{ 
            width: 8, 
            height: 8, 
            borderRadius: '50%', 
            backgroundColor: apiKey ? 'var(--accent-green)' : 'var(--accent-amber)' 
          }} />
          {apiKey ? 'AI Key Set' : 'Set AI Key'}
        </button>

        <button 
          className="btn-secondary" 
          onClick={onOpenHistory}
          title="View past evaluations stored in database"
        >
          <span>📜 History</span>
          {historyCount > 0 && (
            <span style={{ 
              background: 'var(--bg-tertiary)', 
              borderRadius: '10px', 
              padding: '1px 6px', 
              fontSize: '0.75rem' 
            }}>
              {historyCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
