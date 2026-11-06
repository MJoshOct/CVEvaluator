# 🚀 CV Evaluator — Developer Onboarding Guide

Welcome to the **CV Evaluator** project! This guide gets any new team member running the app locally in under 10 minutes.

---

## 📌 What This Project Does

A **9-feature AI-powered CV/Resume evaluation system** with 4 app modes:

```
📋 Resume Evaluator        🎯 JD Matcher
━━━━━━━━━━━━━━━━━━━         ━━━━━━━━━━━━━━━━━━━
Stage 1a: Legitimacy Check  Upload CV + paste Job Description
Stage 1b: ATS Score         → Compatibility % + skill-by-skill
Stage 1c: Resume Parsing       comparison + AI recommendations
Stage 2a: Role Matching
Stage 2b: Keyword Analysis
Stage 2c: Career Alignment  🧭 Career Advisor
Stage 3:  AI Deep Review    ━━━━━━━━━━━━━━━━━━━
                            Upload CV → see which of 9 roles
🛠️ AI Tools                  you're best aligned to (auto-scored)
━━━━━━━━━━━━━━━━━━━
Bullet Generator            Interview Prep
  Weak bullets → STAR          CV + role → Q&A bank
  format rewrites              (Technical + Project + HR)
```

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite, Nginx (Alpine) |
| **Backend** | Python 3.11, **Django 4.2**, **Django REST Framework** |
| **Database** | PostgreSQL 16 |
| **Container** | Docker (Compose for dev, Swarm for prod) |
| **AI Providers** | Groq (free), Google Gemini, OpenAI |
| **Server** | Gunicorn (WSGI) |

---

## ⚡ Quickstart — Running Locally (5 minutes)

### Prerequisites

You only need **Docker Desktop** installed.

```powershell
# Windows (PowerShell):
winget install Docker.DockerDesktop
```

After installing, launch Docker Desktop and wait for the green "Engine running" dot.

---

### Step 1 — Get the code

```bash
git clone <repo-url>
cd cv-evaluator
```

### Step 2 — Set up environment

```powershell
# Windows PowerShell:
Copy-Item .env.example .env
```

Open `.env` and optionally add a Groq API key (free at [console.groq.com/keys](https://console.groq.com/keys)):
```env
AI_API_KEY=gsk_your_key_here
```

> The app works without an API key — Stages 1 & 2 (ATS score, resume parsing, role matching, keyword analysis, career alignment) always run. Stage 3 AI features require a key.

### Step 3 — Start the app

```bash
docker compose up --build
```

### Step 4 — Open in browser

| Service | URL |
|---------|-----|
| 🌐 Web UI | http://localhost:3000 |
| 🔧 Django Admin | http://localhost:3000/admin/ |
| ❤️ Health | http://localhost:8000/health |

> **Django Admin credentials**: Create a superuser after first run:
> ```bash
> docker compose exec backend python manage.py createsuperuser
> ```

### Step 5 — Stop the app

```bash
docker compose down
```

---

## 🔑 API Keys — How They Work

| Provider | Key prefix | Free tier? | How to get |
|----------|-----------|-----------|-----------| 
| **Groq** ⭐ recommended | `gsk_...` | ✅ Yes, fast | [console.groq.com/keys](https://console.groq.com/keys) |
| **Google Gemini** | `AIza...` | ✅ Yes | [aistudio.google.com](https://aistudio.google.com) |
| **OpenAI** | `sk-...` | ❌ Paid | [platform.openai.com](https://platform.openai.com) |

**Two ways to provide a key:**

**A) In the UI** (easiest — per session, no restart needed)
- Click **"Set AI Key"** in the top-right header

**B) In `.env`** (sets a default for all users)
```env
AI_API_KEY=gsk_your_groq_key_here
AI_PROVIDER=groq
AI_MODEL=llama-3.1-8b-instant
```

---

## 📁 Project Structure

```
cv-evaluator/
├── backend/
│   ├── cveval/                     ← Django project
│   │   ├── settings.py             ← config (env-based)
│   │   ├── urls.py                 ← root URL routing
│   │   └── wsgi.py
│   ├── evaluation/                 ← Django app
│   │   ├── models.py               ← EvaluationRecord DB model
│   │   ├── serializers.py          ← DRF serializers (request/response shapes)
│   │   ├── views.py                ← API endpoint handlers
│   │   ├── urls.py                 ← URL patterns for /api/* and /health
│   │   ├── admin.py                ← Django admin registration
│   │   └── services/
│   │       ├── ai_evaluator.py     ← Groq/Gemini/OpenAI calls (5 prompt types)
│   │       ├── ats_scorer.py       ← ATS compatibility scoring (rule-based)
│   │       ├── career_recommender.py ← Runs all 9 roles, returns ranked list
│   │       ├── keyword_analyzer.py ← Keyword gap analysis (rule-based)
│   │       ├── legitimacy_checker.py ← Stage 1 CV validation
│   │       ├── parser.py           ← PDF/DOCX text extraction
│   │       ├── resume_parser.py    ← Structured data extraction (name, email, etc.)
│   │       └── role_dataset.py     ← Keyword matching against role rubrics
│   ├── data/
│   │   └── roles_criteria.json     ← 9 role rubrics (add new roles here)
│   ├── manage.py
│   ├── entrypoint.sh               ← runs migrations then starts gunicorn
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ATSReport.jsx           ← ATS score + formatting issues
│   │   │   ├── AiFeedbackReport.jsx    ← AI critique & improvement roadmap
│   │   │   ├── ApiKeyModal.jsx         ← API key configuration modal
│   │   │   ├── BulletGeneratorPanel.jsx ← AI Tools: bullet rewriter
│   │   │   ├── CareerRecommendation.jsx ← Role alignment (shown on every eval)
│   │   │   ├── Header.jsx
│   │   │   ├── HistoryModal.jsx
│   │   │   ├── InterviewPrepPanel.jsx  ← AI Tools: interview Q&A generator
│   │   │   ├── JDMatchPanel.jsx        ← JD Matcher mode
│   │   │   ├── KeywordAnalysisReport.jsx ← Keyword gap analysis display
│   │   │   ├── LegitimacyReport.jsx
│   │   │   ├── ResumeParseReport.jsx   ← Structured resume data display
│   │   │   ├── RoleScorecard.jsx
│   │   │   └── UploadSection.jsx
│   │   ├── App.jsx                 ← mode-based routing (4 modes)
│   │   └── index.css
│   ├── nginx.conf
│   └── Dockerfile
│
├── docker-compose.yml              ← local dev
├── docker-stack.yml                ← Docker Swarm (production)
├── .env.example                    ← copy to .env
└── ONBOARDING.md                   ← this file
```

---

## 🔄 API Endpoints

| Method | Endpoint | Description | AI Key? |
|--------|----------|-------------|---------|
| `GET` | `/health` | Health + DB connectivity check | No |
| `GET` | `/api/roles` | List all 9 role rubrics | No |
| `POST` | `/api/evaluate/upload` | Full pipeline: file upload | Optional |
| `POST` | `/api/evaluate/text` | Full pipeline: pasted CV text | Optional |
| `GET` | `/api/history` | Last 20 evaluations from DB | No |
| `GET` | `/api/history/{id}` | Single evaluation by ID | No |
| `POST` | `/api/jd-match/text` | CV text + job description → match report | Required |
| `POST` | `/api/jd-match/upload` | CV file + job description → match report | Required |
| `POST` | `/api/bullet-rewrite` | Weak bullets → STAR format rewrites | Required |
| `POST` | `/api/interview-prep` | CV + role → interview Q&A bank | Required |

Full pipeline (`/api/evaluate/*`) returns:
```json
{
  "legitimacy":            { "is_legitimate": true, "score": 85, ... },
  "ats_report":            { "ats_score": 78, "ats_grade": "Good", ... },
  "parsed_resume":         { "name": "Alex", "email": "...", "skills": [...], ... },
  "keyword_analysis":      { "keyword_score": 72, "missing_keywords": [...], ... },
  "career_recommendations": [ { "role_title": "...", "score": 85, "fit_level": "Strong Fit", ... } ],
  "predefined_evaluation": { "total_score": 76, "core_skills_matched": [...], ... },
  "ai_evaluation":         { "ai_score": 82, "summary": "...", "strengths": [...], ... }
}
```

---

## 🛠️ Common Dev Tasks

### Rebuild after code changes
```bash
docker compose up --build
```

### Run Django management commands
```bash
# Create a superuser for admin panel
docker compose exec backend python manage.py createsuperuser

# Make migrations after model changes
docker compose exec backend python manage.py makemigrations

# Apply migrations
docker compose exec backend python manage.py migrate

# Open Django shell
docker compose exec backend python manage.py shell
```

### View live logs
```bash
docker compose logs -f backend     # backend only
docker compose logs -f frontend    # frontend only
docker compose logs -f             # all services
```

### Reset the database (wipe all history)
```bash
docker compose down -v
docker compose up --build
```

### Add a new job role
Edit `backend/data/roles_criteria.json` — add a new entry:
```json
{
  "id": "your_role_id",
  "title": "Your Role Title",
  "description": "...",
  "core_skills": ["Skill1", "Skill2"],
  "frameworks_and_tools": ["Tool1", "Tool2"],
  "concepts_and_methodologies": ["Concept1"],
  "bonus_skills": ["Bonus1"],
  "experience_signals": ["deployed", "automated"]
}
```
No code changes needed — the backend loads roles dynamically and the Career Advisor auto-includes new roles.

### Hit the API directly
```bash
# Health check
curl http://localhost:8000/health

# Get all roles
curl http://localhost:8000/api/roles

# Evaluate pasted CV text
curl -X POST http://localhost:8000/api/evaluate/text \
  -H "Content-Type: application/json" \
  -H "X-AI-API-Key: gsk_your_key" \
  -d '{"cv_text": "Your CV text here...", "target_role": "software_development"}'

# JD Match
curl -X POST http://localhost:8000/api/jd-match/text \
  -H "Content-Type: application/json" \
  -d '{"cv_text": "...", "job_description": "...", "api_key": "gsk_..."}'

# Bullet rewrite
curl -X POST http://localhost:8000/api/bullet-rewrite \
  -H "Content-Type: application/json" \
  -d '{"bullets": ["Worked on a website", "Helped with backend"], "role": "web_development", "api_key": "gsk_..."}'
```

---

## 🐳 Docker Swarm (Production-Style Deploy)

### On Windows via WSL (Ubuntu)

```bash
# 1. Open WSL Ubuntu terminal
# 2. Fix Docker permissions (first time only)
sudo usermod -aG docker $USER && newgrp docker

# 3. Navigate to project
cd /mnt/c/Users/<YourUsername>/path/to/cv-evaluator

# 4. Make script executable (first time only)
chmod +x deploy-swarm.sh

# 5. (Optional) Set API key
export AI_API_KEY="gsk_your_key_here"

# 6. Deploy
./deploy-swarm.sh
```

---

## 🚨 Troubleshooting

| Problem | Fix |
|---------|-----|
| `docker: command not found` in WSL | Enable WSL Integration in Docker Desktop → Settings → Resources → WSL Integration |
| `permission denied /var/run/docker.sock` | Run `sudo usermod -aG docker $USER && newgrp docker` |
| `Port 8000/3000 already allocated` | Run `docker compose down`, wait 5s, retry |
| Backend keeps restarting | DB not ready yet — normal on first start, entrypoint.sh retries migrations |
| AI evaluation returns error | Check your API key prefix: `gsk_` = Groq, `AIza` = Gemini, `sk-` = OpenAI |
| Django admin shows 500 error | Run `docker compose exec backend python manage.py createsuperuser` first |
| Frontend shows blank page | Run `docker compose logs frontend` — check nginx startup |
| `ImproperlyConfigured: DATABASE_URL` | Ensure `.env` file exists and has valid Postgres credentials |

---

## 👥 Contributing

1. **Fork / branch** off `main`
2. Make changes locally with `docker compose up --build`
3. Test all 4 modes (Evaluator → JD Matcher → Career Advisor → AI Tools)
4. Run `docker compose exec backend python manage.py test` for backend tests
5. Submit a PR with a clear description of what changed and why

---

*Keep this file updated as the project evolves — it's the single source of truth for new contributors.*
