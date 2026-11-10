import React, { useState, useRef } from 'react';
import {
  IconUpload,
  IconEdit,
  IconFile,
  IconRefresh,
  IconCheck,
  IconPlay,
  IconFileText,
  IconPlus,
  IconTrash,
  IconSparkles
} from './Icons';

const SAMPLE_CV = `Alex Chen
alex.chen@email.com | +1 (555) 019-2834 | linkedin.com/in/alexchen-dev | github.com/alexchen

PROFESSIONAL SUMMARY
Results-driven Software Engineer with 3+ years of experience architecting distributed systems, backend microservices, and high-throughput APIs.

TECHNICAL SKILLS
- Languages: Python, Java, C++, Go, SQL, TypeScript
- Technologies & Tools: Docker, Kubernetes, Linux, Git, CI/CD, PostgreSQL, Redis, Kafka, AWS
- Concepts: System Design, OOP, Data Structures, Algorithms, Unit Testing, TDD, Agile/Scrum

PROFESSIONAL EXPERIENCE
Software Engineer | NexaTech Systems (2022 – Present)
- Architected and deployed microservices in Go and Python serving 2M+ daily active users with 99.98% uptime.
- Optimized database indexing and Redis caching, cutting P99 API response latency from 420ms to 85ms.
- Implemented automated CI/CD pipelines with GitHub Actions and Docker, reducing deployment cycle times by 40%.

Associate Software Developer | CloudBase Labs (2021 – 2022)
- Built RESTful APIs using Java Spring Boot and PostgreSQL for enterprise client onboarding.
- Authored unit and integration test suites using JUnit and PyTest, raising test coverage from 60% to 88%.

EDUCATION
B.S. in Computer Science | University of California, Berkeley (2017 – 2021)
- Relevant Coursework: Data Structures & Algorithms, Operating Systems, Database Systems`;

const INITIAL_TEMPLATE_STATE = {
  fullName: 'Alex Chen',
  email: 'alex.chen@email.com',
  phone: '+1 (555) 019-2834',
  linkedin: 'linkedin.com/in/alexchen-dev',
  github: 'github.com/alexchen',
  summary: 'Results-driven Software Engineer with 3+ years of experience architecting distributed systems, backend microservices, and high-throughput APIs.',
  skills: 'Python, Java, Go, SQL, TypeScript, Docker, Kubernetes, Git, CI/CD, PostgreSQL, Redis, Kafka, AWS, System Design, REST APIs',
  experiences: [
    {
      id: 1,
      title: 'Software Engineer',
      company: 'NexaTech Systems',
      dates: '2022 – Present',
      bullets: 'Architected and deployed microservices in Go and Python serving 2M+ daily active users with 99.98% uptime.\nOptimized database indexing and Redis caching, cutting P99 API response latency from 420ms to 85ms.\nImplemented automated CI/CD pipelines with GitHub Actions and Docker, reducing deployment cycle times by 40%.'
    },
    {
      id: 2,
      title: 'Associate Software Developer',
      company: 'CloudBase Labs',
      dates: '2021 – 2022',
      bullets: 'Built RESTful APIs using Java Spring Boot and PostgreSQL for enterprise client onboarding.\nAuthored unit and integration test suites using JUnit and PyTest, raising test coverage from 60% to 88%.'
    }
  ],
  education: {
    degree: 'B.S. in Computer Science',
    institution: 'University of California, Berkeley',
    dates: '2017 – 2021',
    coursework: 'Data Structures & Algorithms, Operating Systems, Database Systems'
  },
  projects: 'Distributed Task Queue (Go, Redis) – High-performance task scheduler handling 10k tasks/sec with retry mechanisms and persistent logging.'
};

const BLANK_TEMPLATE_STATE = {
  fullName: '',
  email: '',
  phone: '',
  linkedin: '',
  github: '',
  summary: '',
  skills: '',
  experiences: [
    {
      id: 1,
      title: '',
      company: '',
      dates: '',
      bullets: ''
    }
  ],
  education: {
    degree: '',
    institution: '',
    dates: '',
    coursework: ''
  },
  projects: ''
};

export function compileTemplateToCv(tpl) {
  const parts = [];

  const name = tpl.fullName?.trim();
  if (name) parts.push(name);

  const contacts = [tpl.email, tpl.phone, tpl.linkedin, tpl.github]
    .filter(Boolean)
    .map(s => s.trim());
  if (contacts.length) parts.push(contacts.join(' | '));

  if (tpl.summary && tpl.summary.trim()) {
    parts.push(`\nPROFESSIONAL SUMMARY\n${tpl.summary.trim()}`);
  }

  if (tpl.skills && tpl.skills.trim()) {
    parts.push(`\nTECHNICAL SKILLS\n- Core Competencies & Tools: ${tpl.skills.trim()}`);
  }

  if (tpl.experiences && tpl.experiences.length) {
    const expStrings = tpl.experiences
      .filter(exp => exp.title?.trim() || exp.company?.trim())
      .map(exp => {
        const header = `${exp.title?.trim() || 'Role'} | ${exp.company?.trim() || 'Company'} (${exp.dates?.trim() || 'Dates'})`;
        const bullets = (exp.bullets || '')
          .split('\n')
          .map(b => b.trim())
          .filter(Boolean)
          .map(b => (b.startsWith('-') ? b : `- ${b}`))
          .join('\n');
        return `${header}\n${bullets}`;
      });

    if (expStrings.length) {
      parts.push(`\nPROFESSIONAL EXPERIENCE\n${expStrings.join('\n\n')}`);
    }
  }

  if (tpl.education && (tpl.education.degree?.trim() || tpl.education.institution?.trim())) {
    const eduHeader = `${tpl.education.degree?.trim() || 'Degree'} | ${tpl.education.institution?.trim() || 'Institution'} (${tpl.education.dates?.trim() || 'Dates'})`;
    const cw = tpl.education.coursework?.trim() ? `\n- Relevant Coursework: ${tpl.education.coursework.trim()}` : '';
    parts.push(`\nEDUCATION\n${eduHeader}${cw}`);
  }

  if (tpl.projects && tpl.projects.trim()) {
    parts.push(`\nPROJECTS & ACHIEVEMENTS\n- ${tpl.projects.trim()}`);
  }

  return parts.join('\n');
}

export default function UploadSection({
  apiKey,
  onApiKeyChange,
  onEvaluate,
  isLoading
}) {
  const [inputMode, setInputMode] = useState('upload'); // 'upload', 'paste', or 'template'
  const [selectedFile, setSelectedFile] = useState(null);
  const [pastedText, setPastedText] = useState('');
  const [templateData, setTemplateData] = useState(INITIAL_TEMPLATE_STATE);
  const [candidateName, setCandidateName] = useState('');
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
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleLoadSample = () => {
    if (inputMode === 'template') {
      setTemplateData(INITIAL_TEMPLATE_STATE);
    } else {
      setInputMode('paste');
      setPastedText(SAMPLE_CV);
    }
  };

  const handleClearTemplate = () => {
    setTemplateData(BLANK_TEMPLATE_STATE);
  };

  // Template Handlers
  const handleTemplateChange = (field, value) => {
    setTemplateData(prev => ({ ...prev, [field]: value }));
  };

  const handleEducationChange = (field, value) => {
    setTemplateData(prev => ({
      ...prev,
      education: { ...prev.education, [field]: value }
    }));
  };

  const handleExperienceChange = (id, field, value) => {
    setTemplateData(prev => ({
      ...prev,
      experiences: prev.experiences.map(exp => exp.id === id ? { ...exp, [field]: value } : exp)
    }));
  };

  const handleAddExperience = () => {
    const newId = Date.now();
    setTemplateData(prev => ({
      ...prev,
      experiences: [
        ...prev.experiences,
        { id: newId, title: '', company: '', dates: '', bullets: '' }
      ]
    }));
  };

  const handleRemoveExperience = (id) => {
    setTemplateData(prev => ({
      ...prev,
      experiences: prev.experiences.filter(exp => exp.id !== id)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (inputMode === 'upload') {
      if (!selectedFile) {
        alert('Please choose or drop a CV file first.');
        return;
      }
      onEvaluate({
        mode: 'upload',
        file: selectedFile,
        text: '',
        candidateName: candidateName.trim(),
        role: 'software_development',
        apiKey: apiKey ? apiKey.trim() : ''
      });
    } else if (inputMode === 'paste') {
      if (!pastedText.trim()) {
        alert('Please paste the CV text to evaluate.');
        return;
      }
      onEvaluate({
        mode: 'paste',
        file: null,
        text: pastedText,
        candidateName: candidateName.trim(),
        role: 'software_development',
        apiKey: apiKey ? apiKey.trim() : ''
      });
    } else if (inputMode === 'template') {
      const compiled = compileTemplateToCv(templateData);
      if (!compiled.trim() || (!templateData.fullName.trim() && !templateData.skills.trim())) {
        alert('Please enter your details in the template before evaluating.');
        return;
      }
      onEvaluate({
        mode: 'paste',
        file: null,
        text: compiled,
        candidateName: (templateData.fullName || candidateName).trim(),
        role: 'software_development',
        apiKey: apiKey ? apiKey.trim() : ''
      });
    }
  };

  return (
    <div className="card upload-main-card">
      <div className="upload-header">
        <h2 className="upload-title">Evaluate Resume / CV</h2>
        <p className="upload-subtitle">
          Upload your document, paste text, or fill in the guided ATS template below to run comprehensive verification, scoring, keyword density mapping, and AI recommendations.
        </p>
      </div>

      {/* Input Mode Selector & Action Toolbar */}
      <div className="upload-toolbar">
        <div className="tabs upload-tabs">
          <button
            type="button"
            className={`tab-btn ${inputMode === 'upload' ? 'active' : ''}`}
            onClick={() => setInputMode('upload')}
          >
            <IconUpload width={15} height={15} style={{ marginRight: 6 }} />
            Upload File
          </button>
          <button
            type="button"
            className={`tab-btn ${inputMode === 'paste' ? 'active' : ''}`}
            onClick={() => setInputMode('paste')}
          >
            <IconEdit width={15} height={15} style={{ marginRight: 6 }} />
            Paste CV Text
          </button>
          <button
            type="button"
            className={`tab-btn ${inputMode === 'template' ? 'active' : ''}`}
            onClick={() => setInputMode('template')}
          >
            <IconFileText width={15} height={15} style={{ marginRight: 6 }} />
            Guided Template
          </button>
        </div>

        {/* Distinct Toolbar Action Buttons */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {inputMode === 'template' && (
            <button
              type="button"
              className="btn-secondary"
              onClick={handleClearTemplate}
              style={{ fontSize: '0.8rem', padding: '6px 12px' }}
              title="Clear all template fields"
            >
              <IconTrash width={13} height={13} style={{ marginRight: 4 }} />
              Clear Form
            </button>
          )}

          <button
            type="button"
            className="btn-sample-cv"
            onClick={handleLoadSample}
            title={inputMode === 'template' ? 'Populate template with software engineer sample data' : 'Instantly fill with a comprehensive software engineer sample CV'}
          >
            <IconFile width={14} height={14} style={{ marginRight: 6 }} />
            {inputMode === 'template' ? 'Load Sample Template' : 'Load Sample CV'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* MODE 1: FILE UPLOAD */}
        {inputMode === 'upload' && (
          <div className="upload-drop-container">
            {!selectedFile ? (
              <div
                className={`dropzone ${isDragActive ? 'drag-active' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept=".pdf,.docx,.doc,.txt"
                  onChange={handleFileSelect}
                />
                <div className="dropzone-icon">
                  <IconUpload width={38} height={38} style={{ color: 'var(--text-muted)' }} />
                </div>
                <div className="dropzone-text">Click to browse or drop your CV file here</div>
                <div className="dropzone-hint">Supports PDF (.pdf), Microsoft Word (.docx), and plain text (.txt)</div>
              </div>
            ) : (
              <div className="file-selected-card">
                <div className="file-info-col">
                  <div className="file-type-icon">
                    <IconFile width={24} height={24} />
                  </div>
                  <div className="file-details">
                    <div className="file-name" title={selectedFile.name}>
                      {selectedFile.name}
                    </div>
                    <div className="file-meta">
                      <span className="file-size">{(selectedFile.size / 1024).toFixed(1)} KB</span>
                      <span className="file-ready-tag">
                        <IconCheck width={12} height={12} style={{ marginRight: 4 }} />
                        Ready to evaluate
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-change-file"
                  onClick={() => setSelectedFile(null)}
                  title="Choose a different CV file"
                >
                  <IconRefresh width={14} height={14} style={{ marginRight: 6 }} />
                  <span>Change File</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* MODE 2: RAW TEXT PASTE */}
        {inputMode === 'paste' && (
          <div className="upload-textarea-container">
            <textarea
              className="cv-textarea"
              placeholder="Paste the raw text of the candidate's CV/Resume here..."
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              rows={12}
            />
          </div>
        )}

        {/* MODE 3: GUIDED INTERACTIVE TEMPLATE */}
        {inputMode === 'template' && (
          <div className="cv-template-form-container">
            {/* Template Header Note */}
            <div className="template-tip-banner">
              <IconSparkles width={15} height={15} style={{ color: 'var(--blue)', flexShrink: 0 }} />
              <span>
                Enter your details into this ATS-friendly template. When evaluated, your information is structured to maximize machine readability and scoring accuracy.
              </span>
            </div>

            {/* Section 1: Contact Information */}
            <div className="template-section">
              <div className="template-section-title">1. Personal &amp; Contact Information</div>
              <div className="template-grid-3">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Alex Chen"
                    value={templateData.fullName}
                    onChange={(e) => handleTemplateChange('fullName', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="e.g. alex.chen@email.com"
                    value={templateData.email}
                    onChange={(e) => handleTemplateChange('email', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. +1 (555) 019-2834"
                    value={templateData.phone}
                    onChange={(e) => handleTemplateChange('phone', e.target.value)}
                  />
                </div>
              </div>
              <div className="template-grid-2" style={{ marginTop: 10 }}>
                <div className="form-group">
                  <label className="form-label">LinkedIn Profile URL</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. linkedin.com/in/alexchen-dev"
                    value={templateData.linkedin}
                    onChange={(e) => handleTemplateChange('linkedin', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">GitHub / Portfolio URL</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. github.com/alexchen"
                    value={templateData.github}
                    onChange={(e) => handleTemplateChange('github', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Professional Summary */}
            <div className="template-section">
              <div className="template-section-title">2. Professional Summary</div>
              <textarea
                className="form-input"
                rows={3}
                placeholder="2-3 concise sentences highlighting your years of experience, core tech stack, and strongest achievement..."
                value={templateData.summary}
                onChange={(e) => handleTemplateChange('summary', e.target.value)}
              />
            </div>

            {/* Section 3: Technical Skills */}
            <div className="template-section">
              <div className="template-section-title">3. Technical &amp; Core Skills</div>
              <textarea
                className="form-input"
                rows={2}
                placeholder="Comma-separated skills (e.g. Python, Go, Docker, AWS, PostgreSQL, React, REST APIs, Microservices)..."
                value={templateData.skills}
                onChange={(e) => handleTemplateChange('skills', e.target.value)}
              />
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 4 }}>
                Include programming languages, cloud platforms, databases, and engineering methodologies.
              </div>
            </div>

            {/* Section 4: Work Experience */}
            <div className="template-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div className="template-section-title" style={{ margin: 0 }}>4. Work Experience</div>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleAddExperience}
                  style={{ fontSize: '0.78rem', padding: '5px 10px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                >
                  <IconPlus width={13} height={13} />
                  Add Role
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {templateData.experiences.map((exp, idx) => (
                  <div key={exp.id} className="template-subcard">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                        Role #{idx + 1}
                      </span>
                      {templateData.experiences.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveExperience(exp.id)}
                          style={{ color: 'var(--accent-red)', cursor: 'pointer', padding: '2px 6px', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.76rem' }}
                          title="Remove this role"
                        >
                          <IconTrash width={13} height={13} />
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="template-grid-3">
                      <div className="form-group">
                        <label className="form-label">Job Title</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. Senior Software Engineer"
                          value={exp.title}
                          onChange={(e) => handleExperienceChange(exp.id, 'title', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Company Name</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. NexaTech Systems"
                          value={exp.company}
                          onChange={(e) => handleExperienceChange(exp.id, 'company', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Employment Dates</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. 2022 – Present"
                          value={exp.dates}
                          onChange={(e) => handleExperienceChange(exp.id, 'dates', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="form-group" style={{ marginTop: 10 }}>
                      <label className="form-label">Key Achievements / Bullets (One per line, STAR formula recommended)</label>
                      <textarea
                        className="form-input"
                        rows={3}
                        placeholder="Architected microservices in Go serving 2M users with 99.98% uptime...&#10;Optimized Redis caching, cutting latency by 45%..."
                        value={exp.bullets}
                        onChange={(e) => handleExperienceChange(exp.id, 'bullets', e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 5: Education & Projects */}
            <div className="template-section">
              <div className="template-section-title">5. Education &amp; Projects</div>
              <div className="template-grid-3">
                <div className="form-group">
                  <label className="form-label">Degree</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. B.S. in Computer Science"
                    value={templateData.education.degree}
                    onChange={(e) => handleEducationChange('degree', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">University / Institution</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. UC Berkeley"
                    value={templateData.education.institution}
                    onChange={(e) => handleEducationChange('institution', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Dates Attended</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 2017 – 2021"
                    value={templateData.education.dates}
                    onChange={(e) => handleEducationChange('dates', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: 12 }}>
                <label className="form-label">Projects &amp; Key Initiatives (Optional)</label>
                <textarea
                  className="form-input"
                  rows={2}
                  placeholder="Project title, technologies used, and brief quantifiable result..."
                  value={templateData.projects}
                  onChange={(e) => handleTemplateChange('projects', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* AI API Key field */}
        <div className="api-key-box">
          <div className="api-key-header">
            <span>AI Model API Key (Groq / Gemini / OpenAI)</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              {apiKey && <IconCheck width={11} height={11} />}
              {apiKey ? 'Key Provided' : 'Optional (Enables AI Review)'}
            </span>
          </div>
          <input
            type="password"
            className="api-input"
            placeholder="Enter API Key (e.g. gsk_... for Groq, AIza... for Gemini, sk-... for OpenAI)"
            value={apiKey}
            onChange={(e) => onApiKeyChange(e.target.value)}
          />
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: 4 }}>
            Groq keys (<a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-blue)', textDecoration: 'underline' }}>console.groq.com</a>) automatically run on free Llama 3.3 70B models. Left empty, automated rule-based evaluation still runs.
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', padding: '12px 20px', fontSize: '0.98rem' }}
            disabled={isLoading}
          >
            {isLoading ? (
              <span>Evaluating CV...</span>
            ) : (
              <>
                <IconPlay width={14} height={14} style={{ marginRight: 6 }} />
                <span>{inputMode === 'template' ? 'Evaluate Template CV' : 'Evaluate CV'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
