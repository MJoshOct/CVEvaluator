import React from 'react';

export default function HistoryModal({ isOpen, onClose, history, onSelectRecord }) {
  if (!isOpen) return null;

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      + ' · '
      + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const roleLabel = (id) =>
    id ? id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Unknown';

  const scoreColor = (score) => {
    if (score >= 75) return 'var(--green)';
    if (score >= 50) return 'var(--blue)';
    if (score >= 30) return 'var(--amber)';
    return 'var(--red)';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: 660 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Evaluation History</h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
              Stored in PostgreSQL · Click any record to reload it
            </p>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2.2rem', marginBottom: 10 }}>📭</div>
            <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>No evaluations saved yet</p>
            <p style={{ fontSize: '0.8rem', marginTop: 4 }}>Evaluate a CV to see your history here.</p>
          </div>
        ) : (
          <>
            {/* Summary strip */}
            <div style={{
              display: 'flex',
              gap: 20,
              padding: '10px 14px',
              marginBottom: 14,
              background: 'rgba(56,189,248,0.04)',
              border: '1px solid rgba(56,189,248,0.1)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
            }}>
              <span><strong style={{ color: 'var(--blue)' }}>{history.length}</strong> evaluations</span>
              <span><strong style={{ color: 'var(--green)' }}>
                {history.filter(h => h.is_legitimate).length}
              </strong> legitimate CVs</span>
              <span><strong style={{ color: 'var(--blue)' }}>
                {history.filter(h => h.ai_evaluated).length}
              </strong> AI-enhanced</span>
            </div>

            <div style={{ maxHeight: '420px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {history.map((item, idx) => (
                <div
                  key={item.id}
                  className="history-item"
                  style={{ animationDelay: `${idx * 0.04}s`, animation: 'fadeUp 0.3s ease both' }}
                  onClick={() => { onSelectRecord(item.id); onClose(); }}
                >
                  {/* Left: identity */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="history-item-name">
                      {item.candidate_name || `Evaluation #${item.id}`}
                    </div>
                    <div className="history-item-meta">
                      <span style={{
                        background: 'rgba(255,255,255,0.05)',
                        padding: '1px 7px',
                        borderRadius: 'var(--radius-pill)',
                        marginRight: 6,
                        fontWeight: 600,
                      }}>
                        {roleLabel(item.target_role)}
                      </span>
                      {formatDate(item.created_at)}
                    </div>
                  </div>

                  {/* Right: scores & badges */}
                  <div className="history-item-scores">
                    <span className={`tag ${item.is_legitimate ? 'tag-success' : 'tag-danger'}`}>
                      {item.is_legitimate ? '✓ Valid CV' : '✕ Invalid'}
                    </span>
                    {item.ats_score != null && (
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase' }}>ATS</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.88rem', color: scoreColor(item.ats_score) }}>
                          {Math.round(item.ats_score)}
                        </div>
                      </div>
                    )}
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase' }}>Score</div>
                      <div className="history-score-num" style={{ color: scoreColor(item.predefined_score) }}>
                        {Math.round(item.predefined_score || 0)}%
                      </div>
                    </div>
                    {item.ai_evaluated && (
                      <span style={{
                        fontSize: '0.65rem', padding: '2px 7px',
                        borderRadius: 'var(--radius-pill)', fontWeight: 700,
                        background: 'var(--purple-tint)', color: 'var(--purple)',
                        border: '1px solid rgba(167,139,250,0.25)',
                        flexShrink: 0,
                      }}>AI ✓</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
