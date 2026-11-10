import React from 'react';
import {
  IconCpu,
  IconFile,
  IconCheck,
  IconX,
  IconAlertTriangle,
  IconLightbulb
} from './Icons';

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
  let scoreColor = '#dc2626'; // red < 60
  let gradeBadgeClass = 'tag-danger';
  if (score >= 80) {
    scoreColor = '#16a34a'; // green >= 80
    gradeBadgeClass = 'tag-success';
  } else if (score >= 60) {
    scoreColor = '#d97706'; // yellow >= 60
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
          <IconCpu width={16} height={16} />
          <span>Step 1b: ATS Compatibility Score</span>
        </span>
        <span className={`tag ${gradeBadgeClass}`} style={{ fontSize: '0.8rem', padding: '3px 10px' }}>
          {ats_grade} ATS Profile
        </span>
      </div>

      {/* Top Gauge & Metrics Row */}
      <div className="ats-gauge-wrap">
        <div className="ats-circle">
          <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke="var(--border-color)"
              strokeWidth="8"
              fill="transparent"
            />
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke={scoreColor}
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.8s ease' }}
            />
          </svg>
          <div className="ats-score-text">
            <span style={{ color: scoreColor, fontWeight: 800, fontSize: '1.4rem', fontFamily: 'var(--font-mono)' }}>
              {score}
            </span>
            <span className="ats-grade">{ats_grade}</span>
          </div>
        </div>

        <div className="ats-info-col" style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)', marginBottom: 4 }}>
            Applicant Tracking System Readiness
          </div>
          <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {score >= 80
              ? 'Your CV adheres strongly to ATS parsing conventions, section layouts, and keyword structure.'
              : score >= 60
              ? 'Your CV is readable by most ATS parsers, but addressing missing sections and formatting warnings will prevent drop-offs.'
              : 'Your resume may encounter parsing errors or low algorithmic ranking in automated screening systems.'}
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <span>Word Count: <strong style={{ color: 'var(--text-main)' }}>{word_count}</strong></span>
            <span>Sections Found: <strong style={{ color: '#16a34a' }}>{detected_sections.length}</strong></span>
            <span>Issues: <strong style={{ color: formatting_issues.length > 0 ? '#dc2626' : '#16a34a' }}>{formatting_issues.length}</strong></span>
          </div>
        </div>
      </div>

      {/* Detected and Missing Sections */}
      <div className="section-block">
        <div className="section-label">ATS Section Hierarchy Detection</div>
        <div className="tag-list">
          {detected_sections.map((sec, idx) => (
            <span key={`detected-${idx}`} className="tag tag-success" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <IconCheck width={12} height={12} />
              {sec}
            </span>
          ))}
          {missing_sections.map((sec, idx) => (
            <span key={`missing-${idx}`} className="tag tag-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <IconX width={12} height={12} />
              Missing: {sec}
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
          <div className="section-label" style={{ color: '#dc2626' }}>
            Formatting & Parsing Warnings ({formatting_issues.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {formatting_issues.map((issue, idx) => (
              <div
                key={`issue-${idx}`}
                style={{
                  background: 'var(--red-tint)',
                  border: '1px solid var(--red-border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 14px',
                  fontSize: '0.85rem',
                  color: '#991b1b',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10
                }}
              >
                <IconAlertTriangle width={15} height={15} style={{ flexShrink: 0, marginTop: 2 }} />
                <span style={{ flex: 1, lineHeight: 1.5 }}>{issue}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weak Phrases Found */}
      {weak_phrases_found.length > 0 && (
        <div className="section-block">
          <div className="section-label" style={{ color: '#b45309' }}>
            Weak / Passive Phrases Detected
          </div>
          <div className="tag-list" style={{ marginBottom: 6 }}>
            {weak_phrases_found.map((phrase, idx) => (
              <span key={`phrase-${idx}`} className="tag tag-warning">
                "{phrase}"
              </span>
            ))}
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Tip: Replace passive responsibilities with quantified outcomes and active verbs (e.g., "Spearheaded", "Engineered", "Reduced").
          </p>
        </div>
      )}

      {/* ATS Tips */}
      {ats_tips.length > 0 && (
        <div className="section-block" style={{ marginBottom: 0 }}>
          <div className="section-label" style={{ color: 'var(--blue)' }}>
            Actionable ATS Optimization Tips
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ats_tips.map((tip, idx) => (
              <div
                key={`tip-${idx}`}
                style={{
                  background: 'var(--blue-tint)',
                  border: '1px solid rgba(37, 99, 235, 0.2)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 14px',
                  fontSize: '0.85rem',
                  color: '#1e40af',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10
                }}
              >
                <IconLightbulb width={15} height={15} style={{ flexShrink: 0, marginTop: 2 }} />
                <span style={{ flex: 1, lineHeight: 1.5 }}>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
