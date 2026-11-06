import React, { useState, useRef } from 'react';

const SAMPLE_JD = `Senior Software Engineer (Full-Stack & Cloud)

About the Role:
We are looking for a Senior Software Engineer with 3+ years of experience architecting distributed backend services and responsive frontends.

Key Requirements:
• Strong programming experience in Python, Go, or Java
• Solid hands-on knowledge with React, TypeScript, and modern state management
• Production experience with Docker, Kubernetes, and CI/CD pipelines
• Expertise with relational databases (PostgreSQL) and caching layers (Redis)
• Familiarity with microservices architecture, REST APIs, and system design
• Excellent problem-solving, unit testing, and cross-functional communication`;

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
- Implemented automated CI/CD pipelines with GitHub Actions and Docker, reducing deployment cycle times by 40%.

EDUCATION
B.S. in Computer Science | University of California, Berkeley (2017 – 2021)`;

export default function JDMatchPanel({ apiKey, onApiKeyChange }) {
  const [cvMode, setCvMode] = useState('paste'); // 'upload' | 'paste'
  const [cvFile, setCvFile] = useState(null);
  const [cvText, setCvText] = useState('');
  const [jdText, setJdText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDragActive, setIsDragActive] = useState(false);
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
    setJdText(SAMPLE_JD);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (cvMode === 'upload' && !cvFile) {
      setError('Please upload a CV document (PDF, Word, or TXT).');
      return;
    }
    if (cvMode === 'paste' && !cvText.trim()) {
      setError('Please paste your CV text.');
      return;
    }
    if (!jdText.trim()) {
      setError('Please paste the target job description to match against.');
      return;
    }

    setLoading(true);

    try {
      let res;
      if (cvMode === 'upload') {
        const formData = new FormData();
        formData.append('file', cvFile);
        formData.append('job_description', jdText.trim());
        if (apiKey) formData.append('api_key', apiKey.trim());

        res = await fetch('/api/jd-match/upload', {
          method: 'POST',
          body: formData,
          headers: apiKey ? { 'X-AI-API-Key': apiKey.trim() } : {}
        });
      } else {
        res = await fetch('/api/jd-match/text', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(apiKey ? { 'X-AI-API-Key': apiKey.trim() } : {})
          },
          body: JSON.stringify({
            cv_text: cvText.trim(),
            job_description: jdText.trim(),
            api_key: apiKey ? apiKey.trim() : undefined
          })
        });
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ detail: 'Failed to analyze job description match.' }));
        throw new Error(errData.error || errData.detail || 'JD Match request failed.');
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred during JD matching.');
    } finally {
      setLoading(false);
    }
  };

  // Safe normalized fields from result
  const compatScore = Math.round(
    Number(result?.compatibility_score ?? result?.score ?? result?.match_percentage ?? 0)
  );

  let gaugeColor = '#f87171';
  if (compatScore >= 80) gaugeColor = '#4ade80';
  else if (compatScore >= 60) gaugeColor = '#fbbf24';

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(Math.max(compatScore, 0), 100) / 100) * circumference;

  const matchingReqs = result?.matching_requirements || result?.matched_requirements || [];
  const missingReqs = result?.missing_requirements || result?.gap_requirements || [];
  const skillComparison = result?.skill_comparison || result?.skills_comparison || [];
  const recommendations = result?.recommendations || result?.ai_recommendations || [];
  const summary = result?.summary || result?.ai_summary;

  return (
    <div>
      {/* Input Box Card */}
      <div className="card">
        <div className="card-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>🎯</span>
            <span>Job Description Matcher & Compatibility Analyzer</span>
          </div>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleLoadSample}
            style={{ fontSize: '0.78rem' }}
          >
            ⚡ Load Sample CV & JD
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="jd-input-grid">
            {/* Left: CV Input */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span className="section-label" style={{ margin: 0 }}>Candidate CV / Resume</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    type="button"
                    className={`tab-btn ${cvMode === 'paste' ? 'active' : ''}`}
                    style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                    onClick={() => setCvMode('paste')}
                  >
                    ✏️ Text
                  </button>
                  <button
                    type="button"
                    className={`tab-btn ${cvMode === 'upload' ? 'active' : ''}`}
                    style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                    onClick={() => setCvMode('upload')}
                  >
                    📁 File
                  </button>
                </div>
              </div>

              {cvMode === 'upload' ? (
                <div>
                  {!cvFile ? (
                    <div
                      className={`dropzone ${isDragActive ? 'drag-active' : ''}`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      style={{ height: 240, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        accept=".pdf,.docx,.doc,.txt"
                        onChange={handleFileSelect}
                      />
                      <div className="dropzone-icon">📄</div>
                      <div className="dropzone-text">Upload Candidate CV</div>
                      <div className="dropzone-hint">PDF, DOCX, or TXT</div>
                    </div>
                  ) : (
                    <div className="file-selected-card" style={{ height: 240, alignItems: 'center' }}>
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
                <textarea
                  className="cv-textarea"
                  placeholder="Paste candidate's CV / resume text here..."
                  value={cvText}
                  onChange={(e) => setCvText(e.target.value)}
                />
              )}
            </div>

            {/* Right: Job Description */}
            <div>
              <div className="section-label" style={{ marginBottom: 8 }}>
                Target Job Description (JD)
              </div>
              <textarea
                className="cv-textarea"
                placeholder="Paste the target job description, responsibilities, and required qualifications here..."
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
              />
            </div>
          </div>

          {/* API Key Box */}
          <div className="api-key-box" style={{ marginTop: 0, marginBottom: 16 }}>
            <div className="api-key-header">
              <span>AI Model API Key (Groq Free / Gemini / OpenAI)</span>
              <span>{apiKey ? '✓ Key Provided' : 'Optional (Fallback heuristics run if omitted)'}</span>
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
            {loading ? 'Analyzing Job Compatibility...' : '🎯 Analyze Match'}
          </button>
        </form>
      </div>

      {/* Loading state indicator */}
      {loading && (
        <div className="card empty-state">
          <div className="empty-state-icon" style={{ animation: 'pulse 1.5s infinite' }}>🎯</div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: 8 }}>
            Comparing Resume Against Job Description...
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Extracting core requirements, analyzing keyword intersections, and evaluating candidate match readiness.
          </p>
        </div>
      )}

      {/* Result Display */}
      {result && !loading && (
        <div>
          {/* Big Gauge Card */}
          <div className="card">
            <div className="card-title">
              <span>Job Description Compatibility Report</span>
              <span
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: gaugeColor,
                  background: `${gaugeColor}15`,
                  border: `1px solid ${gaugeColor}30`,
                  padding: '3px 10px',
                  borderRadius: '999px'
                }}
              >
                {compatScore >= 80 ? 'High Match' : compatScore >= 60 ? 'Moderate Match' : 'Low Match'}
              </span>
            </div>

            <div className="compatibility-gauge">
              <div style={{ position: 'relative', width: 140, height: 140, marginBottom: 12 }}>
                <svg viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                  <circle
                    cx="70"
                    cy="70"
                    r={radius}
                    stroke="var(--bg-tertiary)"
                    strokeWidth="10"
                    fill="none"
                  />
                  <circle
                    cx="70"
                    cy="70"
                    r={radius}
                    stroke={gaugeColor}
                    strokeWidth="10"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="none"
                    style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                  />
                </svg>
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <div className="compat-score-big" style={{ color: gaugeColor }}>
                    {compatScore}%
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                    Match Score
                  </div>
                </div>
              </div>

              {summary && (
                <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', maxWidth: 650, margin: '0 auto', lineHeight: 1.6 }}>
                  {summary}
                </p>
              )}
            </div>

            {/* Two columns: Matching Requirements | Missing Requirements */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
              {/* Matching */}
              <div
                style={{
                  background: 'var(--bg-primary)',
                  border: '1px solid rgba(74, 222, 128, 0.25)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#4ade80', fontWeight: 600, fontSize: '0.88rem', marginBottom: 12 }}>
                  <span>✓</span>
                  <span>Matching Requirements ({matchingReqs.length})</span>
                </div>
                <div className="feedback-list strengths">
                  {matchingReqs.map((req, idx) => (
                    <li key={`match-${idx}`}>{req}</li>
                  ))}
                  {matchingReqs.length === 0 && (
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>No strong requirement matches identified</div>
                  )}
                </div>
              </div>

              {/* Missing */}
              <div
                style={{
                  background: 'var(--bg-primary)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#f87171', fontWeight: 600, fontSize: '0.88rem', marginBottom: 12 }}>
                  <span>✗</span>
                  <span>Missing Requirements & Gaps ({missingReqs.length})</span>
                </div>
                <div className="feedback-list weaknesses">
                  {missingReqs.map((req, idx) => (
                    <li key={`miss-${idx}`}>{req}</li>
                  ))}
                  {missingReqs.length === 0 && (
                    <div style={{ fontSize: '0.82rem', color: '#4ade80' }}>All primary JD requirements covered!</div>
                  )}
                </div>
              </div>
            </div>

            {/* Skill Comparison Table */}
            {skillComparison.length > 0 && (
              <div className="section-block">
                <div className="section-label">Detailed Competency Cross-Reference</div>
                <div style={{ overflowX: 'auto' }}>
                  <table className="skill-compare-table">
                    <thead>
                      <tr>
                        <th>Skill / Requirement</th>
                        <th style={{ textAlign: 'center', width: 120 }}>Found in CV?</th>
                        <th style={{ textAlign: 'center', width: 120 }}>Required in JD?</th>
                        <th>Relevance / Context</th>
                      </tr>
                    </thead>
                    <tbody>
                      {skillComparison.map((row, idx) => {
                        const inCv = Boolean(row.in_cv ?? row.found_in_cv);
                        const inJd = Boolean(row.in_jd ?? row.required_in_jd ?? true);

                        return (
                          <tr key={`row-${idx}`}>
                            <td style={{ fontWeight: 600 }}>{row.skill || row.name}</td>
                            <td style={{ textAlign: 'center' }}>
                              {inCv ? (
                                <span style={{ color: '#4ade80', fontWeight: 700 }}>✓ Yes</span>
                              ) : (
                                <span style={{ color: '#f87171', fontWeight: 700 }}>✗ No</span>
                              )}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {inJd ? (
                                <span style={{ color: 'var(--accent-blue)', fontWeight: 700 }}>✓ Yes</span>
                              ) : (
                                <span style={{ color: 'var(--text-dim)' }}>Optional</span>
                              )}
                            </td>
                            <td style={{ color: 'var(--text-muted)' }}>
                              {row.notes || (inCv ? 'Matched qualification' : 'Recommended to acquire or highlight')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* AI Recommendations */}
            {recommendations.length > 0 && (
              <div className="section-block" style={{ marginBottom: 0 }}>
                <div className="section-label" style={{ color: 'var(--accent-blue)' }}>
                  Tailored Recommendations to Win This Role
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {recommendations.map((rec, idx) => (
                    <div
                      key={`rec-${idx}`}
                      style={{
                        background: 'rgba(56, 189, 248, 0.08)',
                        border: '1px solid rgba(56, 189, 248, 0.25)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 12
                      }}
                    >
                      <span
                        style={{
                          background: 'var(--accent-blue)',
                          color: '#0f172a',
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          flexShrink: 0
                        }}
                      >
                        {idx + 1}
                      </span>
                      <span style={{ fontSize: '0.86rem', lineHeight: 1.55, color: '#e0f2fe' }}>
                        {rec}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
