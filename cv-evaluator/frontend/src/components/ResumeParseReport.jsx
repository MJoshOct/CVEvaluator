import React, { useState } from 'react';

export default function ResumeParseReport({ parseData }) {
  const [showAllSkills, setShowAllSkills] = useState(false);

  if (!parseData) return null;

  const {
    name = 'Candidate',
    email = null,
    phone = null,
    linkedin = null,
    github = null,
    portfolio = null,
    skills = [],
    education = [],
    certifications = [],
    total_experience_years = null
  } = parseData;

  const visibleSkills = showAllSkills ? skills : skills.slice(0, 15);
  const hasMoreSkills = skills.length > 15;

  const formatLink = (url) => {
    if (!url) return null;
    return url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
  };

  return (
    <div className="card">
      <div className="card-title">
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>🔍</span>
          <span>Step 1c: Resume Data Extraction</span>
        </span>
        {total_experience_years !== null && total_experience_years !== undefined && (
          <span
            style={{
              background: 'rgba(56, 189, 248, 0.15)',
              color: 'var(--accent-blue)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              padding: '3px 10px',
              borderRadius: '999px',
              fontSize: '0.78rem',
              fontWeight: 600
            }}
          >
            ⏱️ {total_experience_years} {total_experience_years === 1 ? 'Year' : 'Years'} Exp
          </span>
        )}
      </div>

      {/* Contact Information Grid */}
      <div className="section-block">
        <div className="section-label">Candidate & Contact Profiles</div>
        <div className="parse-info-grid">
          <div className="parse-info-item">
            <div className="parse-info-label">👤 Candidate Name</div>
            <div className="parse-info-value">{name || 'Not detected'}</div>
          </div>

          <div className="parse-info-item">
            <div className="parse-info-label">✉️ Email Address</div>
            <div className="parse-info-value">
              {email ? (
                <a href={`mailto:${email}`}>{email}</a>
              ) : (
                <span style={{ color: 'var(--text-dim)' }}>Not detected</span>
              )}
            </div>
          </div>

          <div className="parse-info-item">
            <div className="parse-info-label">📞 Phone Number</div>
            <div className="parse-info-value">
              {phone ? phone : <span style={{ color: 'var(--text-dim)' }}>Not detected</span>}
            </div>
          </div>

          <div className="parse-info-item">
            <div className="parse-info-label">💼 LinkedIn Profile</div>
            <div className="parse-info-value">
              {linkedin ? (
                <a href={formatLink(linkedin)} target="_blank" rel="noreferrer">
                  {linkedin}
                </a>
              ) : (
                <span style={{ color: 'var(--text-dim)' }}>Not detected</span>
              )}
            </div>
          </div>

          <div className="parse-info-item">
            <div className="parse-info-label">🐙 GitHub Repository</div>
            <div className="parse-info-value">
              {github ? (
                <a href={formatLink(github)} target="_blank" rel="noreferrer">
                  {github}
                </a>
              ) : (
                <span style={{ color: 'var(--text-dim)' }}>Not detected</span>
              )}
            </div>
          </div>

          <div className="parse-info-item">
            <div className="parse-info-label">🌐 Portfolio / Website</div>
            <div className="parse-info-value">
              {portfolio ? (
                <a href={formatLink(portfolio)} target="_blank" rel="noreferrer">
                  {portfolio}
                </a>
              ) : (
                <span style={{ color: 'var(--text-dim)' }}>Not detected</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Extracted Skills */}
      <div className="section-block">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div className="section-label" style={{ margin: 0 }}>
            Extracted Skills & Competencies ({skills.length})
          </div>
          {hasMoreSkills && (
            <button
              type="button"
              onClick={() => setShowAllSkills(!showAllSkills)}
              style={{
                fontSize: '0.75rem',
                color: 'var(--accent-blue)',
                fontWeight: 600,
                textDecoration: 'underline',
                cursor: 'pointer'
              }}
            >
              {showAllSkills ? 'Show less' : `+ Show ${skills.length - 15} more`}
            </button>
          )}
        </div>
        <div className="tag-list">
          {visibleSkills.map((skill, idx) => (
            <span
              key={`skill-${idx}`}
              className="tag tag-neutral"
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)'
              }}
            >
              {skill}
            </span>
          ))}
          {skills.length === 0 && (
            <span className="tag tag-neutral">No distinct technical skills parsed</span>
          )}
        </div>
      </div>

      {/* Education */}
      <div className="section-block">
        <div className="section-label">Education & Academic Background</div>
        {education && education.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {education.map((edu, idx) => {
              if (typeof edu === 'string') {
                return (
                  <div
                    key={`edu-${idx}`}
                    style={{
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '10px 14px',
                      fontSize: '0.85rem'
                    }}
                  >
                    🎓 {edu}
                  </div>
                );
              }
              return (
                <div
                  key={`edu-${idx}`}
                  style={{
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '10px 14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 12
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-main)' }}>
                      🎓 {edu.degree || 'Degree'}
                    </div>
                    {edu.institution && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        {edu.institution}
                      </div>
                    )}
                  </div>
                  {edu.year && (
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--accent-blue)',
                        background: 'rgba(56, 189, 248, 0.1)',
                        padding: '2px 8px',
                        borderRadius: '4px'
                      }}
                    >
                      {edu.year}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
            No formal education section detected.
          </div>
        )}
      </div>

      {/* Certifications */}
      <div className="section-block" style={{ marginBottom: 0 }}>
        <div className="section-label">Certifications & Licenses</div>
        {certifications && certifications.length > 0 ? (
          <div className="tag-list">
            {certifications.map((cert, idx) => (
              <span
                key={`cert-${idx}`}
                className="tag tag-success"
                style={{ fontSize: '0.8rem', padding: '4px 10px' }}
              >
                📜 {typeof cert === 'string' ? cert : cert.title || cert.name || 'Certified'}
              </span>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
            None detected — adding recognized certifications will enhance ATS screening.
          </div>
        )}
      </div>
    </div>
  );
}
