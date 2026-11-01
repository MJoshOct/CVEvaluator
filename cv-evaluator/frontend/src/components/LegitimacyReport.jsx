import React from 'react';

export default function LegitimacyReport({ legitimacy }) {
  if (!legitimacy) return null;

  const { is_legitimate, score, detected_sections, missing_sections, word_count, notes } = legitimacy;

  return (
    <div className={`status-banner ${is_legitimate ? 'pass' : 'fail'}`}>
      <div style={{ fontSize: '1.6rem' }}>
        {is_legitimate ? '✅' : '❌'}
      </div>
      <div style={{ flex: 1 }}>
        <div className="status-title">
          {is_legitimate ? 'Passed Legitimate CV Verification' : 'Failed Legitimate CV Verification'}
          <span style={{ 
            marginLeft: 10, 
            fontSize: '0.8rem', 
            fontFamily: 'var(--font-mono)', 
            opacity: 0.85 
          }}>
            Score: {score}/100 ({word_count} words)
          </span>
        </div>

        <div className="status-details">
          {is_legitimate ? (
            <p>
              The document meets structural resume standards including contact details, valid section hierarchy, and adequate length.
            </p>
          ) : (
            <p>
              The document lacks fundamental attributes of a genuine CV/Resume. AI evaluation is suspended until these requirements are met.
            </p>
          )}
        </div>

        {/* Section Tags */}
        <div className="tag-list">
          {detected_sections.map((sec, idx) => (
            <span key={idx} className="tag tag-success">✓ {sec}</span>
          ))}
          {missing_sections.map((sec, idx) => (
            <span key={idx} className="tag tag-danger">✗ Missing: {sec}</span>
          ))}
        </div>

        {/* Notes/Reasons if any */}
        {notes && notes.length > 0 && (
          <div style={{ marginTop: 8, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <ul style={{ paddingLeft: 18 }}>
              {notes.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
