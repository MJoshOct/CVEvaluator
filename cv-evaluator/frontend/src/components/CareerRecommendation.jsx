import React from 'react';
import { IconCompass, IconCheck, IconLightbulb } from './Icons';

export default function CareerRecommendation({ recommendations }) {
  if (!recommendations || recommendations.length === 0) return null;

  // Ensure recommendations are sorted descending by score
  const sorted = [...recommendations].sort((a, b) => (b.score || 0) - (a.score || 0));

  const getFitBadgeClass = (fitLevel, score) => {
    const text = (fitLevel || '').toLowerCase();
    if (text.includes('strong') || score >= 75) return 'fit-strong';
    if (text.includes('good') || score >= 60) return 'fit-good';
    if (text.includes('moderate') || score >= 40) return 'fit-moderate';
    return 'fit-low';
  };

  return (
    <div className="card">
      <div className="card-title">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <IconCompass width={16} height={16} />
            <span>Career Role Alignment</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 400, marginTop: 2 }}>
            Based on keyword matching across all roles
          </div>
        </div>
      </div>

      {/* 2-Column Grid of Career Cards */}
      <div className="career-cards-grid">
        {sorted.map((item, idx) => {
          const isHighest = idx === 0;
          const score = Math.round(Number(item.score) || 0);
          const fitBadgeClass = getFitBadgeClass(item.fit_level, score);
          const matchedSkills = item.top_matched_skills || [];
          const missingSkills = item.top_missing_skills || [];

          return (
            <div
              key={item.role_id || idx}
              className={`career-card ${isHighest ? 'top-fit' : ''}`}
            >
              {/* Header: Title + Fit Badge */}
              <div className="career-card-header">
                <div>
                  <div className="career-card-title">{item.role_title}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className={`career-fit-badge ${fitBadgeClass}`}>
                    {item.fit_level || (score >= 75 ? 'Strong Fit' : score >= 60 ? 'Good Fit' : score >= 40 ? 'Moderate Fit' : 'Low Fit')}
                  </span>
                  <span className="career-card-score">{score}%</span>
                </div>
              </div>

              {/* Score Bar */}
              <div className="career-score-bar">
                <div
                  className="career-score-fill"
                  style={{ width: `${Math.min(Math.max(score, 5), 100)}%` }}
                />
              </div>

              {/* Matched Skills */}
              <div className="career-skills-row">
                <span className="career-skills-label">Matched:</span>
                {matchedSkills.slice(0, 3).map((skill, sIdx) => (
                  <span key={`m-${sIdx}`} className="micro-tag micro-tag-match" style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    <IconCheck width={10} height={10} />
                    {skill}
                  </span>
                ))}
                {matchedSkills.length === 0 && (
                  <span style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>None detected</span>
                )}
              </div>

              {/* Missing Skills */}
              <div className="career-skills-row">
                <span className="career-skills-label">Focus on:</span>
                {missingSkills.slice(0, 3).map((skill, mIdx) => (
                  <span key={`miss-${mIdx}`} className="micro-tag micro-tag-miss">
                    + {skill}
                  </span>
                ))}
                {missingSkills.length === 0 && (
                  <span style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>Requirements satisfied</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          marginTop: 16,
          paddingTop: 12,
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          fontSize: '0.76rem',
          color: 'var(--text-dim)',
          textAlign: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6
        }}
      >
        <IconLightbulb width={13} height={13} />
        <span>Scores based on keyword matching across all predefined roles — not AI-generated</span>
      </div>
    </div>
  );
}
