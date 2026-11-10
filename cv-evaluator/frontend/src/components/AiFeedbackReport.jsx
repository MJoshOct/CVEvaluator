import React from 'react';
import {
  IconCpu,
  IconKey,
  IconWrench,
  IconX,
  IconCheck,
  IconDownload,
  IconRefresh
} from './Icons';

export default function AiFeedbackReport({ aiEvaluation, onOpenKeyModal, onOpenImprovedCvModal }) {
  if (!aiEvaluation) return null;

  const {
    status,
    ai_score,
    summary,
    strengths = [],
    weaknesses = [],
    improvement_recommendations = [],
    suggested_project_ideas = [],
    suggested_bullet_rewrites = [],
    error_message,
    model_used,
    provider,
    model_switched,
    switched_from,
    switch_reason
  } = aiEvaluation;

  if (status === 'skipped') {
    return (
      <div className="card" style={{ borderStyle: 'dashed' }}>
        <div className="card-title">
          <span>Step 3: AI Model Deep Evaluation &amp; Roadmap</span>
          <span className="tag tag-warning">API Key Required</span>
        </div>
        <div style={{ textAlign: 'center', padding: '24px 10px' }}>
          <div style={{ marginBottom: 12 }}>
            <IconCpu width={38} height={38} style={{ color: 'var(--blue)', margin: '0 auto' }} />
          </div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: 8 }}>
            Unlock Tailored AI Feedback &amp; Bullet Rewrites
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: 500, margin: '0 auto 18px auto' }}>
            Your CV passed the legitimacy check! To generate an executive hiring critique, concrete project recommendations, and line-by-line STAR bullet rewrites, provide your AI model API key.
          </p>
          <button className="btn-primary" onClick={onOpenKeyModal} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <IconKey width={14} height={14} />
            Configure AI API Key
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
        <div className="tip-box danger" style={{ marginTop: 12 }}>
          {error_message || 'The AI model could not process this request. Check your API key or network connection.'}
        </div>
      </div>
    );
  }

  const scoreBadgeClass =
    ai_score >= 80 ? 'tag-success' : ai_score >= 60 ? 'tag-warning' : 'tag-danger';

  return (
    <div className="card">
      <div className="card-title">
        <span>Step 3: AI Executive Review &amp; Roadmap</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {onOpenImprovedCvModal && (
            <button
              type="button"
              className="btn-primary"
              onClick={onOpenImprovedCvModal}
              style={{ fontSize: '0.8rem', padding: '5px 12px', display: 'inline-flex', alignItems: 'center', gap: 5 }}
            >
              <IconDownload width={13} height={13} />
              <span>Download Improved CV</span>
            </button>
          )}
          {ai_score !== null && ai_score !== undefined && (
            <span className={`tag ${scoreBadgeClass}`}>
              AI Rating: {ai_score}/100
            </span>
          )}
        </div>
      </div>

      {/* Model Auto-Switch Notice */}
      {model_switched && (
        <div style={{
          background: 'var(--amber-tint)',
          border: '1px solid var(--amber-border)',
          borderRadius: 'var(--radius-sm)',
          padding: '10px 14px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.82rem',
          color: '#92400e',
          flexWrap: 'wrap',
          gap: 8
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <IconRefresh width={14} height={14} style={{ color: 'var(--amber)', flexShrink: 0 }} />
            <span>
              <strong>Auto-Switched Model:</strong> Usage/rate limit reached on <code>{switched_from || 'primary model'}</code>. Switched to <strong>{model_used}</strong> with usage remaining.
            </span>
          </div>
          <span className="tag tag-warning" style={{ fontSize: '0.72rem' }}>Failover Protected</span>
        </div>
      )}

      {/* Active Model Indicator */}
      {model_used && !model_switched && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)',
          padding: '7px 12px',
          marginBottom: 16,
          fontSize: '0.78rem',
          color: 'var(--text-muted)'
        }}>
          <span>Active Model: <strong style={{ color: 'var(--text-main)' }}>{model_used}</strong> ({provider ? provider.toUpperCase() : 'AI'})</span>
          <span style={{ color: 'var(--green)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <IconCheck width={12} height={12} />
            Auto-Switch Failover Active
          </span>
        </div>
      )}

      {/* Summary */}
      {summary && (
        <div className="tip-box info" style={{ marginBottom: 20, fontSize: '0.88rem', lineHeight: 1.6 }}>
          <strong>Executive Summary:</strong> {summary}
        </div>
      )}

      {/* Strengths & Weaknesses Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        {/* Strengths */}
        {strengths && strengths.length > 0 && (
          <div style={{ background: 'var(--green-tint)', border: '1px solid var(--green-border)', borderRadius: 'var(--radius-sm)', padding: '14px' }}>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#166534', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
              <IconCheck width={13} height={13} />
              Key Strengths Detected
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.82rem', color: '#14532d', lineHeight: 1.5 }}>
              {strengths.map((str, idx) => (
                <li key={idx} style={{ marginBottom: 4 }}>{str}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Weaknesses */}
        {weaknesses && weaknesses.length > 0 && (
          <div style={{ background: 'var(--amber-tint)', border: '1px solid var(--amber-border)', borderRadius: 'var(--radius-sm)', padding: '14px' }}>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#92400e', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
              <IconX width={13} height={13} />
              Candidate Profile Vulnerabilities
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.82rem', color: '#78350f', lineHeight: 1.5 }}>
              {weaknesses.map((w, idx) => (
                <li key={idx} style={{ marginBottom: 4 }}>{w}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Improvement Recommendations */}
      {improvement_recommendations && improvement_recommendations.length > 0 && (
        <div className="section-block">
          <div className="section-label">Strategic Next-Step Roadmap</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {improvement_recommendations.map((rec, idx) => (
              <div 
                key={idx} 
                style={{ 
                  background: 'var(--bg-secondary)', 
                  border: '1px solid var(--border-color)',
                  padding: '10px 14px', 
                  borderRadius: 'var(--radius-sm)', 
                  fontSize: '0.84rem',
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start'
                }}
              >
                <span style={{ fontWeight: 800, color: 'var(--blue)', fontSize: '0.82rem' }}>{idx + 1}.</span>
                <span style={{ color: 'var(--text-main)', lineHeight: 1.5 }}>{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggested Projects */}
      {suggested_project_ideas && suggested_project_ideas.length > 0 && (
        <div className="section-block">
          <div className="section-label">High-Impact Portfolio Projects to Stand Out</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {suggested_project_ideas.map((proj, idx) => (
              <div 
                key={idx} 
                style={{ 
                  background: 'var(--bg-secondary)', 
                  padding: '10px 14px', 
                  borderRadius: 'var(--radius-sm)', 
                  border: '1px solid var(--border-color)',
                  fontSize: '0.86rem',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                <IconWrench width={13} height={13} style={{ color: 'var(--blue)', flexShrink: 0 }} />
                <span>{proj}</span>
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
              <div className="rewrite-original" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <IconX width={12} height={12} />
                Original: {rewrite.original_example}
              </div>
              <div className="rewrite-improved" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <IconCheck width={12} height={12} />
                Improved: {rewrite.improved_version}
              </div>
            </div>
          ))}

          {onOpenImprovedCvModal && (
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                These high-impact STAR rewrites have been integrated into your enhanced CV document.
              </span>
              <button
                type="button"
                className="btn-secondary"
                onClick={onOpenImprovedCvModal}
                style={{ fontSize: '0.8rem', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: 5 }}
              >
                <IconDownload width={13} height={13} />
                <span>Download Improved CV</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
