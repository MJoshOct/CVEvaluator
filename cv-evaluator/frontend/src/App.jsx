import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import UploadSection from './components/UploadSection';
import LegitimacyReport from './components/LegitimacyReport';
import RoleScorecard from './components/RoleScorecard';
import AiFeedbackReport from './components/AiFeedbackReport';
import ApiKeyModal from './components/ApiKeyModal';
import HistoryModal from './components/HistoryModal';

const DEFAULT_ROLES = [
  { id: 'software_development', title: 'Software Development', description: 'General software systems, data structures, backend & architecture.' },
  { id: 'ai_engineer', title: 'AI Engineer', description: 'Machine learning, deep learning, LLMs, RAG, and model serving.' },
  { id: 'data_analyst', title: 'Data Analyst', description: 'SQL querying, BI dashboards, statistical modeling, and business insights.' },
  { id: 'web_development', title: 'Web Development', description: 'Full-stack/frontend web apps, React, Node.js, and web performance.' }
];

export default function App() {
  const [roles, setRoles] = useState(DEFAULT_ROLES);
  const [selectedRole, setSelectedRole] = useState('software_development');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('cv_ai_api_key') || '');
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

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
        throw new Error(err.detail || 'Evaluation failed.');
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

  const handleSelectHistoryRecord = async (id) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/history/${id}`);
      if (res.ok) {
        const record = await res.json();
        // Convert to EvaluationResponse format
        setEvaluationResult({
          id: record.id,
          created_at: record.created_at,
          candidate_name: record.candidate_name,
          target_role: record.target_role,
          legitimacy: {
            is_legitimate: record.is_legitimate,
            score: record.legitimacy_score,
            detected_sections: record.is_legitimate ? ['Contact Information', 'Experience', 'Education'] : [],
            missing_sections: record.is_legitimate ? [] : ['Contact Information / Valid Format'],
            has_contact_info: record.is_legitimate,
            word_count: 350,
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
      }
    } catch (e) {
      console.error('Error fetching record details:', e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      <Header
        apiKey={apiKey}
        onOpenKeyModal={() => setIsKeyModalOpen(true)}
        onOpenHistory={() => setIsHistoryModalOpen(true)}
        historyCount={history.length}
      />

      {errorMessage && (
        <div className="status-banner fail" style={{ marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            <div className="status-title">Error</div>
            <div className="status-details">{errorMessage}</div>
          </div>
        </div>
      )}

      <div className="main-grid">
        {/* Left Column: Input and Role Selector */}
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
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: 420, margin: '0 auto 16px auto' }}>
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
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                1. Checking document legitimacy & structure<br />
                2. Scoring against predefined role dataset criteria<br />
                3. Querying AI model for hiring critique & improvement roadmap
              </p>
            </div>
          )}

          {evaluationResult && !isLoading && (
            <div>
              {/* Step 1: Legitimacy Check */}
              <LegitimacyReport legitimacy={evaluationResult.legitimacy} />

              {/* Step 2: Role Predefined Match (only if passed legitimacy) */}
              {evaluationResult.legitimacy?.is_legitimate && evaluationResult.predefined_evaluation && (
                <RoleScorecard evaluation={evaluationResult.predefined_evaluation} />
              )}

              {/* Step 3: AI Model Feedback & Improvement (only if passed legitimacy) */}
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
