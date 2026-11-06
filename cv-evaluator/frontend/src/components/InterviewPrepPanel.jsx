import React, { useState, useRef } from 'react';

const SAMPLE_CV_TEXT = `Alex Chen
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

export default function InterviewPrepPanel({ apiKey, onApiKeyChange, roles = [] }) {
  const [cvMode, setCvMode] = useState('paste'); // 'upload' | 'paste'
  const [cvFile, setCvFile] = useState(null);
  const [cvText, setCvText] = useState('');
  const [selectedRole, setSelectedRole] = useState(roles[0]?.id || 'software_development');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedQuestions, setExpandedQuestions] = useState({});
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const toggleQuestion = (id) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

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
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setCvFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setCvFile(e.target.files[0]);
    }
  };

  const handleLoadSample = () => {
    setCvMode('paste');
    setCvText(SAMPLE_CV_TEXT);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (cvMode === 'upload' && !cvFile) {
      setError('Please upload your CV document.');
      return;
    }
    if (cvMode === 'paste' && !cvText.trim()) {
      setError('Please paste your CV text.');
      return;
    }

    setLoading(true);

    try {
      let res;
      if (cvMode === 'upload') {
        const formData = new FormData();
        formData.append('file', cvFile);
        formData.append('role', selectedRole);
        if (apiKey) formData.append('api_key', apiKey.trim());

        res = await fetch('/api/interview-prep', {
          method: 'POST',
          body: formData,
          headers: apiKey ? { 'X-AI-API-Key': apiKey.trim() } : {}
        });
      } else {
        res = await fetch('/api/interview-prep', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(apiKey ? { 'X-AI-API-Key': apiKey.trim() } : {})
          },
          body: JSON.stringify({
            cv_text: cvText.trim(),
            role: selectedRole,
            api_key: apiKey ? apiKey.trim() : undefined
          })
        });
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ detail: 'Failed to generate interview questions.' }));
        throw new Error(errData.error || errData.detail || 'Interview prep request failed.');
      }

      const data = await res.json();
      setResult(data);
      // Auto-expand the first question of each category for convenience
      setExpandedQuestions({
        'tech-0': true,
        'proj-0': true,
        'hr-0': true
      });
    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred while generating interview questions.');
    } finally {
      setLoading(false);
    }
  };

  // Normalize questions from result
  const technicalQuestions = result?.technical || result?.technical_questions || [];
  const projectQuestions = result?.project_based || result?.project_questions || [];
  const hrQuestions = result?.behavioral || result?.hr || result?.behavioral_questions || [];

  const getDifficultyClass = (diff) => {
    const text = (diff || '').toLowerCase();
    if (text.includes('easy')) return 'diff-easy';
    if (text.includes('hard')) return 'diff-hard';
    return 'diff-medium';
  };

  return (
    <div>
      <div className="card">
        <div className="card-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>🎤</span>
            <span>AI Interview Preparation & Mock Questions</span>
          </div>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleLoadSample}
            style={{ fontSize: '0.78rem' }}
          >
            ⚡ Load Sample CV
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
            >
              ✏️ Paste CV Text
            </button>
            <button
              type="button"
              className={`tab-btn ${cvMode === 'upload' ? 'active' : ''}`}
              onClick={() => setCvMode('upload')}
            >
              📁 Upload CV File
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
                  <div className="dropzone-icon">📄</div>
                  <div className="dropzone-text">Click to choose or drop your CV</div>
                  <div className="dropzone-hint">Supports PDF, DOCX, TXT</div>
                </div>
              ) : (
                <div className="file-selected-card">
                  <div className="file-info-col">
                    <div className="file-type-icon">📄</div>
                    <div className="file-details">
                      <div className="file-name" title={cvFile.name}>{cvFile.name}</div>
                      <div className="file-meta">
                        <span className="file-size">{(cvFile.size / 1024).toFixed(1)} KB</span>
                        <span className="file-ready-tag">✓ Ready</span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-change-file"
                    onClick={() => setCvFile(null)}
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
                style={{ height: 180 }}
                placeholder="Paste candidate's CV here to extract tailored technical, project-specific, and behavioral interview questions..."
                value={cvText}
                onChange={(e) => setCvText(e.target.value)}
              />
            </div>
          )}

          {/* API Key Box */}
          <div className="api-key-box" style={{ marginBottom: 16 }}>
            <div className="api-key-header">
              <span>AI Model API Key (Groq Free / Gemini / OpenAI)</span>
              <span>{apiKey ? '✓ Key Provided' : 'Optional (Free Groq / Fallback)'}</span>
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
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.84rem',
                marginBottom: 16
              }}
            >
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? 'Synthesizing Tailored Interview Questions...' : '🎤 Generate Interview Questions'}
          </button>
        </form>
      </div>

      {/* Loading animation */}
      {loading && (
        <div className="card empty-state">
          <div className="empty-state-icon" style={{ animation: 'pulse 1.5s infinite' }}>🎤</div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: 8 }}>
            Curating Interview Questions & Model Answers...
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
                <span>💻 Technical Depth & System Architecture</span>
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
                        <span style={{ color: 'var(--accent-blue)', fontSize: '0.8rem', marginRight: 4 }}>
                          {isExpanded ? '▼' : '▶'}
                        </span>
                        <div className="interview-q-text">{qText}</div>
                        <span className={`interview-difficulty ${getDifficultyClass(difficulty)}`}>
                          {difficulty}
                        </span>
                      </div>

                      {isExpanded && answer && (
                        <div className="interview-answer">
                          <div style={{ fontWeight: 600, fontSize: '0.78rem', color: 'var(--accent-blue)', marginBottom: 4 }}>
                            💡 Model Answer / Evaluator Key:
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
                <span>🛠️ Project-Based & Architecture Deep Dives</span>
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
                        <span style={{ color: 'var(--accent-blue)', fontSize: '0.8rem', marginRight: 4 }}>
                          {isExpanded ? '▼' : '▶'}
                        </span>
                        <div className="interview-q-text">{qText}</div>
                      </div>

                      {isExpanded && answer && (
                        <div className="interview-answer">
                          <div style={{ fontWeight: 600, fontSize: '0.78rem', color: '#4ade80', marginBottom: 4 }}>
                            💡 Model STAR Response Framework:
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
                <span>🤝 HR & Behavioral STAR Scenarios</span>
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
                        <span style={{ color: 'var(--accent-blue)', fontSize: '0.8rem', marginRight: 4 }}>
                          {isExpanded ? '▼' : '▶'}
                        </span>
                        <div className="interview-q-text">{qText}</div>
                      </div>

                      {isExpanded && answer && (
                        <div className="interview-answer">
                          <div style={{ fontWeight: 600, fontSize: '0.78rem', color: '#fbbf24', marginBottom: 4 }}>
                            💡 Behavioral Assessment Guide:
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
