import React from 'react';
import { IconCheck, IconSearch } from './Icons';

export default function RoleScorecard({ evaluation }) {
  if (!evaluation) return null;

  const {
    role_title,
    total_score,
    core_skills_matched,
    core_skills_missing,
    tools_matched,
    tools_missing,
    concepts_matched,
    concepts_missing,
    experience_signals_found,
    breakdown_percentages
  } = evaluation;

  return (
    <div className="card">
      <div className="card-title">
        <span>Step 2a: Rubric &amp; Domain Alignment</span>
        <span style={{ fontSize: '0.85rem', color: 'var(--blue)', fontWeight: 600 }}>
          {role_title}
        </span>
      </div>

      {/* Score Summary */}
      <div className="score-card">
        <div className="score-badge">
          {total_score}%
        </div>
        <div className="score-meta">
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600 }}>
            <span>Predefined Rubric Alignment</span>
            <span>{total_score >= 70 ? 'Strong Baseline Fit' : total_score >= 45 ? 'Moderate Match' : 'Low Alignment'}</span>
          </div>
          <div className="progress-bar-bg">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${Math.min(Math.max(total_score, 5), 100)}%` }} 
            />
          </div>
        </div>
      </div>

      {/* Breakdown categories */}
      {breakdown_percentages && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Core Skills</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--blue)' }}>
              {breakdown_percentages.core_skills}%
            </div>
          </div>
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Tools / Stacks</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--blue)' }}>
              {breakdown_percentages.frameworks_and_tools}%
            </div>
          </div>
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Concepts / Domain</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--blue)' }}>
              {breakdown_percentages.concepts_and_methodologies}%
            </div>
          </div>
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Action Signals</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--blue)' }}>
              {breakdown_percentages.experience_signals}%
            </div>
          </div>
        </div>
      )}

      {/* Matched vs Missing Skills */}
      <div className="section-block">
        <div className="section-label">Matched Skills &amp; Tools Found in CV</div>
        <div className="tag-list">
          {core_skills_matched.map((s, idx) => (
            <span key={`core-${idx}`} className="tag tag-success" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <IconCheck width={12} height={12} />
              {s}
            </span>
          ))}
          {tools_matched.map((t, idx) => (
            <span key={`tool-${idx}`} className="tag tag-success" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <IconCheck width={12} height={12} />
              {t}
            </span>
          ))}
          {concepts_matched.map((c, idx) => (
            <span key={`concept-${idx}`} className="tag tag-success" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <IconCheck width={12} height={12} />
              {c}
            </span>
          ))}
          {core_skills_matched.length === 0 && tools_matched.length === 0 && (
            <span className="tag tag-neutral">No exact target skills matched yet</span>
          )}
        </div>
      </div>

      <div className="section-block">
        <div className="section-label">Target Role Gaps (Recommended to Acquire/List)</div>
        <div className="tag-list">
          {core_skills_missing.slice(0, 8).map((s, idx) => (
            <span key={`miss-core-${idx}`} className="tag tag-danger">Missing Core: {s}</span>
          ))}
          {tools_missing.slice(0, 8).map((t, idx) => (
            <span key={`miss-tool-${idx}`} className="tag tag-warning">Missing Tool: {t}</span>
          ))}
        </div>
      </div>

      {experience_signals_found.length > 0 && (
        <div className="section-block" style={{ marginBottom: 0 }}>
          <div className="section-label">Impact Signals Detected</div>
          <div className="tag-list">
            {experience_signals_found.map((sig, idx) => (
              <span key={idx} className="tag tag-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <IconSearch width={11} height={11} />
                "{sig}"
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
