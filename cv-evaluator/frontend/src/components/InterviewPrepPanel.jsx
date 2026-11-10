import React, { useState, useRef } from 'react';
import {
  IconMic,
  IconFile,
  IconEdit,
  IconUpload,
  IconRefresh,
  IconCheck,
  IconAlertTriangle,
  IconCpu,
  IconWrench,
  IconUser,
  IconLightbulb
} from './Icons';

const SAMPLE_INTERVIEW_CVS = {
  software_development: `Alex Chen
alex.chen@email.com | +1 (555) 019-2834 | linkedin.com/in/alexchen-dev | github.com/alexchen

PROFESSIONAL EXPERIENCE
Senior Software Engineer | NexaTech Systems (2022 – Present)
- Architected and deployed microservices in Go and Python serving 2M+ daily active users with 99.98% uptime.
- Optimized database indexing and Redis caching, cutting P99 API response latency from 420ms to 85ms.
- Implemented automated CI/CD pipelines with GitHub Actions and Docker, reducing deployment cycle times by 40%.

Associate Software Developer | CloudBase Labs (2021 – 2022)
- Built RESTful APIs using Java Spring Boot and PostgreSQL for enterprise client onboarding.
- Authored unit and integration test suites using JUnit and PyTest, raising test coverage from 60% to 88%.`,

  ai_engineer: `Maya Patel
maya.patel@email.com | +1 (555) 432-8765 | github.com/mayapatel-ai | linkedin.com/in/mayapatel

PROFESSIONAL EXPERIENCE
AI Engineer | Synapse Intelligence (2023 – Present)
- Engineered enterprise RAG pipeline using LangChain, ChromaDB, and fine-tuned Llama-3 models to parse 500k+ documents with 92% retrieval precision.
- Fine-tuned transformer models using LoRA/QLoRA on proprietary domain datasets, reducing model hallucination by 34%.
- Containerized model serving using FastAPI, vLLM, and Docker on NVIDIA GPU instances with sub-120ms token latency.`,

  data_analyst: `Jordan Lee
jordan.lee@email.com | +1 (555) 789-0123 | linkedin.com/in/jordanlee-analytics

PROFESSIONAL EXPERIENCE
Senior Data Analyst | RetailMetric Corp (2022 – Present)
- Designed executive Tableau dashboards tracking $45M in omnichannel retail revenue and customer churn metrics.
- Executed rigorous A/B testing frameworks and hypothesis testing for checkout redesign, elevating checkout conversion rate by 6.2%.
- Optimized BigQuery SQL queries and automated ETL data cleansing scripts, reducing reporting refresh time by 65%.`,

  web_development: `Samira Khan
samira.khan@email.com | +1 (555) 321-9876 | github.com/samirak-web | linkedin.com/in/samirakhan

PROFESSIONAL EXPERIENCE
Full-Stack Developer | PixelCraft Studio (2022 – Present)
- Engineered responsive SaaS web applications in React, TypeScript, and Tailwind CSS serving 150k monthly active users.
- Built scalable Node.js/Express REST APIs with JWT authentication and PostgreSQL, ensuring secure session management.
- Improved Core Web Vitals and Lighthouse performance score from 68 to 96 by implementing code splitting and image optimization.`
};

export default function InterviewPrepPanel({ apiKey, onApiKeyChange, roles = [] }) {
  const [selectedRole, setSelectedRole] = useState('software_development');
  const [cvMode, setCvMode] = useState('paste'); // 'paste' | 'upload'
  const [cvText, setCvText] = useState('');
  const [cvFile, setCvFile] = useState(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [expandedQuestions, setExpandedQuestions] = useState({});
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = () => {
    setIsDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      setCvFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files?.[0]) {
      setCvFile(e.target.files[0]);
    }
  };

  const handleLoadSample = () => {
    setCvMode('paste');
    setCvText(SAMPLE_INTERVIEW_CVS[selectedRole] || SAMPLE_INTERVIEW_CVS.software_development);
  };

  const toggleQuestion = (id) => {
    setExpandedQuestions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (cvMode === 'upload' && !cvFile) {
      setError('Please choose or drop a CV file first.');
      return;
    }
    if (cvMode === 'paste' && !cvText.trim()) {
      setError('Please paste CV text to generate interview questions.');
      return;
    }

    setLoading(true);

    try {
      let res;
      if (cvMode === 'upload') {
        const formData = new FormData();
        formData.append('file', cvFile);
        formData.append('target_role', selectedRole);
        if (apiKey) formData.append('api_key', apiKey);

        res = await fetch('/api/tools/interview-prep', {
          method: 'POST',
          body: formData,
          headers: apiKey ? { 'X-AI-API-Key': apiKey } : {}
        });
      } else {
        res = await fetch('/api/tools/interview-prep', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(apiKey ? { 'X-AI-API-Key': apiKey } : {})
          },
          body: JSON.stringify({
            cv_text: cvText.trim(),
            target_role: selectedRole,
            api_key: apiKey
          })
        });
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Failed to generate interview prep questions.' }));
        throw new Error(err.error || err.detail || 'Interview preparation service failed.');
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred while generating interview prep questions.');
    } finally {
      setLoading(false);
    }
  };

  const technicalQuestions = result?.technical_questions || result?.technical || [];
  const projectQuestions = result?.project_questions || result?.project_deep_dive || [];
  const hrQuestions = result?.behavioral_questions || result?.hr_questions || result?.behavioral || [];

  const getDifficultyClass = (diff) => {
    const text = (diff || '').toLowerCase();
    if (text.includes('hard') || text.includes('advanced')) return 'diff-hard';
    if (text.includes('easy') || text.includes('junior')) return 'diff-easy';
    return 'diff-medium';
  };

  return (
    <div>
      <div className="card">
        <div className="card-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <IconMic width={16} height={16} />
            <span>AI Interview Preparation &amp; Mock Questions</span>
          </div>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleLoadSample}
            style={{ fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <IconFile width={13} height={13} />
            Load Sample CV
          </button>
        </div>

        {/* Role Selector */}
        <div style={{ marginBottom: 16 }}>
          <div className="section-label" style={{ marginBottom: 8 }}>
            Target Interview Role
          </div>
          <div className="roles-grid">
            {roles.map((r) => (
              <button
                key={r.id}
                type="button"
                className={`role-pill ${selectedRole === r.id ? 'active' : ''}`}
                onClick={() => setSelectedRole(r.id)}
              >
                <span className="role-name">{r.title}</span>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Mode Tabs */}
          <div className="tabs">
            <button
              type="button"
              className={`tab-btn ${cvMode === 'paste' ? 'active' : ''}`}
              onClick={() => setCvMode('paste')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
            >
              <IconEdit width={13} height={13} />
              Paste CV Text
            </button>
            <button
              type="button"
              className={`tab-btn ${cvMode === 'upload' ? 'active' : ''}`}
              onClick={() => setCvMode('upload')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
            >
              <IconUpload width={13} height={13} />
              Upload CV File
            </button>
          </div>

          {cvMode === 'upload' ? (
            <div style={{ marginBottom: 16 }}>
              {!cvFile ? (
                <div
                  className={`dropzone ${isDragActive ? 'drag-active' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{ padding: '24px 20px' }}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept=".pdf,.docx,.doc,.txt"
                    onChange={handleFileSelect}
                  />
                  <div className="dropzone-icon">
                    <IconUpload width={32} height={32} style={{ color: 'var(--text-muted)' }} />
                  </div>
                  <div className="dropzone-text">Click to choose or drop your CV</div>
                  <div className="dropzone-hint">Supports PDF, DOCX, TXT</div>
                </div>
              ) : (
                <div className="file-selected-card">
                  <div className="file-info-col">
                    <div className="file-type-icon">
                      <IconFile width={20} height={20} />
                    </div>
                    <div className="file-details">
                      <div className="file-name" title={cvFile.name}>{cvFile.name}</div>
                      <div className="file-meta">
                        <span className="file-size">{(cvFile.size / 1024).toFixed(1)} KB</span>
                        <span className="file-ready-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <IconCheck width={11} height={11} />
                          Ready
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-change-file"
                    onClick={() => setCvFile(null)}
                  >
                    <IconRefresh width={13} height={13} style={{ marginRight: 4 }} />
                    Change
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ marginBottom: 16 }}>
              <textarea
                className="cv-textarea"
                placeholder="Paste candidate's CV text here to generate tailored interview questions..."
                value={cvText}
                onChange={(e) => setCvText(e.target.value)}
              />
            </div>
          )}

          {/* API Key Box */}
          <div className="api-key-box" style={{ marginTop: 0, marginBottom: 16 }}>
            <div className="api-key-header">
              <span>AI Model API Key (Groq Free / Gemini / OpenAI)</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                {apiKey && <IconCheck width={11} height={11} />}
                {apiKey ? 'Key Provided' : 'Optional (Free Groq / Fallback)'}
              </span>
            </div>
            <input
              type="password"
              className="api-input"
              placeholder="Enter API Key (e.g. gsk_... for Groq, AIza... for Gemini, sk-... for OpenAI)"
              value={apiKey}
              onChange={(e) => onApiKeyChange(e.target.value)}
            />
          </div>

          {error && (
            <div
              style={{
                background: 'var(--red-tint)',
                border: '1px solid var(--red-border)',
                color: '#991b1b',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.84rem',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <IconAlertTriangle width={15} height={15} />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            disabled={loading}
          >
            {loading ? (
              <span>Synthesizing Tailored Interview Questions...</span>
            ) : (
              <>
                <IconMic width={15} height={15} />
                <span>Generate Interview Questions</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Loading animation */}
      {loading && (
        <div className="card empty-state">
          <div className="empty-state-icon">
            <IconMic width={42} height={42} style={{ color: 'var(--blue)', animation: 'pulse 1.5s infinite' }} />
          </div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: 8 }}>
            Curating Interview Questions &amp; Model Answers...
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Analyzing candidate's listed projects, verifying technology depth, and crafting rigorous interview prompts.
          </p>
        </div>
      )}

      {/* Results View */}
      {result && !loading && (
        <div>
          {/* Section 1: Technical Questions */}
          {technicalQuestions.length > 0 && (
            <div className="card interview-category">
              <div className="interview-category-title">
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <IconCpu width={15} height={15} />
                  Technical Depth &amp; System Architecture
                </span>
                <span className="tag tag-neutral" style={{ fontSize: '0.72rem' }}>
                  {technicalQuestions.length} Questions
                </span>
              </div>

              <div>
                {technicalQuestions.map((q, idx) => {
                  const key = `tech-${idx}`;
                  const isExpanded = Boolean(expandedQuestions[key]);
                  const qText = q.question || q.q || q.title || (typeof q === 'string' ? q : '');
                  const answer = q.answer || q.model_answer || q.sample_answer || q.solution;
                  const difficulty = q.difficulty || (idx % 3 === 0 ? 'Hard' : idx % 2 === 0 ? 'Medium' : 'Easy');

                  return (
                    <div key={key} className="interview-question-card">
                      <div className="interview-q-header" onClick={() => toggleQuestion(key)}>
                        <span style={{ color: 'var(--blue)', fontSize: '0.8rem', marginRight: 4 }}>
                          {isExpanded ? '▼' : '▶'}
                        </span>
                        <div className="interview-q-text">{qText}</div>
                        <span className={`interview-difficulty ${getDifficultyClass(difficulty)}`}>
                          {difficulty}
                        </span>
                      </div>

                      {isExpanded && answer && (
                        <div className="interview-answer">
                          <div style={{ fontWeight: 600, fontSize: '0.78rem', color: 'var(--blue)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
                            <IconLightbulb width={13} height={13} />
                            Model Answer / Evaluator Key:
                          </div>
                          <div>{answer}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 2: Project-Based Questions */}
          {projectQuestions.length > 0 && (
            <div className="card interview-category">
              <div className="interview-category-title">
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <IconWrench width={15} height={15} />
                  Project-Based &amp; Architecture Deep Dives
                </span>
                <span className="tag tag-neutral" style={{ fontSize: '0.72rem' }}>
                  {projectQuestions.length} Questions
                </span>
              </div>

              <div>
                {projectQuestions.map((q, idx) => {
                  const key = `proj-${idx}`;
                  const isExpanded = Boolean(expandedQuestions[key]);
                  const qText = q.question || q.q || q.title || (typeof q === 'string' ? q : '');
                  const answer = q.answer || q.model_answer || q.sample_answer || q.solution;

                  return (
                    <div key={key} className="interview-question-card">
                      <div className="interview-q-header" onClick={() => toggleQuestion(key)}>
                        <span style={{ color: 'var(--blue)', fontSize: '0.8rem', marginRight: 4 }}>
                          {isExpanded ? '▼' : '▶'}
                        </span>
                        <div className="interview-q-text">{qText}</div>
                      </div>

                      {isExpanded && answer && (
                        <div className="interview-answer">
                          <div style={{ fontWeight: 600, fontSize: '0.78rem', color: '#16a34a', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
                            <IconLightbulb width={13} height={13} />
                            Model STAR Response Framework:
                          </div>
                          <div>{answer}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 3: Behavioral / HR */}
          {hrQuestions.length > 0 && (
            <div className="card interview-category">
              <div className="interview-category-title">
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <IconUser width={15} height={15} />
                  HR &amp; Behavioral STAR Scenarios
                </span>
                <span className="tag tag-neutral" style={{ fontSize: '0.72rem' }}>
                  {hrQuestions.length} Questions
                </span>
              </div>

              <div>
                {hrQuestions.map((q, idx) => {
                  const key = `hr-${idx}`;
                  const isExpanded = Boolean(expandedQuestions[key]);
                  const qText = q.question || q.q || q.title || (typeof q === 'string' ? q : '');
                  const answer = q.answer || q.model_answer || q.sample_answer || q.solution;

                  return (
                    <div key={key} className="interview-question-card">
                      <div className="interview-q-header" onClick={() => toggleQuestion(key)}>
                        <span style={{ color: 'var(--blue)', fontSize: '0.8rem', marginRight: 4 }}>
                          {isExpanded ? '▼' : '▶'}
                        </span>
                        <div className="interview-q-text">{qText}</div>
                      </div>

                      {isExpanded && answer && (
                        <div className="interview-answer">
                          <div style={{ fontWeight: 600, fontSize: '0.78rem', color: '#b45309', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
                            <IconLightbulb width={13} height={13} />
                            Behavioral Assessment Guide:
                          </div>
                          <div>{answer}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
