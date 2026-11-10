import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import UploadSection from './components/UploadSection';
import EvaluatorResultsView from './components/EvaluatorResultsView';
import JDMatchPanel from './components/JDMatchPanel';
import BulletGeneratorPanel from './components/BulletGeneratorPanel';
import InterviewPrepPanel from './components/InterviewPrepPanel';
import ApiKeyModal from './components/ApiKeyModal';
import ImprovedCvModal from './components/ImprovedCvModal';
import {
  IconFile,
  IconTarget,
  IconWrench,
  IconClock,
  IconSparkles,
  IconMic
} from './components/Icons';

const DEFAULT_ROLES = [
  { id: 'software_development', title: 'Software Development', description: 'General software systems, data structures, backend & architecture.' },
  { id: 'ai_engineer', title: 'AI Engineer', description: 'Machine learning, deep learning, LLMs, RAG, and model serving.' },
  { id: 'data_analyst', title: 'Data Analyst', description: 'SQL querying, BI dashboards, statistical modeling, and business insights.' },
  { id: 'web_development', title: 'Web Development', description: 'Full-stack/frontend web apps, React, Node.js, and web performance.' }
];

const MODES = [
  { id: 'evaluator', label: 'Resume Evaluator', Icon: IconFile },
  { id: 'jd-match', label: 'JD Matcher', Icon: IconTarget },
  { id: 'tools', label: 'AI Tools', Icon: IconWrench },
];

export default function App() {
  const [activeMode, setActiveMode] = useState('evaluator'); // 'evaluator' | 'jd-match' | 'tools'
  const [activeTool, setActiveTool] = useState('bullets');   // 'bullets' | 'interview'

  // Common and Evaluator Mode state
  const [roles, setRoles] = useState(DEFAULT_ROLES);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('cv_ai_api_key') || '');
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [isImprovedCvModalOpen, setIsImprovedCvModalOpen] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

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
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || 'An error occurred during evaluation.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      {/* Top Header */}
      <Header />

      {/* Mode Switcher Tabs */}
      <nav className="mode-tabs">
        {MODES.map((mode) => {
          const ModeIcon = mode.Icon;
          return (
            <button
              key={mode.id}
              type="button"
              className={`mode-tab ${activeMode === mode.id ? 'active' : ''}`}
              onClick={() => setActiveMode(mode.id)}
            >
              <ModeIcon width={16} height={16} style={{ marginRight: 6 }} />
              {mode.label}
            </button>
          );
        })}
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
          1. EVALUATOR MODE (Upload centered on top, output below)
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
    </div>
  );
}
