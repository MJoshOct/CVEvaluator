import React from 'react';
import {
  IconSearch,
  IconClock,
  IconUser,
  IconMail,
  IconPhone,
  IconBriefcase,
  IconGraduation,
  IconFile
} from './Icons';

export default function ResumeParseReport({ parseData }) {
  if (!parseData) return null;

  const {
    name,
    email,
    phone,
    linkedin,
    github,
    portfolio,
    total_experience_years,
    skills = [],
    experience = [],
    education = [],
    certifications = []
  } = parseData;

  const formatLink = (url) => {
    if (!url) return '';
    return url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
  };

  return (
    <div className="card">
      <div className="card-title">
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <IconSearch width={16} height={16} />
          <span>Step 1c: Resume Data Extraction</span>
        </span>
        {total_experience_years !== null && total_experience_years !== undefined && (
          <span
            style={{
              background: 'var(--blue-tint)',
              color: 'var(--blue)',
              border: '1px solid rgba(37, 99, 235, 0.25)',
              padding: '3px 10px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.78rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5
            }}
          >
            <IconClock width={13} height={13} />
            {total_experience_years} {total_experience_years === 1 ? 'Year' : 'Years'} Exp
          </span>
        )}
      </div>

      {/* Contact Information Grid */}
      <div className="section-block">
        <div className="section-label">Candidate &amp; Contact Profiles</div>
        <div className="parse-info-grid">
          <div className="parse-info-item">
            <div className="parse-info-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <IconUser width={13} height={13} />
              Candidate Name
            </div>
            <div className="parse-info-value">{name || 'Not detected'}</div>
          </div>

          <div className="parse-info-item">
            <div className="parse-info-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <IconMail width={13} height={13} />
              Email Address
            </div>
            <div className="parse-info-value">
              {email ? (
                <a href={`mailto:${email}`}>{email}</a>
              ) : (
                <span style={{ color: 'var(--text-dim)' }}>Not detected</span>
              )}
            </div>
          </div>

          <div className="parse-info-item">
            <div className="parse-info-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <IconPhone width={13} height={13} />
              Phone Number
            </div>
            <div className="parse-info-value">
              {phone ? phone : <span style={{ color: 'var(--text-dim)' }}>Not detected</span>}
            </div>
          </div>

          <div className="parse-info-item">
            <div className="parse-info-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <IconBriefcase width={13} height={13} />
              LinkedIn Profile
            </div>
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
            <div className="parse-info-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <IconFile width={13} height={13} />
              GitHub Repository
            </div>
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
            <div className="parse-info-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <IconFile width={13} height={13} />
              Portfolio / Website
            </div>
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
        <div className="section-label">Extracted Skills Inventory ({skills.length})</div>
        {skills && skills.length > 0 ? (
          <div className="tag-list">
            {skills.map((skill, idx) => (
              <span key={`skill-${idx}`} className="tag tag-blue">
                {skill}
              </span>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
            No recognized skills directly parsed from text.
          </div>
        )}
      </div>

      {/* Work Experience */}
      <div className="section-block">
        <div className="section-label">Experience History ({experience.length})</div>
        {experience && experience.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {experience.map((exp, idx) => (
              <div
                key={`exp-${idx}`}
                style={{
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px 16px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-main)' }}>
                    {exp.role || exp.title || 'Role'}
                    {exp.company && (
                      <span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}>
                        {' '}· {exp.company}
                      </span>
                    )}
                  </div>
                  {(exp.duration || exp.dates) && (
                    <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      {exp.duration || exp.dates}
                    </span>
                  )}
                </div>
                {exp.description && (
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.5 }}>
                    {exp.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
            No distinct work experience entries parsed.
          </div>
        )}
      </div>

      {/* Education */}
      <div className="section-block">
        <div className="section-label">Education</div>
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
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8
                    }}
                  >
                    <IconGraduation width={15} height={15} style={{ color: 'var(--text-muted)' }} />
                    <span>{edu}</span>
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <IconGraduation width={16} height={16} style={{ color: 'var(--text-muted)' }} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-main)' }}>
                        {edu.degree || 'Degree'}
                      </div>
                      {edu.institution && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                          {edu.institution}
                        </div>
                      )}
                    </div>
                  </div>
                  {edu.year && (
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--blue)',
                        background: 'var(--blue-tint)',
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
        <div className="section-label">Certifications &amp; Licenses</div>
        {certifications && certifications.length > 0 ? (
          <div className="tag-list">
            {certifications.map((cert, idx) => (
              <span
                key={`cert-${idx}`}
                className="tag tag-success"
                style={{ fontSize: '0.8rem', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: 5 }}
              >
                <IconFile width={12} height={12} />
                {typeof cert === 'string' ? cert : cert.title || cert.name || 'Certified'}
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
