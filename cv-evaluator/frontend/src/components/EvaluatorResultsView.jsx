import React, { useState } from 'react';
import LegitimacyReport from './LegitimacyReport';
import ATSReport from './ATSReport';
import ResumeParseReport from './ResumeParseReport';
import KeywordAnalysisReport from './KeywordAnalysisReport';
import CareerRecommendation from './CareerRecommendation';
import AiFeedbackReport from './AiFeedbackReport';
import {
  IconShield,
  IconCpu,
  IconUser,
  IconChart,
  IconCompass,
  IconSparkles,
  IconAlertTriangle,
  IconDownload
} from './Icons';

export default function EvaluatorResultsView({ evaluationResult, onOpenKeyModal, onOpenImprovedCvModal }) {
  // Only one section open at a time; default to 'ats' (or 'legitimacy' if failed)
  const initialOpen = evaluationResult?.legitimacy?.is_legitimate ? 'ats' : 'legitimacy';
  const [openSectionId, setOpenSectionId] = useState(initialOpen);

  if (!evaluationResult) return null;

  const atsData = evaluationResult.ats_report || evaluationResult.ats_data || evaluationResult.ats;
  const parseData = evaluationResult.parsed_resume || evaluationResult.parse_data;
  const keywordData = evaluationResult.keyword_analysis || evaluationResult.keywords;
  const careerRecs = evaluationResult.career_recommendations || [];
  const isLegitimate = Boolean(evaluationResult.legitimacy?.is_legitimate);

  const SECTIONS = [
    {
      id: 'legitimacy',
      shortTitle: 'Legitimacy',
      title: 'Document Legitimacy & Verification',
      step: 'Step 1a',
      Icon: IconShield,
      getBadge: () => {
        const score = evaluationResult.legitimacy?.score || 0;
        return {
          text: isLegitimate ? `Pass (${score}/100)` : `Failed (${score}/100)`,
          className: isLegitimate ? 'tag-success' : 'tag-danger',
        };
      },
      getSlim: () => {
        const score = evaluationResult.legitimacy?.score || 0;
        return {
          score: `${score}%`,
          className: isLegitimate ? 'tag-success' : 'tag-danger',
        };
      },
      render: () => <LegitimacyReport legitimacy={evaluationResult.legitimacy} />,
    },
    {
      id: 'ats',
      shortTitle: 'ATS Score',
      title: 'ATS Compatibility & Scoring',
      step: 'Step 1b',
      Icon: IconCpu,
      getBadge: () => {
        const score = Math.round(atsData?.ats_score || 0);
        const grade = atsData?.ats_grade || '';
        return {
          text: `${score}% ${grade ? `· ${grade}` : ''}`,
          className: score >= 80 ? 'tag-success' : score >= 60 ? 'tag-warning' : 'tag-danger',
        };
      },
      getSlim: () => {
        const score = Math.round(atsData?.ats_score || 0);
        return {
          score: `${score}%`,
          className: score >= 80 ? 'tag-success' : score >= 60 ? 'tag-warning' : 'tag-danger',
        };
      },
      render: () => (atsData ? <ATSReport atsData={atsData} /> : null),
    },
    {
      id: 'parser',
      shortTitle: 'Profile',
      title: 'Candidate Profile & Data Extraction',
      step: 'Step 1c',
      Icon: IconUser,
      getBadge: () => {
        const name = parseData?.name || evaluationResult.candidate_name || 'Candidate';
        const yrs = parseData?.total_experience_years;
        return {
          text: yrs ? `${name} · ${yrs} Yrs` : name,
          className: 'tag-blue',
        };
      },
      getSlim: () => {
        const yrs = parseData?.total_experience_years;
        return {
          score: yrs ? `${yrs}y Exp` : (parseData?.skills?.length ? `${parseData.skills.length} skl` : 'Done'),
          className: 'tag-blue',
        };
      },
      render: () => (parseData ? <ResumeParseReport parseData={parseData} /> : null),
    },
    {
      id: 'keywords',
      shortTitle: 'Keywords',
      title: 'Keyword Density & Intelligence',
      step: 'Step 2a',
      Icon: IconChart,
      getBadge: () => {
        if (!isLegitimate) return { text: 'Needs Verified CV', className: 'tag-neutral' };
        const score = Math.round(keywordData?.keyword_score || 0);
        return {
          text: `${score}% Coverage`,
          className: score >= 75 ? 'tag-success' : score >= 50 ? 'tag-warning' : 'tag-danger',
        };
      },
      getSlim: () => {
        if (!isLegitimate) return { score: '—', className: 'tag-neutral' };
        const score = Math.round(keywordData?.keyword_score || 0);
        return {
          score: `${score}%`,
          className: score >= 75 ? 'tag-success' : score >= 50 ? 'tag-warning' : 'tag-danger',
        };
      },
      render: () => {
        if (!isLegitimate) {
          return (
            <div className="accordion-notice">
              <IconAlertTriangle width={14} height={14} style={{ marginRight: 6 }} />
              Keyword intelligence requires a legitimate CV structure.
            </div>
          );
        }
        return keywordData ? <KeywordAnalysisReport keywordData={keywordData} /> : null;
      },
    },
    {
      id: 'career',
      shortTitle: 'Multi-Role',
      title: 'Multi-Role Benchmarks & Alignment',
      step: 'Step 2b',
      Icon: IconCompass,
      getBadge: () => {
        if (!careerRecs.length) return { text: 'Multi-Role', className: 'tag-neutral' };
        const top = careerRecs[0];
        return {
          text: `Top: ${top?.role_title || ''} (${Math.round(top?.score || 0)}%)`,
          className: 'tag-purple',
        };
      },
      getSlim: () => {
        if (!careerRecs.length) return { score: '—', className: 'tag-neutral' };
        const top = careerRecs[0];
        return {
          score: `${Math.round(top?.score || 0)}%`,
          className: 'tag-purple',
        };
      },
      render: () => (careerRecs.length ? <CareerRecommendation recommendations={careerRecs} /> : null),
    },
    {
      id: 'ai_review',
      shortTitle: 'AI Review',
      title: 'AI Executive Review & Improvement Roadmap',
      step: 'Step 3',
      Icon: IconSparkles,
      getBadge: () => {
        if (!isLegitimate) return { text: 'Suspended', className: 'tag-neutral' };
        const ai = evaluationResult.ai_evaluation;
        if (ai?.status === 'skipped') return { text: 'API Key Required', className: 'tag-warning' };
        if (ai?.status === 'error') return { text: 'API Error', className: 'tag-danger' };
        const score = ai?.ai_score;
        return {
          text: score !== null && score !== undefined ? `AI: ${score}/100` : 'AI Critique',
          className: 'tag-blue',
        };
      },
      getSlim: () => {
        if (!isLegitimate) return { score: 'Off', className: 'tag-neutral' };
        const ai = evaluationResult.ai_evaluation;
        if (ai?.status === 'skipped') return { score: 'No Key', className: 'tag-warning' };
        if (ai?.status === 'error') return { score: 'Err', className: 'tag-danger' };
        return {
          score: ai?.ai_score != null ? `${ai.ai_score}%` : 'Critique',
          className: 'tag-blue',
        };
      },
      render: () => {
        if (!isLegitimate) {
          return (
            <div className="accordion-notice">
              <IconAlertTriangle width={14} height={14} style={{ marginRight: 6 }} />
              AI review is suspended until core CV requirements pass.
            </div>
          );
        }
        return evaluationResult.ai_evaluation ? (
          <AiFeedbackReport
            aiEvaluation={evaluationResult.ai_evaluation}
            onOpenKeyModal={onOpenKeyModal}
            onOpenImprovedCvModal={onOpenImprovedCvModal}
          />
        ) : null;
      },
    },
  ];

  // Strictly enforce single section open at a time
  const handleToggle = (id) => {
    setOpenSectionId(prev => (prev === id ? null : id));
  };

  const handleJumpToSection = (id) => {
    setOpenSectionId(id);
    setTimeout(() => {
      const el = document.getElementById(`accordion-section-${id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };

  return (
    <div className="evaluator-results-wrapper">
      {/* Left / Main Column: Evaluation Accordion Cards */}
      <div className="evaluator-accordion-container">
        {SECTIONS.map((sec) => {
          const isOpen = openSectionId === sec.id;
          const badge = sec.getBadge();
          const SecIcon = sec.Icon;

          return (
            <div
              key={sec.id}
              id={`accordion-section-${sec.id}`}
              className={`dropdown-section-card ${isOpen ? 'is-open' : 'is-closed'}`}
            >
              {/* Dropdown Header Bar */}
              <button
                type="button"
                className="dropdown-section-header"
                onClick={() => handleToggle(sec.id)}
                aria-expanded={isOpen}
              >
                <div className="dropdown-header-left">
                  <span className="dropdown-icon">
                    <SecIcon width={16} height={16} />
                  </span>
                  <div className="dropdown-title-wrap">
                    <span className="dropdown-step">{sec.step}</span>
                    <span className="dropdown-title">{sec.title}</span>
                  </div>
                </div>

                <div className="dropdown-header-right">
                  <span className={`tag ${badge.className} dropdown-badge`}>
                    {badge.text}
                  </span>
                  <span className={`dropdown-chevron ${isOpen ? 'open' : ''}`}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </span>
                </div>
              </button>

              {/* Dropdown Body Content (rendered only when open) */}
              {isOpen && (
                <div className="dropdown-section-body">
                  {sec.render()}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Right Column: Slim Sticky Scores Menu */}
      <aside className="slim-results-sidebar">
        <div className="slim-sidebar-card">
          {/* Download Improved CV Quick Button */}
          {onOpenImprovedCvModal && (
            <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
              <button
                type="button"
                className="btn-primary"
                onClick={onOpenImprovedCvModal}
                style={{
                  width: '100%',
                  fontSize: '0.8rem',
                  padding: '8px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6
                }}
                title="Preview and download an improved, ATS-optimized version of this CV"
              >
                <IconDownload width={14} height={14} />
                <span>Download Improved CV</span>
              </button>
            </div>
          )}

          <div className="slim-sidebar-header">
            <span className="slim-sidebar-title">Evaluations</span>
            <span className="slim-sidebar-count">
              {openSectionId ? SECTIONS.find(s => s.id === openSectionId)?.shortTitle : `${SECTIONS.length} Stages`}
            </span>
          </div>

          <div className="slim-nav-list">
            {SECTIONS.map((sec) => {
              const isActive = openSectionId === sec.id;
              const SecIcon = sec.Icon;
              const slim = sec.getSlim();

              return (
                <button
                  key={sec.id}
                  type="button"
                  className={`slim-nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => handleJumpToSection(sec.id)}
                  title={`Jump to ${sec.title}`}
                >
                  <div className="slim-nav-label-wrap">
                    <SecIcon width={13} height={13} />
                    <span className="slim-nav-name">{sec.shortTitle}</span>
                  </div>
                  <span className={`tag ${slim.className} slim-nav-score`}>
                    {slim.score}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </aside>
    </div>
  );
}
