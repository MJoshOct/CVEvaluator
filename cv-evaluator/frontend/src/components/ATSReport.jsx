import React from 'react';

export default function ATSReport({ atsData }) {
  if (!atsData) return null;

  const {
    ats_score = 0,
    ats_grade = 'N/A',
    detected_sections = [],
    missing_sections = [],
    formatting_issues = [],
    ats_tips = [],
    weak_phrases_found = [],
    word_count = 0
  } = atsData;

  const score = Math.round(Number(ats_score) || 0);

  // Score color logic
  let scoreColor = '#f87171'; // red < 60
  let gradeBadgeClass = 'tag-danger';
  if (score >= 80) {
    scoreColor = '#4ade80'; // green >= 80
    gradeBadgeClass = 'tag-success';
  } else if (score >= 60) {
    scoreColor = '#fbbf24'; // yellow >= 60
    gradeBadgeClass = 'tag-warning';
  }

  // SVG Gauge calculations
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(Math.max(score, 0), 100) / 100) * circumference;

  return (
    <div className="card">
      <div className="card-title">
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>🤖</span>
          <span>Step 1b: ATS Compatibility Score</span>
        </span>
        <span className={`tag ${gradeBadgeClass}`} style={{ fontSize: '0.8rem', padding: '3px 10px' }}>
          {ats_grade} ATS Profile
        </span>
      </div>

      {/* Top Gauge & Metrics Row */}
      <div className="ats-gauge-wrap">
        <div className="ats-circle">
          <svg viewBox="0 0 100 100">
            <circle
              className="bg-circle"
              cx="50"
              cy="50"
              r={radius}
            />
            <circle
              className="progress-circle"
              cx="50"
              cy="50"
              r={radius}
              stroke={scoreColor}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
            />
          </svg>
          <div className="ats-score-text">
            <span className="ats-score-number" style={{ color: scoreColor }}>
              {score}
            </span>
            <span className="ats-grade">{ats_grade}</span>
          </div>
        </div>

        <div className="ats-info-col">
          <div className="ats-info-title">
            Applicant Tracking System Readiness
          </div>
          <div className="ats-info-desc">
            {score >= 80
              ? 'Your CV adheres strongly to ATS parsing conventions, section layouts, and keyword structure.'
              : score >= 60
              ? 'Your CV is readable by most ATS parsers, but addressing missing sections and formatting warnings will prevent drop-offs.'
              : 'Your resume may encounter parsing errors or low algorithmic ranking in automated screening systems.'}
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <span>📄 Word Count: <strong style={{ color: 'var(--text-main)' }}>{word_count}</strong></span>
            <span>📑 Sections Found: <strong style={{ color: '#4ade80' }}>{detected_sections.length}</strong></span>
            <span>⚠️ Issues: <strong style={{ color: formatting_issues.length > 0 ? '#f87171' : '#4ade80' }}>{formatting_issues.length}</strong></span>
          </div>
        </div>
      </div>

      {/* Detected and Missing Sections */}
      <div className="section-block">
        <div className="section-label">ATS Section Hierarchy Detection</div>
        <div className="tag-list">
          {detected_sections.map((sec, idx) => (
            <span key={`detected-${idx}`} className="tag tag-success">
              ✓ {sec}
            </span>
          ))}
          {missing_sections.map((sec, idx) => (
            <span key={`missing-${idx}`} className="tag tag-danger">
              ✗ Missing: {sec}
            </span>
          ))}
          {detected_sections.length === 0 && missing_sections.length === 0 && (
            <span className="tag tag-neutral">No standard section headers analyzed</span>
          )}
        </div>
      </div>

      {/* Formatting Issues */}
      {formatting_issues.length > 0 && (
        <div className="section-block">
          <div className="section-label" style={{ color: '#f87171' }}>
            Formatting & Parsing Warnings ({formatting_issues.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {formatting_issues.map((issue, idx) => (
              <div
                key={`issue-${idx}`}
                style={{
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.22)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 14px',
                  fontSize: '0.84rem',
                  color: '#fca5a5',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10
                }}
              >
                <span>⚠️</span>
                <span style={{ flex: 1, lineHeight: 1.5 }}>{issue}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weak Phrases Found */}
      {weak_phrases_found.length > 0 && (
        <div className="section-block">
          <div className="section-label" style={{ color: '#fbbf24' }}>
            Weak / Passive Phrases Detected
          </div>
          <div className="tag-list" style={{ marginBottom: 6 }}>
            {weak_phrases_found.map((phrase, idx) => (
              <span key={`phrase-${idx}`} className="tag tag-warning">
                "{phrase}"
              </span>
            ))}
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Tip: Replace passive responsibilities with quantified outcomes and active verbs (e.g., "Spearheaded", "Engineered", "Reduced").
          </p>
        </div>
      )}

      {/* ATS Tips */}
      {ats_tips.length > 0 && (
        <div className="section-block" style={{ marginBottom: 0 }}>
          <div className="section-label" style={{ color: 'var(--accent-blue)' }}>
            Actionable ATS Optimization Tips
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ats_tips.map((tip, idx) => (
              <div
                key={`tip-${idx}`}
                style={{
                  background: 'rgba(56, 189, 248, 0.07)',
                  border: '1px solid rgba(56, 189, 248, 0.2)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 14px',
                  fontSize: '0.84rem',
                  color: '#bae6fd',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10
                }}
              >
                <span>💡</span>
                <span style={{ flex: 1, lineHeight: 1.5 }}>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
