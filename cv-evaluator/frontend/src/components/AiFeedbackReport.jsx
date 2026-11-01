import React from 'react';

export default function AiFeedbackReport({ aiEvaluation, onOpenKeyModal }) {
  if (!aiEvaluation) return null;

  const {
    status,
    error_message,
    ai_score,
    summary,
    strengths,
    weaknesses,
    improvement_recommendations,
    suggested_project_ideas,
    suggested_bullet_rewrites
  } = aiEvaluation;

  if (status === 'skipped') {
    return (
      <div className="card" style={{ borderStyle: 'dashed' }}>
        <div className="card-title">
          <span>Step 3: AI Model Deep Evaluation & Roadmap</span>
          <span className="tag tag-warning">API Key Required</span>
        </div>
        <div style={{ textAlign: 'center', padding: '24px 10px' }}>
          <div style={{ fontSize: '2.2rem', marginBottom: 12 }}>🤖</div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: 8 }}>
            Unlock Tailored AI Feedback & Bullet Rewrites
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: 500, margin: '0 auto 18px auto' }}>
            Your CV passed the legitimacy check! To generate an executive hiring critique, concrete project recommendations, and line-by-line STAR bullet rewrites, provide your AI model API key.
          </p>
          <button className="btn-primary" onClick={onOpenKeyModal}>
            🔑 Configure AI API Key
          </button>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="card" style={{ borderColor: 'rgba(239, 68, 68, 0.4)' }}>
        <div className="card-title" style={{ color: 'var(--accent-red)' }}>
          <span>Step 3: AI Evaluation Error</span>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 12 }}>
          {error_message || 'Failed to communicate with the AI model provider. Please verify your API key and network connection.'}
        </p>
        <button className="btn-secondary" onClick={onOpenKeyModal}>
          Update API Key
        </button>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-title">
        <span>Step 3: AI Model Evaluation & Improvement Roadmap</span>
        {ai_score !== null && (
          <span style={{ 
            fontFamily: 'var(--font-mono)', 
            fontWeight: 700, 
            color: 'var(--accent-blue)', 
            fontSize: '1.1rem' 
          }}>
            AI Score: {ai_score}/100
          </span>
        )}
      </div>

      {/* Summary */}
      {summary && (
        <div className="section-block">
          <div className="section-label">Executive Recruiter Summary</div>
          <div style={{ 
            background: 'var(--bg-primary)', 
            padding: '14px 16px', 
            borderRadius: 'var(--radius-md)', 
            fontSize: '0.88rem', 
            lineHeight: 1.6,
            borderLeft: '3px solid var(--accent-blue)'
          }}>
            {summary}
          </div>
        </div>
      )}

      {/* Strengths & Weaknesses Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20, marginBottom: 24 }}>
        {strengths && strengths.length > 0 && (
          <div>
            <div className="section-label" style={{ color: '#4ade80' }}>Key Strengths for Target Role</div>
            <ul className="feedback-list strengths">
              {strengths.map((str, idx) => (
                <li key={idx}>{str}</li>
              ))}
            </ul>
          </div>
        )}

        {weaknesses && weaknesses.length > 0 && (
          <div>
            <div className="section-label" style={{ color: '#fbbf24' }}>Critical Gaps & Areas to Strengthen</div>
            <ul className="feedback-list weaknesses">
              {weaknesses.map((w, idx) => (
                <li key={idx}>{w}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Improvement Roadmap */}
      {improvement_recommendations && improvement_recommendations.length > 0 && (
        <div className="section-block">
          <div className="section-label">How to Improve This CV (Actionable Recommendations)</div>
          <ul className="feedback-list recommendations">
            {improvement_recommendations.map((rec, idx) => (
              <li key={idx}>{rec}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommended Projects */}
      {suggested_project_ideas && suggested_project_ideas.length > 0 && (
        <div className="section-block">
          <div className="section-label">Suggested Portfolio Projects to Stand Out</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {suggested_project_ideas.map((proj, idx) => (
              <div 
                key={idx} 
                style={{ 
                  background: 'var(--bg-primary)', 
                  padding: '10px 14px', 
                  borderRadius: 'var(--radius-sm)', 
                  border: '1px solid var(--border-color)',
                  fontSize: '0.85rem'
                }}
              >
                🛠️ {proj}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bullet Rewrites */}
      {suggested_bullet_rewrites && suggested_bullet_rewrites.length > 0 && (
        <div className="section-block" style={{ marginBottom: 0 }}>
          <div className="section-label">Resume Bullet Rewrites (STAR / Quantifiable Impact)</div>
          {suggested_bullet_rewrites.map((rewrite, idx) => (
            <div key={idx} className="rewrite-card">
              <div className="rewrite-original">
                ✕ Original: {rewrite.original_example}
              </div>
              <div className="rewrite-improved">
                ✓ Improved: {rewrite.improved_version}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
