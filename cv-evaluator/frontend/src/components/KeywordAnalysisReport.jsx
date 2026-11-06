import React from 'react';

export default function KeywordAnalysisReport({ keywordData }) {
  if (!keywordData) return null;

  const {
    keyword_score = 0,
    present_keywords = [],
    missing_keywords = [],
    weak_keywords = [],
    suggested_keywords = [],
    weak_phrases = []
  } = keywordData;

  const score = Math.round(Number(keyword_score) || 0);

  return (
    <div className="card">
      <div className="card-title">
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>📊</span>
          <span>Step 2b: Keyword Intelligence</span>
        </span>
        <span
          style={{
            fontSize: '0.8rem',
            fontFamily: 'var(--font-mono)',
            color: 'var(--accent-blue)',
            fontWeight: 600
          }}
        >
          Density & Relevancy
        </span>
      </div>

      {/* Score and Progress Bar */}
      <div className="keyword-score-row">
        <div className="keyword-score-num">{score}%</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 600, marginBottom: 4 }}>
            <span>Target Role Keyword Coverage</span>
            <span style={{ color: score >= 75 ? '#4ade80' : score >= 50 ? '#fbbf24' : '#f87171' }}>
              {score >= 75 ? 'High Alignment' : score >= 50 ? 'Moderate Coverage' : 'Low Coverage'}
            </span>
          </div>
          <div className="progress-bar-bg">
            <div
              className="progress-bar-fill"
              style={{
                width: `${Math.min(Math.max(score, 5), 100)}%`,
                background: score >= 75
                  ? 'linear-gradient(90deg, #22c55e, #4ade80)'
                  : score >= 50
                  ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                  : 'linear-gradient(90deg, #ef4444, #f87171)'
              }}
            />
          </div>
        </div>
      </div>

      {/* Present Keywords (Green) */}
      <div className="section-block">
        <div className="section-label" style={{ color: '#4ade80' }}>
          ✓ Present Keywords Detected ({present_keywords.length})
        </div>
        <div className="tag-list">
          {present_keywords.map((kw, idx) => (
            <span key={`pres-${idx}`} className="tag tag-success">
              ✓ {kw}
            </span>
          ))}
          {present_keywords.length === 0 && (
            <span className="tag tag-neutral">No exact target keywords found</span>
          )}
        </div>
      </div>

      {/* Weak Keywords (Yellow - 1 mention only) */}
      {weak_keywords.length > 0 && (
        <div className="section-block">
          <div className="section-label" style={{ color: '#fbbf24' }}>
            ⚠ Weak Keywords (Single Mention Only — Consider Reinforcing)
          </div>
          <div className="tag-list">
            {weak_keywords.map((kw, idx) => (
              <span key={`weak-${idx}`} className="tag tag-warning">
                ⚠ {kw} (1 mention)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Missing Keywords (Red) */}
      {missing_keywords.length > 0 && (
        <div className="section-block">
          <div className="section-label" style={{ color: '#f87171' }}>
            ✗ Critical Missing Keywords ({missing_keywords.length})
          </div>
          <div className="tag-list">
            {missing_keywords.map((kw, idx) => (
              <span key={`miss-${idx}`} className="tag tag-danger">
                ✗ {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Top Keywords to Add (Suggested) */}
      {suggested_keywords.length > 0 && (
        <div className="section-block">
          <div className="section-label" style={{ color: 'var(--accent-blue)' }}>
            💡 Top High-Impact Keywords to Add
          </div>
          <div className="tag-list" style={{ marginBottom: 6 }}>
            {suggested_keywords.map((kw, idx) => (
              <span key={`sug-${idx}`} className="tag tag-blue-outline">
                + {kw}
              </span>
            ))}
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Weaving these core keywords naturally into your experience bullet points significantly lifts search relevancy.
          </p>
        </div>
      )}

      {/* Weak Phrases Section */}
      {weak_phrases.length > 0 && (
        <div className="section-block" style={{ marginBottom: 0 }}>
          <div className="section-label" style={{ color: '#fbbf24' }}>
            Weak / Generic Action Verbs
          </div>
          <div className="tag-list" style={{ marginBottom: 8 }}>
            {weak_phrases.map((phrase, idx) => (
              <span key={`phr-${idx}`} className="tag tag-warning">
                "{phrase}"
              </span>
            ))}
          </div>
          <div
            style={{
              fontSize: '0.78rem',
              color: '#fbbf24',
              background: 'rgba(251, 191, 36, 0.08)',
              border: '1px solid rgba(251, 191, 36, 0.2)',
              borderRadius: 'var(--radius-sm)',
              padding: '8px 12px'
            }}
          >
            ⚠️ Replace with achievement-oriented language and quantifiable impact (e.g. "Spearheaded", "Architected", "Accelerated").
          </div>
        </div>
      )}
    </div>
  );
}
