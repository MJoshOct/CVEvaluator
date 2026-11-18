import React, { useState, useEffect } from 'react';
import {
  IconDownload,
  IconCopy,
  IconCheck,
  IconX,
  IconFileText,
  IconSparkles,
  IconCpu
} from './Icons';

/**
 * Builds a structured, ATS-compliant improved CV text from evaluation results
 */
export function buildImprovedCvText(evaluationResult) {
  if (!evaluationResult) return '';

  const parseData = evaluationResult.parsed_resume || evaluationResult.parse_data || {};
  const aiEval = evaluationResult.ai_evaluation || {};
  const keywordData = evaluationResult.keyword_analysis || {};

  const name = (parseData.name || evaluationResult.candidate_name || 'CANDIDATE NAME').toUpperCase();
  const email = parseData.email || 'candidate@email.com';
  const phone = parseData.phone || '+1 (555) 012-3456';
  const linkedin = parseData.linkedin ? `linkedin.com/in/${parseData.linkedin}` : 'linkedin.com/in/profile';
  const github = parseData.github ? `github.com/${parseData.github}` : '';
  const portfolio = parseData.portfolio || '';

  const contactLine = [email, phone, linkedin, github, portfolio].filter(Boolean).join(' | ');

  // 1. Summary
  let summary = aiEval.summary || '';
  if (!summary) {
    const yrs = parseData.total_experience_years;
    summary = `Results-oriented professional${yrs ? ` with ${yrs}+ years of experience` : ''} committed to delivering high-quality, reliable solutions. Track record of problem-solving, continuous learning, and effective collaboration across teams to achieve key organizational goals.`;
  }

  // 2. Skills (grounded strictly in the candidate's actual parsed skills - never inject unverified/missing skills)
  const existingSkills = parseData.skills || [];
  const skillsText = existingSkills.length > 0
    ? existingSkills.join(', ')
    : '[List your verified technical skills and proficiencies here]';

  // 3. Rewritten Bullets / Experience
  const rewrites = aiEval.suggested_bullet_rewrites || [];
  const experiences = parseData.experience || [];

  let experienceBlock = '';
  if (experiences.length > 0) {
    experienceBlock = experiences.map((exp, idx) => {
      const title = exp.title || 'Role / Position';
      const company = exp.company || 'Company / Organization';
      const dates = exp.duration || exp.dates || '';
      const header = [title, company, dates ? `(${dates})` : ''].filter(Boolean).join(' | ');

      const bullets = [];
      if (rewrites[idx]?.improved_version) {
        bullets.push(`- ${rewrites[idx].improved_version}`);
      }
      if (rewrites[idx + 1]?.improved_version) {
        bullets.push(`- ${rewrites[idx + 1].improved_version}`);
      }
      if (bullets.length === 0 && exp.bullets && exp.bullets.length > 0) {
        exp.bullets.forEach((b) => bullets.push(`- ${b}`));
      }
      if (bullets.length === 0) {
        bullets.push(`- [Detail your specific contributions, technologies utilized, and measurable outcomes for this role]`);
      }
      return `${header}\n${bullets.join('\n')}`;
    }).join('\n\n');
  } else if (rewrites.length > 0) {
    // Format the candidate's actual improved STAR bullets directly from their CV
    experienceBlock = `PROFESSIONAL HIGHLIGHTS & KEY ACCOMPLISHMENTS (STAR REWRITES)\n` +
      rewrites.map((r) => `- ${r.improved_version}`).join('\n');
  } else {
    experienceBlock = `- [Detail your specific contributions, technologies utilized, and measurable outcomes here]`;
  }

  // 4. Education
  const educationList = parseData.education || [];
  let educationBlock = '';
  if (educationList.length > 0) {
    educationBlock = educationList.map(edu => {
      const degree = edu.degree || 'Degree';
      const inst = edu.institution || 'Institution';
      const year = edu.year ? `(${edu.year})` : '';
      return [degree, inst, year].filter(Boolean).join(' | ').trim();
    }).join('\n');
  } else {
    educationBlock = '[Add your degree, field of study, institution, and graduation year]';
  }

  // 5. Future Project Recommendations (clearly separated as reference ideas, not claimed experience)
  const projects = aiEval.suggested_project_ideas || [];
  let projectsBlock = '';
  if (projects.length > 0) {
    projectsBlock = `\n\nRECOMMENDED FUTURE PORTFOLIO PROJECTS (FOR CANDIDATE REFERENCE ONLY):\n` +
      projects.map((proj, i) => `${i + 1}. ${proj}`).join('\n');
  }

  return `${name}
${contactLine}

PROFESSIONAL SUMMARY
${summary}

TECHNICAL SKILLS & PROFICIENCIES
${skillsText}

PROFESSIONAL EXPERIENCE & ACHIEVEMENTS
${experienceBlock}

EDUCATION & CREDENTIALS
${educationBlock}${projectsBlock}`;
}

export default function ImprovedCvModal({ isOpen, onClose, evaluationResult }) {
  const [cvText, setCvText] = useState('');
  const [copied, setCopied] = useState(false);
  const [format, setFormat] = useState('txt'); // 'txt' or 'md'

  useEffect(() => {
    if (evaluationResult) {
      setCvText(buildImprovedCvText(evaluationResult));
    }
  }, [evaluationResult]);

  if (!isOpen) return null;

  const candidateName = evaluationResult?.parsed_resume?.name || evaluationResult?.candidate_name || 'Candidate';
  const sanitizedName = candidateName.toLowerCase().replace(/[^a-z0-9]/g, '_');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(cvText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      alert('Unable to copy to clipboard.');
    }
  };

  const handleDownload = () => {
    const filename = `${sanitizedName}_improved_cv.${format}`;
    const mimeType = format === 'md' ? 'text/markdown;charset=utf-8;' : 'text/plain;charset=utf-8;';
    const blob = new Blob([cvText], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content improved-cv-modal" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 840, width: '92%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Modal Header */}
        <div className="modal-header" style={{ paddingBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--blue-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--blue)' }}>
              <IconSparkles width={18} height={18} />
            </div>
            <div>
              <div style={{ fontSize: '1.12rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Enhanced ATS-Optimized CV
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Incorporates STAR bullet rewrites, keyword density enhancements, and ATS clean formatting
              </div>
            </div>
          </div>
          <button 
            type="button" 
            className="close-btn" 
            onClick={onClose} 
            title="Close modal"
          >
            <IconX width={16} height={16} />
          </button>
        </div>

        {/* Enhancement Highlights Bar */}
        <div style={{ 
          background: 'var(--bg-secondary)', 
          border: '1px solid var(--border-color)', 
          borderRadius: 'var(--radius-sm)', 
          padding: '10px 14px', 
          margin: '14px 0 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: '0.8rem', flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#166534', fontWeight: 600 }}>
              <IconCheck width={13} height={13} />
              STAR Bullet Structure
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#166534', fontWeight: 600 }}>
              <IconCheck width={13} height={13} />
              ATS Keyword Optimized
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#166534', fontWeight: 600 }}>
              <IconCheck width={13} height={13} />
              Clean Machine-Readable Layout
            </span>
          </div>

          {/* Format Toggle */}
          <div style={{ display: 'inline-flex', background: '#ffffff', border: '1px solid var(--border-color)', borderRadius: 6, padding: 2 }}>
            <button
              type="button"
              onClick={() => setFormat('txt')}
              style={{
                padding: '4px 10px',
                fontSize: '0.75rem',
                fontWeight: 600,
                borderRadius: 4,
                background: format === 'txt' ? 'var(--blue)' : 'transparent',
                color: format === 'txt' ? '#ffffff' : 'var(--text-muted)',
              }}
            >
              Plain Text (.txt)
            </button>
            <button
              type="button"
              onClick={() => setFormat('md')}
              style={{
                padding: '4px 10px',
                fontSize: '0.75rem',
                fontWeight: 600,
                borderRadius: 4,
                background: format === 'md' ? 'var(--blue)' : 'transparent',
                color: format === 'md' ? '#ffffff' : 'var(--text-muted)',
              }}
            >
              Markdown (.md)
            </button>
          </div>
        </div>

        {/* Editable Preview Box */}
        <div style={{ flex: 1, minHeight: 300, display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
            <span>Live Document Preview (Fully editable before downloading):</span>
            <span>{cvText.length} characters</span>
          </div>
          <textarea
            value={cvText}
            onChange={(e) => setCvText(e.target.value)}
            style={{
              flex: 1,
              width: '100%',
              minHeight: 320,
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              fontSize: '0.84rem',
              lineHeight: 1.6,
              padding: 16,
              background: '#ffffff',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-main)',
              resize: 'vertical',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Modal Actions Footer */}
        <div style={{ 
          marginTop: 18, 
          paddingTop: 14, 
          borderTop: '1px solid var(--border-color)', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
          >
            Close
          </button>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleCopy}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              {copied ? (
                <>
                  <IconCheck width={14} height={14} style={{ color: 'var(--green)' }} />
                  <span style={{ color: 'var(--green)', fontWeight: 600 }}>Copied!</span>
                </>
              ) : (
                <>
                  <IconCopy width={14} height={14} />
                  <span>Copy CV Text</span>
                </>
              )}
            </button>

            <button
              type="button"
              className="btn-primary"
              onClick={handleDownload}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px' }}
            >
              <IconDownload width={15} height={15} />
              <span>Download Improved CV (.{format})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
