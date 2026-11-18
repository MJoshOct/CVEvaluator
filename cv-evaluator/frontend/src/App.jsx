import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import UploadSection from './components/UploadSection';
import EvaluatorResultsView from './components/EvaluatorResultsView';
import JDMatchPanel from './components/JDMatchPanel';
import BulletGeneratorPanel from './components/BulletGeneratorPanel';
import InterviewPrepPanel from './components/InterviewPrepPanel';
import UserDashboard from './components/UserDashboard';
import { AdminConsoleIcon, AdminOverviewIcon } from './components/AdminIcons';
import ApiKeyModal from './components/ApiKeyModal';
import ImprovedCvModal from './components/ImprovedCvModal';
import AuthGate from './components/AuthGate';
import { AuthProvider, useAuth } from './context/AuthContext';
import {
  IconFile,
  IconTarget,
  IconWrench,
  IconClock,
  IconSparkles,
  IconMic,
  IconCrown,
  IconChart,
  IconCompass,
  IconCheck,
} from './components/Icons';

const DEFAULT_ROLES = [
  { id: 'software_development', title: 'Software Development', description: 'General software systems, data structures, backend & architecture.' },
  { id: 'ai_engineer', title: 'AI Engineer', description: 'Machine learning, deep learning, LLMs, RAG, and model serving.' },
  { id: 'data_analyst', title: 'Data Analyst', description: 'SQL querying, BI dashboards, statistical modeling, and business insights.' },
  { id: 'web_development', title: 'Web Development', description: 'Full-stack/frontend web apps, React, Node.js, and web performance.' }
];

function AppContent() {
  const { user, isAdmin, token } = useAuth();

  const [activeMode, setActiveMode] = useState('overview'); // overview | evaluator | jd-match | tools | history | admin-dashboard
  const [activeTool, setActiveTool] = useState('bullets');   // 'bullets' | 'interview'

  // Common and Evaluator Mode state
  const [roles, setRoles] = useState(DEFAULT_ROLES);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('cv_ai_api_key') || '');
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [isImprovedCvModalOpen, setIsImprovedCvModalOpen] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Compute available navigation modes based on role
  const availableModes = [
    { id: 'evaluator', label: 'Resume Evaluator', Icon: IconFile },
    { id: 'jd-match', label: 'JD Matcher', Icon: IconTarget },
    { id: 'tools', label: 'AI Tools', Icon: IconWrench },
  ];

  if (isAdmin) {
    availableModes.push({
      id: 'admin-dashboard',
      label: 'Admin Console',
      Icon: IconCrown,
    });
  }

  const navigationItems = [
    { id: 'overview', label: 'Overview', Icon: IconChart },
    ...availableModes.filter((mode) => mode.id !== 'admin-dashboard'),
    { id: 'history', label: 'History', Icon: IconClock },
    ...(isAdmin ? [availableModes.find((mode) => mode.id === 'admin-dashboard')] : []),
  ].filter(Boolean);

  // Ensure active mode is valid if role changes
  useEffect(() => {
    if (!isAdmin && activeMode === 'admin-dashboard') {
      setActiveMode('evaluator');
    }
  }, [isAdmin, activeMode]);

  useEffect(() => {
    fetchRoles();
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

  const handleSaveApiKey = (newKey) => {
    setApiKey(newKey);
    localStorage.setItem('cv_ai_api_key', newKey);
  };

  // ── Evaluator Mode Action ──
  const handleEvaluate = async ({ mode, file, text, candidateName, role = 'software_development', apiKey: submittedKey }) => {
    setIsLoading(true);
    setErrorMessage(null);

    const activeKey = submittedKey || apiKey;
    const finalCandidateName = candidateName || user?.displayName || user?.username || '';

    // Auth headers
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      let res;
      if (mode === 'upload') {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('target_role', role);
        if (activeKey) formData.append('api_key', activeKey);
        if (finalCandidateName) formData.append('candidate_name', finalCandidateName);

        res = await fetch('/api/evaluate/upload', {
          method: 'POST',
          body: formData,
          headers: {
            ...authHeaders,
            ...(activeKey ? { 'X-AI-API-Key': activeKey } : {}),
          },
        });
      } else {
        res = await fetch('/api/evaluate/text', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders,
            ...(activeKey ? { 'X-AI-API-Key': activeKey } : {}),
          },
          body: JSON.stringify({
            text,
            target_role: role,
            api_key: activeKey,
            candidate_name: finalCandidateName,
          }),
        });
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Evaluation request failed.' }));
        throw new Error(err.error || err.detail || 'Evaluation failed.');
      }

      const resultData = await res.json();
      setEvaluationResult(resultData);
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || 'An error occurred during evaluation.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenRecord = async (recordOrId) => {
    setActiveMode('evaluator');
    setErrorMessage(null);
    let record = recordOrId;
    if (recordOrId == null || typeof recordOrId !== 'object') {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/history/${recordOrId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || 'Could not load this evaluation report.');
        }
        record = await res.json();
      } catch (err) {
        setErrorMessage(err.message || 'Could not load this evaluation report.');
        return;
      } finally {
        setIsLoading(false);
      }
    }
    setEvaluationResult(record);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activePage = navigationItems.find((item) => item.id === activeMode);
  const displayName = user?.displayName || user?.username || 'there';

  return (
    <div className="workspace-shell">
      <aside className="workspace-sidebar" aria-label="Main navigation">
        <div className="workspace-brand">
          <span className="workspace-brand-mark"><IconSparkles width={19} height={19} /></span>
          <span><strong>CareerCanvas</strong><small>YOUR CAREER WORKSPACE</small></span>
        </div>
        <div className="workspace-nav-label">WORKSPACE</div>
        <nav className="workspace-nav">
          {navigationItems.map((item) => {
            const NavIcon = item.id === 'admin-dashboard' ? AdminConsoleIcon : item.Icon;
            return (
              <button
                key={item.id}
                type="button"
                className={`workspace-nav-item ${activeMode === item.id ? 'active' : ''}`}
                onClick={() => setActiveMode(item.id)}
                aria-current={activeMode === item.id ? 'page' : undefined}
              >
                <NavIcon width={18} height={18} />
                <span>{item.id === 'evaluator' ? 'Resume review' : item.id === 'jd-match' ? 'Job match' : item.id === 'tools' ? 'AI tools' : item.id === 'admin-dashboard' ? 'Admin console' : item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="workspace-sidebar-bottom">
          <div className="sidebar-tip-icon"><IconSparkles width={16} height={16} /></div>
          <strong>Small steps add up</strong>
          <p>Use your feedback to make one focused improvement at a time.</p>
        </div>
      </aside>

      <div className="workspace-main">
        <div className="workspace-topbar">
          <div className="workspace-breadcrumb"><span>Workspace</span><b>/</b><strong>{activePage?.label || 'Overview'}</strong></div>
          <Header />
        </div>

        <main className="workspace-content">
          {activeMode === 'overview' && (
            <section className="overview-page">
              <div className="overview-welcome">
                <div>
                  <div className="eyebrow">YOUR CAREER TOOLKIT</div>
                  <h1>Good to see you, {displayName}</h1>
                  <p>Get clear feedback on your resume and take the next step with confidence.</p>
                </div>
                <div className="welcome-orbit" aria-hidden="true"><span><AdminOverviewIcon width={24} height={24} /></span><i /><b /></div>
              </div>

              <div className="overview-hero">
                <div className="overview-hero-copy">
                  <span className="hero-kicker">A stronger application starts here</span>
                  <h2>Make your resume work harder.</h2>
                  <p>Get an ATS check, role alignment, skill gaps, and practical feedback in one review.</p>
                  <button type="button" className="hero-action" onClick={() => setActiveMode('evaluator')}>
                    <IconFile width={16} height={16} /> Review my resume <span aria-hidden="true">→</span>
                  </button>
                </div>
                <div className="hero-illustration" aria-hidden="true">
                  <div className="hero-doc"><div /><div /><div /><div /></div>
                  <div className="hero-score"><span>ATS SCORE</span><strong>82</strong><i>+6 this week</i></div>
                </div>
              </div>

              <div className="overview-section-heading"><div><h2>Choose your next step</h2><p>Jump straight into the tool you need.</p></div></div>
              <div className="overview-action-grid">
                <button type="button" className="overview-action-card" onClick={() => setActiveMode('jd-match')}>
                  <span className="action-icon violet"><IconTarget width={19} height={19} /></span><span className="action-card-text"><strong>Match a job</strong><small>Compare your resume to a job post.</small></span><span className="action-arrow">→</span>
                </button>
                <button type="button" className="overview-action-card" onClick={() => setActiveMode('evaluator')}>
                  <span className="action-icon mint"><IconCompass width={19} height={19} /></span><span className="action-card-text"><strong>Explore career fit</strong><small>See roles that match your strengths.</small></span><span className="action-arrow">→</span>
                </button>
                <button type="button" className="overview-action-card" onClick={() => setActiveMode('tools')}>
                  <span className="action-icon peach"><IconSparkles width={19} height={19} /></span><span className="action-card-text"><strong>Practice &amp; improve</strong><small>Rewrite bullets or prep for interviews.</small></span><span className="action-arrow">→</span>
                </button>
              </div>

              <div className="overview-bottom-grid">
                <section className="overview-panel recent-panel">
                  <div className="panel-heading"><div><h2>Recent review</h2><p>Your latest resume feedback.</p></div><button type="button" className="text-action" onClick={() => setActiveMode('history')}>View history →</button></div>
                  {evaluationResult ? (
                    <button type="button" className="recent-review-row" onClick={() => setActiveMode('evaluator')}>
                      <span className="recent-file-icon"><IconFile width={18} height={18} /></span>
                      <span className="recent-review-copy"><strong>{evaluationResult.candidate_name || 'Resume evaluation'}</strong><small>Latest review · Open full report</small></span>
                      <span className="recent-score">{Math.round(evaluationResult.ats_report?.ats_score || evaluationResult.ats_data?.ats_score || evaluationResult.ats?.ats_score || 0)}<small>/100</small></span>
                    </button>
                  ) : (
                    <div className="recent-empty"><span className="empty-check"><IconCheck width={15} height={15} /></span><span><strong>Your review will appear here</strong><small>Start by uploading a resume or pasting its text.</small></span></div>
                  )}
                </section>
                <section className="overview-panel tip-panel"><span className="tip-badge"><IconSparkles width={16} height={16} /> QUICK TIP</span><h3>Show the impact, not just the task.</h3><p>Whenever you can, add a result, scale, or time saved to experience bullets. Specifics help people understand your contribution.</p><button type="button" className="text-action" onClick={() => setActiveMode('tools')}>Improve a bullet →</button></section>
              </div>
            </section>
          )}

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
        <div className="evaluator-vertical-layout">
          {/* Centered Top Upload Section */}
          <div className="evaluator-top-upload">
            <UploadSection
              apiKey={apiKey}
              onApiKeyChange={handleSaveApiKey}
              onEvaluate={handleEvaluate}
              isLoading={isLoading}
            />
          </div>

          {/* Centered Evaluation Output Section */}
          <div className="evaluator-output-section">
            {!evaluationResult && !isLoading && (
              <div className="card empty-state">
                <div className="empty-state-icon">
                  <IconFile width={42} height={42} style={{ color: 'var(--text-muted)' }} />
                </div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 8 }}>
                  No CV Evaluated Yet
                </h2>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', maxWidth: 480, margin: '0 auto 16px auto', lineHeight: 1.5 }}>
                  Upload a resume above or click <strong>Load Sample CV</strong>, then click <strong>Evaluate CV</strong> to start the verification pipeline.
                </p>
              </div>
            )}

            {isLoading && (
              <div className="card empty-state">
                <div className="empty-state-icon">
                  <IconClock width={42} height={42} style={{ color: 'var(--blue)', animation: 'pulse 1.5s infinite' }} />
                </div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 8 }}>
                  Running Multi-Stage Evaluation...
                </h2>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 520, margin: '0 auto' }}>
                  1. Checking document legitimacy &amp; structure<br />
                  2. Scoring ATS compatibility and extracting candidate data<br />
                  3. Analyzing keyword density and multi-role compatibility<br />
                  4. Querying AI model for hiring critique &amp; improvement roadmap
                </p>
              </div>
            )}

            {evaluationResult && !isLoading && (
              <EvaluatorResultsView
                evaluationResult={evaluationResult}
                onOpenKeyModal={() => setIsKeyModalOpen(true)}
                onOpenImprovedCvModal={() => setIsImprovedCvModalOpen(true)}
              />
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
          3. AI TOOLS MODE
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
              <IconSparkles width={15} height={15} style={{ marginRight: 6 }} />
              Bullet Generator (STAR Rewriter)
            </button>
            <button
              type="button"
              className={`tool-sub-tab ${activeTool === 'interview' ? 'active' : ''}`}
              onClick={() => setActiveTool('interview')}
            >
              <IconMic width={15} height={15} style={{ marginRight: 6 }} />
              Interview Prep &amp; Q&amp;A Generator
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

      {/* ─────────────────────────────────────────────────────────────
          4. ADMIN DASHBOARD & ANALYTICS MODE
         ───────────────────────────────────────────────────────────── */}
      {(activeMode === 'history' || activeMode === 'admin-dashboard') && (isAdmin || activeMode === 'history') && (
        <UserDashboard adminView={activeMode === 'admin-dashboard'} onOpenRecord={handleOpenRecord} />
      )}

      {/* Shared Modals */}
      <ApiKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        currentKey={apiKey}
        onSaveKey={handleSaveApiKey}
      />

      <ImprovedCvModal
        isOpen={isImprovedCvModalOpen}
        onClose={() => setIsImprovedCvModalOpen(false)}
        evaluationResult={evaluationResult}
      />
      </main>
      </div>
      <nav className="mobile-workspace-nav" aria-label="Mobile navigation">
        {(isAdmin
          ? navigationItems.filter((item) => ['overview', 'evaluator', 'jd-match', 'history', 'admin-dashboard'].includes(item.id))
          : navigationItems.slice(0, 5)
        ).map((item) => {
          const NavIcon = item.id === 'admin-dashboard' ? AdminConsoleIcon : item.Icon;
          return <button key={item.id} type="button" className={activeMode === item.id ? 'active' : ''} onClick={() => setActiveMode(item.id)} aria-label={item.label}><NavIcon width={19} height={19} /><span>{item.id === 'evaluator' ? 'Resume' : item.id === 'jd-match' ? 'Match' : item.id === 'overview' ? 'Home' : item.label.replace('Career ', '')}</span></button>;
        })}
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AuthGate>
        <AppContent />
      </AuthGate>
    </AuthProvider>
  );
}
