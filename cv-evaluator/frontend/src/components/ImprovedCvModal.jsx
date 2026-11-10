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
    summary = `Results-oriented professional with ${yrs ? `${yrs}+ years of` : 'proven'} experience delivering high-quality, resilient solutions. Demonstrated track record of optimizing performance, driving technical innovation, and collaborating effectively across cross-functional teams to meet mission-critical goals.`;
  }

  // 2. Skills
  const existingSkills = parseData.skills || [];
  const recommendedSkills = (keywordData.missing_keywords || []).slice(0, 6);
  const allSkills = Array.from(new Set([...existingSkills, ...recommendedSkills]));
  const skillsText = allSkills.length > 0
    ? allSkills.join(', ')
    : 'Python, JavaScript, TypeScript, React, Node.js, SQL, Docker, Git, CI/CD, REST APIs, Agile/Scrum';

  // 3. Rewritten Bullets / Experience
  const rewrites = aiEval.suggested_bullet_rewrites || [];
  const experiences = parseData.experience || [];

  let experienceBlock = '';
  if (experiences.length > 0) {
    experienceBlock = experiences.map((exp, idx) => {
      const title = exp.title || 'Senior Software Engineer';
      const company = exp.company || 'Enterprise Solutions Inc.';
      const dates = exp.duration || exp.dates || '2022 – Present';
      
      // If we have AI rewritten bullets, use the improved STAR versions
      const bullets = [];
      if (rewrites[idx]?.improved_version) {
        bullets.push(`- ${rewrites[idx].improved_version}`);
      }
      if (rewrites[idx + 1]?.improved_version) {
        bullets.push(`- ${rewrites[idx + 1].improved_version}`);
      }
      if (bullets.length === 0) {
        bullets.push(
          `- Architected and implemented high-throughput production services, reducing processing latency by 35% and supporting 1M+ active users.`,
          `- Optimized database schema and caching layers, elevating data retrieval throughput by 40% with zero downtime.`,
          `- Spearheaded continuous integration and deployment pipelines, accelerating team release cycles by 50%.`
        );
      }
      return `${title} | ${company} (${dates})\n${bullets.join('\n')}`;
    }).join('\n\n');
  } else {
    // Default experience layout with STAR bullets
    const bullet1 = rewrites[0]?.improved_version || 'Architected and deployed microservices serving 1.5M+ active users with 99.98% availability, cutting latency from 320ms to 75ms.';
    const bullet2 = rewrites[1]?.improved_version || 'Optimized distributed database queries and caching layers, accelerating transaction processing throughput by 42%.';
    const bullet3 = rewrites[2]?.improved_version || 'Implemented automated CI/CD workflows and automated testing suites, raising code test coverage from 65% to 92%.';

    experienceBlock = `Senior Software Engineer | Enterprise Tech Systems (2022 – Present)
- ${bullet1}
- ${bullet2}
- ${bullet3}

Software Developer | Digital Solutions Lab (2020 – 2022)
- Engineered full-stack modules and responsive web interfaces using modern frameworks, decreasing client onboarding turnaround time by 30%.
- Collaborated in cross-functional Agile sprints to ship 14 major feature releases ahead of schedule.`;
  }

  // 4. Projects (incorporate suggested project ideas if available)
  const projects = aiEval.suggested_project_ideas || [];
  let projectsBlock = '';
  if (projects.length > 0) {
    projectsBlock = `\n\nHIGH-IMPACT PORTFOLIO PROJECTS\n` + projects.map((proj, i) => {
      return `Project ${i + 1}: ${proj}\n- Engineered end-to-end architecture adhering to industry best practices, automated testing, and scalable cloud deployment.`;
    }).join('\n\n');
  }

  // 5. Education
  const educationList = parseData.education || [];
  let educationBlock = '';
  if (educationList.length > 0) {
    educationBlock = educationList.map(edu => {
      const degree = edu.degree || 'Bachelor of Science in Computer Science';
      const inst = edu.institution || 'University';
      const year = edu.year ? `(${edu.year})` : '';
      return `${degree} | ${inst} ${year}`.trim();
    }).join('\n');
  } else {
    educationBlock = 'B.S. in Computer Science | Accredited University (2018 – 2022)\nRelevant Coursework: Distributed Systems, Algorithms, Database Systems, Software Engineering';
  }

  return `${name}
${contactLine}

PROFESSIONAL SUMMARY
${summary}

TECHNICAL & CORE SKILLS
- Proficiencies & Frameworks: ${skillsText}
- Core Competencies: System Architecture, Performance Optimization, Cloud Deployment, Code Review, Agile Methodologies

PROFESSIONAL EXPERIENCE
${experienceBlock}${projectsBlock}

EDUCATION & CREDENTIALS
${educationBlock}`;
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
