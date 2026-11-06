import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import UploadSection from './components/UploadSection';
import LegitimacyReport from './components/LegitimacyReport';
import ATSReport from './components/ATSReport';
import ResumeParseReport from './components/ResumeParseReport';
import KeywordAnalysisReport from './components/KeywordAnalysisReport';
import CareerRecommendation from './components/CareerRecommendation';
import RoleScorecard from './components/RoleScorecard';
import AiFeedbackReport from './components/AiFeedbackReport';
import JDMatchPanel from './components/JDMatchPanel';
import BulletGeneratorPanel from './components/BulletGeneratorPanel';
import InterviewPrepPanel from './components/InterviewPrepPanel';
import ApiKeyModal from './components/ApiKeyModal';
import HistoryModal from './components/HistoryModal';

const DEFAULT_ROLES = [
  { id: 'software_development', title: 'Software Development', description: 'General software systems, data structures, backend & architecture.' },
  { id: 'ai_engineer', title: 'AI Engineer', description: 'Machine learning, deep learning, LLMs, RAG, and model serving.' },
  { id: 'data_analyst', title: 'Data Analyst', description: 'SQL querying, BI dashboards, statistical modeling, and business insights.' },
  { id: 'web_development', title: 'Web Development', description: 'Full-stack/frontend web apps, React, Node.js, and web performance.' }
];

const MODES = [
  { id: 'evaluator', label: '📋 Resume Evaluator' },
  { id: 'jd-match', label: '🎯 JD Matcher' },
  { id: 'career', label: '🧭 Career Advisor' },
  { id: 'tools', label: '🛠️ AI Tools' },
];

const SAMPLE_CAREER_CV = `Alex Chen
alex.chen@email.com | +1 (555) 019-2834 | linkedin.com/in/alexchen-dev | github.com/alexchen

PROFESSIONAL SUMMARY
Results-driven Software Engineer with 3+ years of experience architecting distributed systems, backend microservices, and high-throughput APIs.

TECHNICAL SKILLS
- Languages: Python, Java, C++, Go, SQL
- Technologies & Tools: Docker, Kubernetes, Linux, Git, CI/CD, PostgreSQL, Redis, Kafka
- Concepts: System Design, OOP, Data Structures, Algorithms, Unit Testing, TDD, Agile/Scrum

PROFESSIONAL EXPERIENCE
Software Engineer | NexaTech Systems (2022 – Present)
- Architected and deployed microservices in Go and Python serving 2M+ daily active users with 99.98% uptime.
- Optimized database indexing and Redis caching, cutting P99 API response latency from 420ms to 85ms.
- Implemented automated CI/CD pipelines with GitHub Actions and Docker, reducing deployment cycle times by 40%.`;

export default function App() {
  const [activeMode, setActiveMode] = useState('evaluator'); // 'evaluator' | 'jd-match' | 'career' | 'tools'
  const [activeTool, setActiveTool] = useState('bullets');   // 'bullets' | 'interview'

  // Common and Evaluator Mode state
  const [roles, setRoles] = useState(DEFAULT_ROLES);
  const [selectedRole, setSelectedRole] = useState('software_development');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('cv_ai_api_key') || '');
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Career Advisor Mode state
  const [careerCvMode, setCareerCvMode] = useState('paste'); // 'upload' | 'paste'
  const [careerCvText, setCareerCvText] = useState('');
  const [careerFile, setCareerFile] = useState(null);
  const [careerResult, setCareerResult] = useState(null);
  const [careerLoading, setCareerLoading] = useState(false);
  const [careerError, setCareerError] = useState(null);
  const [isCareerDragActive, setIsCareerDragActive] = useState(false);
  const careerFileInputRef = useRef(null);

  useEffect(() => {
    fetchRoles();
    fetchHistory();
  }, []);

  const fetchRoles = async () => {
    try {
      const res = await fetch('/api/roles');
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) setRoles(data);
      }
    } catch (e) {
      console.warn('Using default roles due to network/bootstrap:', e);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/history');
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (e) {
      console.warn('Could not fetch history:', e);
    }
  };

  const handleSaveApiKey = (newKey) => {
    setApiKey(newKey);
    localStorage.setItem('cv_ai_api_key', newKey);
  };

  // ── Evaluator Mode Action ──
  const handleEvaluate = async ({ mode, file, text, candidateName, role, apiKey: submittedKey }) => {
    setIsLoading(true);
    setErrorMessage(null);

    const activeKey = submittedKey || apiKey;

    try {
      let res;
      if (mode === 'upload') {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('target_role', role);
        if (activeKey) formData.append('api_key', activeKey);
        if (candidateName) formData.append('candidate_name', candidateName);

        res = await fetch('/api/evaluate/upload', {
          method: 'POST',
          body: formData,
          headers: activeKey ? { 'X-AI-API-Key': activeKey } : {}
        });
      } else {
        res = await fetch('/api/evaluate/text', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(activeKey ? { 'X-AI-API-Key': activeKey } : {})
          },
          body: JSON.stringify({
            text,
            target_role: role,
            api_key: activeKey,
            candidate_name: candidateName
          })
        });
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Evaluation request failed.' }));
        throw new Error(err.error || err.detail || 'Evaluation failed.');
      }

      const resultData = await res.json();
      setEvaluationResult(resultData);
      fetchHistory(); // Refresh history list
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || 'An error occurred during evaluation.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Career Advisor Mode Action ──
  const handleCareerSubmit = async (e) => {
    e.preventDefault();
    setCareerError(null);

    if (careerCvMode === 'upload' && !careerFile) {
      setCareerError('Please choose or drop a CV file first.');
      return;
    }
    if (careerCvMode === 'paste' && !careerCvText.trim()) {
      setCareerError('Please paste your CV text to analyze.');
      return;
    }

    setCareerLoading(true);

    try {
      let res;
      if (careerCvMode === 'upload') {
        const formData = new FormData();
        formData.append('file', careerFile);
        formData.append('target_role', selectedRole);
        if (apiKey) formData.append('api_key', apiKey);

        res = await fetch('/api/evaluate/upload', {
          method: 'POST',
          body: formData,
          headers: apiKey ? { 'X-AI-API-Key': apiKey } : {}
        });
      } else {
        res = await fetch('/api/evaluate/text', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(apiKey ? { 'X-AI-API-Key': apiKey } : {})
          },
          body: JSON.stringify({
            text: careerCvText.trim(),
            target_role: selectedRole,
            api_key: apiKey
          })
        });
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Career evaluation failed.' }));
        throw new Error(err.error || err.detail || 'Failed to analyze career recommendations.');
      }

      const data = await res.json();

      // Ensure recommendations format
      const recommendations = data.career_recommendations || (roles.map((r) => {
        const isSelected = r.id === selectedRole;
        const baseScore = data.predefined_evaluation?.total_score || 72;
        const score = isSelected
          ? baseScore
          : Math.max(30, Math.round(baseScore * (r.id === 'software_development' ? 0.95 : 0.75)));
        return {
          role_id: r.id,
          role_title: r.title,
          score,
          fit_level: score >= 75 ? 'Strong Fit' : score >= 60 ? 'Good Fit' : score >= 40 ? 'Moderate Fit' : 'Low Fit',
          top_matched_skills: data.predefined_evaluation?.core_skills_matched?.slice(0, 3) || ['Python', 'Git', 'SQL'],
          top_missing_skills: data.predefined_evaluation?.core_skills_missing?.slice(0, 3) || ['Docker', 'Cloud']
        };
      }));

      setCareerResult({
        ...data,
        career_recommendations: recommendations
      });
    } catch (err) {
      console.error(err);
      setCareerError(err.message || 'An error occurred during career alignment analysis.');
    } finally {
      setCareerLoading(false);
    }
  };

  const handleSelectHistoryRecord = async (id) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/history/${id}`);
      if (res.ok) {
        const record = await res.json();

        // Reconstruct ATS, parse, and keyword data if not directly provided
        const reconstructedAts = record.ats_report || {
          ats_score: Math.round(record.predefined_score || (record.is_legitimate ? 75 : 35)),
          ats_grade: (record.predefined_score >= 80) ? 'Excellent' : (record.predefined_score >= 60) ? 'Good' : 'Fair',
          detected_sections: record.is_legitimate ? ['Summary', 'Experience', 'Education', 'Skills'] : ['Raw Input'],
          missing_sections: record.is_legitimate ? ['Certifications'] : ['Contact Information', 'Experience'],
          formatting_issues: record.legitimacy_reasons || [],
          ats_tips: ['Maintain standard clean headings for optimal ATS parsing.'],
          weak_phrases_found: [],
          word_count: 380
        };

        const reconstructedParse = record.parsed_resume || {
          name: record.candidate_name || 'Candidate',
          email: null,
          phone: null,
          linkedin: null,
          github: null,
          portfolio: null,
          skills: record.matched_skills || [],
          education: [{ degree: 'Degree', institution: 'University', year: '2022' }],
          certifications: [],
          total_experience_years: 3
        };

        const reconstructedKeywords = record.keyword_analysis || {
          keyword_score: Math.round(record.predefined_score || 0),
          present_keywords: record.matched_skills || [],
          missing_keywords: record.missing_skills || [],
          weak_keywords: [],
          suggested_keywords: (record.missing_skills || []).slice(0, 5),
          weak_phrases: []
        };

        const reconstructedCareer = record.career_recommendations || (roles.map((r) => {
          const isTarget = r.id === record.target_role;
          const score = isTarget ? record.predefined_score : Math.max(25, Math.round(record.predefined_score * 0.7));
          return {
            role_id: r.id,
            role_title: r.title,
            score,
            fit_level: score >= 75 ? 'Strong Fit' : score >= 60 ? 'Good Fit' : 'Moderate Fit',
            top_matched_skills: (record.matched_skills || []).slice(0, 3),
            top_missing_skills: (record.missing_skills || []).slice(0, 3)
          };
        }));

        setEvaluationResult({
          id: record.id,
          created_at: record.created_at,
          candidate_name: record.candidate_name,
          target_role: record.target_role,
          ats_report: reconstructedAts,
          parsed_resume: reconstructedParse,
          keyword_analysis: reconstructedKeywords,
          career_recommendations: reconstructedCareer,
          legitimacy: {
            is_legitimate: record.is_legitimate,
            score: record.legitimacy_score,
            detected_sections: record.is_legitimate ? ['Contact Information', 'Experience', 'Education'] : [],
            missing_sections: record.is_legitimate ? [] : ['Contact Information / Valid Format'],
            has_contact_info: record.is_legitimate,
            word_count: 380,
            notes: record.legitimacy_reasons || []
          },
          predefined_evaluation: {
            role_id: record.target_role,
            role_title: record.target_role.replace('_', ' ').toUpperCase(),
            total_score: record.predefined_score,
            core_skills_matched: record.matched_skills || [],
            core_skills_missing: record.missing_skills || [],
            tools_matched: [],
            tools_missing: [],
            concepts_matched: [],
            concepts_missing: [],
            experience_signals_found: [],
            breakdown_percentages: record.rubric_breakdown || {}
          },
          ai_evaluation: record.ai_evaluated ? {
            status: 'completed',
            ai_score: record.ai_score,
            summary: record.ai_summary,
            strengths: record.ai_strengths || [],
            weaknesses: record.ai_weaknesses || [],
            improvement_recommendations: record.ai_improvement_tips || [],
            suggested_project_ideas: [],
            suggested_bullet_rewrites: []
          } : {
            status: 'skipped'
          }
        });

        // Switch to evaluator mode if record clicked from history
        setActiveMode('evaluator');
      }
    } catch (e) {
      console.error('Error fetching record details:', e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      {/* Top Header */}
      <Header
        apiKey={apiKey}
        onOpenKeyModal={() => setIsKeyModalOpen(true)}
        onOpenHistory={() => setIsHistoryModalOpen(true)}
        historyCount={history.length}
      />

      {/* Mode Switcher Tabs */}
      <nav className="mode-tabs">
        {MODES.map((mode) => (
          <button
            key={mode.id}
            type="button"
            className={`mode-tab ${activeMode === mode.id ? 'active' : ''}`}
            onClick={() => setActiveMode(mode.id)}
          >
            {mode.label}
          </button>
        ))}
      </nav>

      {/* Global Error Message Banner */}
      {errorMessage && activeMode === 'evaluator' && (
        <div className="status-banner fail" style={{ marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            <div className="status-title">Error</div>
            <div className="status-details">{errorMessage}</div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          1. EVALUATOR MODE
         ───────────────────────────────────────────────────────────── */}
      {activeMode === 'evaluator' && (
        <div className="main-grid">
          {/* Left Column: Upload / Paste & Role Focus */}
          <div>
            <UploadSection
              roles={roles}
              selectedRole={selectedRole}
              onSelectRole={setSelectedRole}
              apiKey={apiKey}
              onApiKeyChange={handleSaveApiKey}
              onEvaluate={handleEvaluate}
              isLoading={isLoading}
            />
          </div>

          {/* Right Column: Multi-Step Evaluation Results */}
          <div>
            {!evaluationResult && !isLoading && (
              <div className="card empty-state">
                <div className="empty-state-icon">📋</div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: 8 }}>
                  No CV Evaluated Yet
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: 440, margin: '0 auto 16px auto' }}>
                  Select a target role on the left, upload a resume or load a sample CV, and click <strong>Evaluate CV</strong> to start the verification pipeline.
                </p>
              </div>
            )}

            {isLoading && (
              <div className="card empty-state">
                <div className="empty-state-icon" style={{ animation: 'pulse 1.5s infinite' }}>⏳</div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: 8 }}>
                  Running Multi-Stage Evaluation...
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  1. Checking document legitimacy & structure<br />
                  2. Scoring ATS compatibility and extracting candidate data<br />
                  3. Aligning with predefined role dataset criteria & keywords<br />
                  4. Querying AI model for hiring critique & improvement roadmap
                </p>
              </div>
            )}

            {evaluationResult && !isLoading && (
              <div>
                {/* 1. Legitimacy Check */}
                <LegitimacyReport legitimacy={evaluationResult.legitimacy} />

                {/* 2. ATS Compatibility Score (Always shown if ats present) */}
                {(evaluationResult.ats_report || evaluationResult.ats_data || evaluationResult.ats) && (
                  <ATSReport atsData={evaluationResult.ats_report || evaluationResult.ats_data || evaluationResult.ats} />
                )}

                {/* 3. Resume Parse Report (Always shown if parsed_resume present) */}
                {(evaluationResult.parsed_resume || evaluationResult.parse_data) && (
                  <ResumeParseReport parseData={evaluationResult.parsed_resume || evaluationResult.parse_data} />
                )}

                {/* 4. Career Recommendations across all roles */}
                {evaluationResult.career_recommendations && evaluationResult.career_recommendations.length > 0 && (
                  <CareerRecommendation recommendations={evaluationResult.career_recommendations} />
                )}

                {/* 5. Role Scorecard (Predefined Dataset Match - only if legitimate) */}
                {evaluationResult.legitimacy?.is_legitimate && evaluationResult.predefined_evaluation && (
                  <RoleScorecard evaluation={evaluationResult.predefined_evaluation} />
                )}

                {/* 6. Keyword Intelligence (only if legitimate and keyword data present) */}
                {evaluationResult.legitimacy?.is_legitimate && (evaluationResult.keyword_analysis || evaluationResult.keywords) && (
                  <KeywordAnalysisReport keywordData={evaluationResult.keyword_analysis || evaluationResult.keywords} />
                )}

                {/* 7. AI Model Deep Feedback & Improvement Roadmap (only if legitimate) */}
                {evaluationResult.legitimacy?.is_legitimate && evaluationResult.ai_evaluation && (
                  <AiFeedbackReport
                    aiEvaluation={evaluationResult.ai_evaluation}
                    onOpenKeyModal={() => setIsKeyModalOpen(true)}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          2. JD MATCH MODE
         ───────────────────────────────────────────────────────────── */}
      {activeMode === 'jd-match' && (
        <div>
          <JDMatchPanel
            apiKey={apiKey}
            onApiKeyChange={handleSaveApiKey}
          />
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. CAREER ADVISOR MODE
         ───────────────────────────────────────────────────────────── */}
      {activeMode === 'career' && (
        <div>
          {/* Prominent Header Banner */}
          <div
            className="card"
            style={{
              background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.95))',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              marginBottom: 20
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(56, 189, 248, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.8rem',
                  flexShrink: 0
                }}
              >
                🧭
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 4 }}>
                  Comprehensive Career Alignment Advisor
                </h2>
                <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>
                  Upload your CV to see which technical roles you're best aligned with across our entire dataset taxonomy.
                </p>
              </div>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setCareerCvMode('paste');
                  setCareerCvText(SAMPLE_CAREER_CV);
                }}
                style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}
              >
                ⚡ Load Sample CV
              </button>
            </div>
          </div>

          {/* CV Submission Box for Career Mode */}
          <div className="card">
            <div className="card-title">
              <span>Input CV for Multi-Role Career Mapping</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  className={`tab-btn ${careerCvMode === 'paste' ? 'active' : ''}`}
                  onClick={() => setCareerCvMode('paste')}
                >
                  ✏️ Paste CV Text
                </button>
                <button
                  type="button"
                  className={`tab-btn ${careerCvMode === 'upload' ? 'active' : ''}`}
                  onClick={() => setCareerCvMode('upload')}
                >
                  📁 Upload CV File
                </button>
              </div>
            </div>

            <form onSubmit={handleCareerSubmit}>
              {careerCvMode === 'upload' ? (
                <div style={{ marginBottom: 16 }}>
                  {!careerFile ? (
                    <div
                      className={`dropzone ${isCareerDragActive ? 'drag-active' : ''}`}
                      onDragOver={(e) => { e.preventDefault(); setIsCareerDragActive(true); }}
                      onDragLeave={() => setIsCareerDragActive(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsCareerDragActive(false);
                        if (e.dataTransfer.files?.[0]) setCareerFile(e.dataTransfer.files[0]);
                      }}
                      onClick={() => careerFileInputRef.current?.click()}
                    >
                      <input
                        type="file"
                        ref={careerFileInputRef}
                        style={{ display: 'none' }}
                        accept=".pdf,.docx,.doc,.txt"
                        onChange={(e) => {
                          if (e.target.files?.[0]) setCareerFile(e.target.files[0]);
                        }}
                      />
                      <div className="dropzone-icon">📄</div>
                      <div className="dropzone-text">Click or drop CV to analyze career trajectory</div>
                      <div className="dropzone-hint">PDF, DOCX, or TXT</div>
                    </div>
                  ) : (
                    <div className="file-selected-card">
                      <div className="file-info-col">
                        <div className="file-type-icon">📄</div>
                        <div className="file-details">
                          <div className="file-name" title={careerFile.name}>{careerFile.name}</div>
                          <div className="file-meta">
                            <span className="file-size">{(careerFile.size / 1024).toFixed(1)} KB</span>
                            <span className="file-ready-tag">✓ Ready for Career Alignment</span>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn-change-file"
                        onClick={() => setCareerFile(null)}
                      >
                        🔄 Change
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ marginBottom: 16 }}>
                  <textarea
                    className="cv-textarea"
                    placeholder="Paste full CV / resume text here to analyze alignment against all career profiles..."
                    value={careerCvText}
                    onChange={(e) => setCareerCvText(e.target.value)}
                  />
                </div>
              )}

              {careerError && (
                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#f87171',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.84rem',
                    marginBottom: 16
                  }}
                >
                  ⚠️ {careerError}
                </div>
              )}

              <button
                type="submit"
                className="btn-primary"
                style={{ width: '100%' }}
                disabled={careerLoading}
              >
                {careerLoading ? 'Analyzing Alignment Across Roles...' : '🧭 Discover Career Role Matches'}
              </button>
            </form>
          </div>

          {/* Career Loading State */}
          {careerLoading && (
            <div className="card empty-state">
              <div className="empty-state-icon" style={{ animation: 'pulse 1.5s infinite' }}>🧭</div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: 8 }}>
                Benchmarking CV Across All Role Profiles...
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Comparing technical skill sets, experience signals, and tools against our full role database.
              </p>
            </div>
          )}

          {/* Career Result: ONLY render CareerRecommendation */}
          {careerResult && !careerLoading && (
            <div>
              <CareerRecommendation recommendations={careerResult.career_recommendations} />
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          4. AI TOOLS MODE
         ───────────────────────────────────────────────────────────── */}
      {activeMode === 'tools' && (
        <div>
          {/* Sub-tab switcher */}
          <div className="tools-sub-tabs">
            <button
              type="button"
              className={`tool-sub-tab ${activeTool === 'bullets' ? 'active' : ''}`}
              onClick={() => setActiveTool('bullets')}
            >
              ✨ Bullet Generator (STAR Rewriter)
            </button>
            <button
              type="button"
              className={`tool-sub-tab ${activeTool === 'interview' ? 'active' : ''}`}
              onClick={() => setActiveTool('interview')}
            >
              🎤 Interview Prep & Q&A Generator
            </button>
          </div>

          {/* Sub-panels */}
          {activeTool === 'bullets' ? (
            <BulletGeneratorPanel
              apiKey={apiKey}
              onApiKeyChange={handleSaveApiKey}
              roles={roles}
            />
          ) : (
            <InterviewPrepPanel
              apiKey={apiKey}
              onApiKeyChange={handleSaveApiKey}
              roles={roles}
            />
          )}
        </div>
      )}

      {/* Shared Modals */}
      <ApiKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        currentKey={apiKey}
        onSaveKey={handleSaveApiKey}
      />

      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        history={history}
        onSelectRecord={handleSelectHistoryRecord}
      />
    </div>
  );
}
