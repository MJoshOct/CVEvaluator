# CV Evaluator

An enterprise-grade AI-powered CV and Resume Evaluation System designed to analyze candidate resumes against industry job roles, calculate ATS compatibility, identify skill gaps, and provide actionable AI feedback.

---

## Features Overview

The platform features 4 distinct operation modes:

1. **Resume Evaluator**
   - **Stage 1a: Legitimacy Check** - Verifies minimum length, contact information, structural sections, and valid experience signals.
   - **Stage 1b: ATS Score Calculation** - Generates an ATS grade, checks formatting compliance, and provides optimization tips.
   - **Stage 1c: Resume Parsing** - Extracts candidate details, categorized technical skills, and experience history.
   - **Stage 2a: Predefined Role Matching** - Matches skills against comprehensive industry criteria rubrics.
   - **Stage 2b: Keyword Gap Analysis** - Identifies matched and missing high-impact industry keywords.
   - **Stage 2c: Career Alignment** - Evaluates career trajectory and progression fit.
   - **Stage 3: AI Deep Review** - LLM-driven qualitative review providing strengths, weaknesses, and portfolio project suggestions.

2. **JD Matcher (Job Description Compatibility)**
   - Upload a CV and paste a target job description to get a percentage compatibility score, requirement-by-requirement comparison, and interview preparation advice.

3. **Career Advisor**
   - Automatically benchmarks a CV across 9 tech roles (Software Development, Frontend, Backend, Full Stack, Data Science, DevOps, Mobile, QA, and Cybersecurity) to show strongest career fit.

4. **AI Career Tools**
   - **STAR Bullet Generator:** Rewrites weak, passive resume bullets into quantifiable STAR-format impact statements.
   - **Interview Prep Bank:** Generates targeted technical, project-based, and behavioral interview questions tailored to the candidate's CV and chosen role.

---

## Security & Multi-API Key Management

The system includes an Administrator Management Console with enterprise security:

- **Multi-API Key Pool:** Admins can configure multiple API keys for Groq (Free Tier), Google Gemini, or OpenAI. The evaluator automatically rotates between healthy keys if rate limits (HTTP 429) occur.
- **Dynamic Google OAuth 2.0:** Google Client ID and Client Secret can be configured dynamically through the Admin UI.
- **Encrypted at Rest:** All keys and secrets are encrypted in PostgreSQL using symmetric cryptography (HMAC-SHA256 authenticated cipher derived from the server secret key).
- **Key Masking:** Secrets are never exposed in plaintext in the UI or over public APIs (e.g. gsk_••••••••••••3aB9).
- **Smart Re-Authentication:**
  - **Password Accounts:** Admins who logged in with a password must re-enter their administrator password before adding, deleting, or editing system keys.
  - **Google OAuth Accounts:** Admins authenticated via Google Sign-In have their active session token validated automatically without a password prompt.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Modern UI Components |
| Backend | Python 3.11, Django 4.2, Django REST Framework |
| Database | PostgreSQL 16 |
| Containerization | Docker Compose (Dev) & Docker Swarm (Prod) |
| AI Providers | Groq (Llama 3.3 / 3.1), Google Gemini (1.5 Flash), OpenAI |
| WSGI Server | Gunicorn |

---

## Quickstart (Running with Docker)

### 1. Prerequisites
Install Docker Desktop and ensure Docker engine is running.

### 2. Configure Environment
`ash
cd cv-evaluator
# Copy example environment file
cp .env.example .env
`
*(Optionally add an initial AI key or configure Google OAuth credentials in .env, or configure them later directly via the Admin Dashboard).*

### 3. Start the Application
`ash
docker compose up --build
`

### 4. Access the Application
- Web UI: http://localhost:3000
- Backend API & Health: http://localhost:8000/health
- Django Admin: http://localhost:3000/admin/

---

## Developer Onboarding & API Docs
For full setup instructions, local development commands, and complete API endpoint documentation, refer to the [Developer Onboarding Guide](cv-evaluator/ONBOARDING.md).
