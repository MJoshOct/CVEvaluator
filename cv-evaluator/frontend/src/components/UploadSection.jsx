import React, { useState, useRef } from 'react';

const SAMPLE_CVS = {
  software_development: `Alex Chen
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

Associate Software Developer | CloudBase Labs (2021 – 2022)
- Built RESTful APIs using Java Spring Boot and PostgreSQL for enterprise client onboarding.
- Authored unit and integration test suites using JUnit and PyTest, raising test coverage from 60% to 88%.

EDUCATION
B.S. in Computer Science | University of California, Berkeley (2017 – 2021)
- Relevant Coursework: Data Structures & Algorithms, Operating Systems, Database Systems`,

  ai_engineer: `Maya Patel
maya.patel@email.com | +1 (555) 432-8765 | github.com/mayapatel-ai | linkedin.com/in/mayapatel

SUMMARY
AI & Machine Learning Engineer specializing in Deep Learning, Large Language Models (LLMs), RAG systems, and production model serving.

CORE COMPETENCIES
- Core: Python, PyTorch, TensorFlow, Scikit-Learn, NumPy, Pandas
- LLM & GenAI: Hugging Face, Transformers, LangChain, LlamaIndex, ChromaDB, Vector Search, LoRA Fine-Tuning
- MLOps & Tools: Docker, FastAPI, vLLM, MLflow, CUDA, Git

WORK EXPERIENCE
AI Engineer | Synapse Intelligence (2023 – Present)
- Engineered enterprise RAG pipeline using LangChain, ChromaDB, and fine-tuned Llama-3 models to parse 500k+ documents with 92% retrieval precision.
- Fine-tuned transformer models using LoRA/QLoRA on proprietary domain datasets, reducing model hallucination by 34%.
- Containerized model serving using FastAPI, vLLM, and Docker on NVIDIA GPU instances with sub-120ms token latency.

Machine Learning Researcher | Apex Robotics (2021 – 2023)
- Implemented deep learning computer vision architectures in PyTorch for defect detection with 96.5% F1-score.
- Conducted exploratory data analysis and feature engineering on 10TB+ sensor datasets using Pandas and NumPy.

EDUCATION
M.S. in Artificial Intelligence | Carnegie Mellon University (2021)
B.S. in Computer Science | University of Michigan (2019)`,

  data_analyst: `Jordan Lee
jordan.lee@email.com | +1 (555) 789-0123 | linkedin.com/in/jordanlee-analytics

PROFESSIONAL PROFILE
Analytical Data Analyst with 4 years of experience translating complex business data into interactive dashboards, KPI metrics, and strategic executive insights.

TECHNICAL SKILLS
- Query & Scripting: SQL (PostgreSQL, BigQuery, Snowflake), Python (Pandas, NumPy), Excel (VLOOKUP, Pivot Tables)
- Business Intelligence: Tableau, Power BI, Looker, Metabase, Matplotlib, Seaborn
- Methodologies: A/B Testing, Exploratory Data Analysis (EDA), Data Cleaning, Cohort Analysis, ETL Pipelines

PROFESSIONAL EXPERIENCE
Senior Data Analyst | RetailMetric Corp (2022 – Present)
- Designed executive Tableau dashboards tracking \$45M in omnichannel retail revenue and customer churn metrics.
- Executed rigorous A/B testing frameworks and hypothesis testing for checkout redesign, elevating checkout conversion rate by 6.2%.
- Optimized BigQuery SQL queries and automated ETL data cleansing scripts, reducing reporting refresh time by 65%.

Business Data Analyst | Vantage Global (2020 – 2022)
- Collaborated with marketing stakeholders to analyze retention funnels and customer lifetime value across 300,000 accounts.
- Built automated reporting models in Power BI and Excel, eliminating 12 hours of weekly manual reporting.

EDUCATION
B.S. in Statistics & Data Science | University of Washington (2020)`,

  web_development: `Samira Khan
samira.khan@email.com | +1 (555) 321-9876 | github.com/samirak-web | linkedin.com/in/samirakhan

SUMMARY
Full-Stack Web Developer with 3+ years of experience crafting responsive web applications, modern React frontends, and robust Node.js/Express APIs.

TECHNICAL SKILLS
- Frontend: JavaScript (ES6+), TypeScript, React, Next.js, HTML5, CSS3, Tailwind CSS, Redux
- Backend: Node.js, Express, RESTful APIs, GraphQL, WebSockets, JWT Authentication
- Databases & Tools: PostgreSQL, MongoDB, Git, Vite, Webpack, Responsive Design

EXPERIENCE
Full-Stack Developer | PixelCraft Studio (2022 – Present)
- Engineered responsive SaaS web applications in React, TypeScript, and Tailwind CSS serving 150k monthly active users.
- Built scalable Node.js/Express REST APIs with JWT authentication and PostgreSQL, ensuring secure session management.
- Improved Core Web Vitals and Lighthouse performance score from 68 to 96 by implementing code splitting and image optimization.

Frontend Developer | WebForge Digital (2021 – 2022)
- Built interactive client-side interfaces and responsive layouts ensuring cross-browser compatibility and accessibility.
- Integrated third-party payment gateways (Stripe) and webhooks with backend microservices.

EDUCATION
B.S. in Information Technology | Purdue University (2021)`
};

export default function UploadSection({
  roles,
  selectedRole,
  onSelectRole,
  apiKey,
  onApiKeyChange,
  onEvaluate,
  isLoading
}) {
  const [inputMode, setInputMode] = useState('upload'); // 'upload' or 'paste'
  const [selectedFile, setSelectedFile] = useState(null);
  const [pastedText, setPastedText] = useState('');
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
    setInputMode('paste');
    setPastedText(SAMPLE_CVS[selectedRole] || SAMPLE_CVS.software_development);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputMode === 'upload' && !selectedFile) {
      alert('Please choose or drop a CV file first.');
      return;
    }
    if (inputMode === 'paste' && !pastedText.trim()) {
      alert('Please paste the CV text to evaluate.');
      return;
    }

    onEvaluate({
      mode: inputMode,
      file: selectedFile,
      text: pastedText,
      candidateName: candidateName.trim(),
      role: selectedRole,
      apiKey: apiKey.trim()
    });
  };

  return (
    <div className="card">
      <div className="card-title">
        <span>Target Job Role</span>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>4 Predefined Roles</span>
      </div>

      {/* Role Selector Grid */}
      <div className="roles-grid">
        {roles.map((role) => (
          <button
            key={role.id}
            type="button"
            className={`role-pill ${selectedRole === role.id ? 'active' : ''}`}
            onClick={() => onSelectRole(role.id)}
          >
            <span className="role-name">{role.title}</span>
          </button>
        ))}
      </div>

      {/* Selected Role Description - only shown when chosen */}
      {(() => {
        const activeRole = roles.find((r) => r.id === selectedRole);
        if (!activeRole || !activeRole.description) return null;
        return (
          <div className="chosen-role-box">
            <div className="chosen-role-header">
              <span className="chosen-role-badge">Active Focus</span>
              <span className="chosen-role-title">{activeRole.title}</span>
            </div>
            <p className="chosen-role-desc">{activeRole.description}</p>
          </div>
        );
      })()}

      {/* Input Mode Selector */}
      <div className="tabs">
        <button
          type="button"
          className={`tab-btn ${inputMode === 'upload' ? 'active' : ''}`}
          onClick={() => setInputMode('upload')}
        >
          📁 Upload File (PDF / Word / TXT)
        </button>
        <button
          type="button"
          className={`tab-btn ${inputMode === 'paste' ? 'active' : ''}`}
          onClick={() => setInputMode('paste')}
        >
          ✏️ Paste CV Text
        </button>
        <button
          type="button"
          className="tab-btn"
          style={{ marginLeft: 'auto', color: 'var(--accent-blue)' }}
          onClick={handleLoadSample}
          title="Fill sample resume for selected role"
        >
          ⚡ Load Sample CV
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {inputMode === 'upload' ? (
          <div>
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
                <div className="dropzone-icon">📄</div>
                <div className="dropzone-text">Click to browse or drop your CV file here</div>
                <div className="dropzone-hint">Supports PDF (.pdf), Microsoft Word (.docx), and plain text (.txt)</div>
              </div>
            ) : (
              <div className="file-selected-card">
                <div className="file-info-col">
                  <div className="file-type-icon">📄</div>
                  <div className="file-details">
                    <div className="file-name" title={selectedFile.name}>
                      {selectedFile.name}
                    </div>
                    <div className="file-meta">
                      <span className="file-size">{(selectedFile.size / 1024).toFixed(1)} KB</span>
                      <span className="file-ready-tag">✓ Ready to evaluate</span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-change-file"
                  onClick={() => setSelectedFile(null)}
                  title="Choose a different CV file"
                >
                  <span>🔄</span>
                  <span>Change File</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div>
            <textarea
              className="cv-textarea"
              placeholder="Paste the raw text of the candidate's CV/Resume here..."
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
            />
          </div>
        )}

        {/* AI API Key field for seamless input */}
        <div className="api-key-box">
          <div className="api-key-header">
            <span>AI Model API Key (Groq Free / Gemini / OpenAI)</span>
            <span>{apiKey ? '✓ Key Provided' : 'Optional (Enables AI Review)'}</span>
          </div>
          <input
            type="password"
            className="api-input"
            placeholder="Enter API Key (e.g. gsk_... for Groq, AIza... for Gemini, sk-... for OpenAI)"
            value={apiKey}
            onChange={(e) => onApiKeyChange(e.target.value)}
          />
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: 4 }}>
            ⚡ Groq keys (<a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-blue)', textDecoration: 'underline' }}>console.groq.com</a>) automatically run on free Llama 3.3 70B models. Left empty, rule-based check still runs.
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%' }}
            disabled={isLoading}
          >
            {isLoading ? 'Evaluating CV...' : '🚀 Evaluate CV'}
          </button>
        </div>
      </form>
    </div>
  );
}
