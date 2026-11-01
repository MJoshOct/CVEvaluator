import React from 'react';

export default function HistoryModal({ isOpen, onClose, history, onSelectRecord }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Evaluation History (Database Records)</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>
            No evaluations saved yet. Evaluate a CV to see history here.
          </div>
        ) : (
          <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {history.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  onSelectRecord(item.id);
                  onClose();
                }}
                style={{
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px 16px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'border-color 0.15s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-blue)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                    {item.candidate_name || `Evaluation #${item.id}`}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Role: <span style={{ textTransform: 'capitalize' }}>{item.target_role.replace('_', ' ')}</span> • {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className={`tag ${item.is_legitimate ? 'tag-success' : 'tag-danger'}`}>
                    {item.is_legitimate ? 'Legitimate' : 'Non-CV'}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.95rem' }}>
                    {item.predefined_score}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 20, textAlign: 'right' }}>
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
