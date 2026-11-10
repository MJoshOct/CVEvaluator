import React from 'react';
import { IconCheck, IconX, IconAlertTriangle } from './Icons';

export default function LegitimacyReport({ legitimacy }) {
  if (!legitimacy) return null;

  const { is_legitimate, score, detected_sections = [], missing_sections = [], word_count, notes = [] } = legitimacy;

  const scoreColor = is_legitimate
    ? (score >= 80 ? 'var(--green)' : 'var(--blue)')
    : (score >= 40 ? 'var(--amber)' : 'var(--red)');

  return (
    <div className={`status-banner ${is_legitimate ? 'pass' : 'fail'}`}>
      {/* Icon */}
      <div style={{
        width: 44, height: 44, borderRadius: 'var(--radius-md)',
        background: is_legitimate ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)',
        border: `1px solid ${is_legitimate ? 'var(--green-border)' : 'var(--red-border)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        color: is_legitimate ? 'var(--green)' : 'var(--red)'
      }}>
        {is_legitimate ? <IconCheck width={22} height={22} /> : <IconX width={22} height={22} />}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
          <div className="status-title">
            {is_legitimate ? 'CV Verification Passed' : 'CV Verification Failed'}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{
              fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.82rem',
              color: scoreColor,
              background: is_legitimate ? 'var(--green-tint)' : 'var(--red-tint)',
              padding: '2px 9px', borderRadius: 'var(--radius-pill)',
              border: `1px solid ${is_legitimate ? 'var(--green-border)' : 'var(--red-border)'}`,
            }}>
              {score}/100
            </span>
            {word_count && (
              <span style={{
                fontSize: '0.75rem', color: 'var(--text-muted)',
                background: 'var(--bg-primary)',
                padding: '2px 8px', borderRadius: 'var(--radius-pill)',
                border: '1px solid var(--border-color)',
              }}>
                {word_count} words
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="status-details" style={{ marginBottom: 10 }}>
          {is_legitimate
            ? 'Document meets structural resume standards — contact info, valid sections, and adequate length detected.'
            : 'Document lacks fundamental CV attributes. AI stage is suspended until core requirements are met.'}
        </div>

        {/* Section tags */}
        {(detected_sections.length > 0 || missing_sections.length > 0) && (
          <div className="tag-list">
            {detected_sections.map((sec, i) => (
              <span key={i} className="tag tag-success" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <IconCheck width={12} height={12} />
                {sec}
              </span>
            ))}
            {missing_sections.map((sec, i) => (
              <span key={i} className="tag tag-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <IconX width={12} height={12} />
                {sec}
              </span>
            ))}
          </div>
        )}

        {/* Notes */}
        {notes.length > 0 && (
          <div style={{ marginTop: 10 }}>
            {notes.map((n, i) => (
              <div key={i} className="tip-box warning" style={{ marginBottom: 4 }}>
                <IconAlertTriangle width={14} height={14} style={{ flexShrink: 0 }} />
                <span>{n}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
