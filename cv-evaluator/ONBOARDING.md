# 🚀 CV Evaluator — Developer Onboarding Guide

Welcome to the **CV Evaluator** project! This guide gets any new team member running the app locally in under 10 minutes, and explains how the system works so you can contribute immediately.

---

## 📌 What This Project Does

A 3-stage AI-powered CV/Resume evaluation system:

```
User uploads CV (PDF / DOCX / TXT / paste)
         │
         ▼
┌─────────────────────────────────────────┐
│  Stage 1: Legitimacy Check              │
│  Verifies it's actually a real CV       │
│  (contact info, sections, word count)   │
└──────────────────┬──────────────────────┘
                   │ passes ✅
                   ▼
┌─────────────────────────────────────────┐
│  Stage 2: Role Dataset Matching         │
│  Scores CV against 4 curated rubrics:   │
│  • Software Development                 │
│  • AI Engineer                          │
│  • Data Analyst                         │
│  • Web Development                      │
└──────────────────┬──────────────────────┘
                   │ if API key provided
                   ▼
┌─────────────────────────────────────────┐
│  Stage 3: AI Deep Review                │
│  Groq / Gemini / OpenAI critique,       │
│  bullet rewrites & improvement roadmap  │
└─────────────────────────────────────────┘
```

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite, Nginx (Alpine) |
| **Backend** | Python 3.11, FastAPI, SQLAlchemy |
| **Database** | PostgreSQL 16 |
| **Container** | Docker (Compose for dev, Swarm for prod) |
| **AI Providers** | Groq (free), Google Gemini, OpenAI |

---

## ⚡ Quickstart — Running Locally (5 minutes)

### Prerequisites

You only need **one thing** installed: **Docker Desktop**

> No Python, Node.js, or PostgreSQL needed locally — Docker handles everything.

Install Docker Desktop:
```powershell
# Windows (PowerShell):
winget install Docker.DockerDesktop
```
Or download from [docker.com](https://www.docker.com/products/docker-desktop/).

After installing:
1. Launch **Docker Desktop** and wait for **"Engine running"** (green dot in taskbar)
2. If on **Windows with WSL** → go to Docker Desktop → Settings → Resources → **WSL Integration** → toggle your Ubuntu distro **ON** → Apply & Restart

---

### Step 1 — Get the code

```bash
git clone <repo-url>
cd cv-evaluator
```

### Step 2 — Set up environment

```bash
# Linux / macOS / WSL:
cp .env.example .env

# Windows PowerShell:
Copy-Item .env.example .env
```

Open `.env` and optionally add a Groq API key (free at [console.groq.com/keys](https://console.groq.com/keys)):
```env
AI_API_KEY=gsk_your_key_here
```

> The app works without an API key — Stage 1 & 2 always run. Stage 3 (AI review) requires a key.

### Step 3 — Start the app

```bash
docker compose up --build
```

### Step 4 — Open in browser

| Service | URL |
|---------|-----|
| 🌐 Web UI | http://localhost:3000 |
| 🔧 API Docs | http://localhost:8000/docs |
| ❤️ Health | http://localhost:8000/health |

### Step 5 — Stop the app

```bash
docker compose down
```

---

## 🔑 API Keys — How They Work

The app supports three AI providers, auto-detected by key prefix:

| Provider | Key prefix | Free tier? | How to get |
|----------|-----------|-----------|-----------|
| **Groq** ⭐ recommended | `gsk_...` | ✅ Yes, fast | [console.groq.com/keys](https://console.groq.com/keys) |
| **Google Gemini** | `AIza...` | ✅ Yes | [aistudio.google.com](https://aistudio.google.com) |
| **OpenAI** | `sk-...` | ❌ Paid | [platform.openai.com](https://platform.openai.com) |

**Two ways to provide a key:**

**A) In the UI** (easiest — per session, no restart needed)
- Click **"Set AI Key"** in the top-right header, or paste into the field in the evaluation form.

**B) In `.env`** (sets a default for all users)
```env
AI_API_KEY=gsk_your_groq_key_here
AI_PROVIDER=groq
AI_MODEL=llama-3.1-8b-instant
```

### Active Groq Models (as of Nov 2026)
The backend **auto-discovers** available models on your key at runtime. Fallback order:
1. `llama-3.1-8b-instant` — fastest, free tier, always available
2. `llama-3.3-70b-versatile` — best quality on free tier
3. `llama3-8b-8192` — stable fallback
4. `llama3-70b-8192` — larger stable fallback
5. `gemma2-9b-it` — Google Gemma 2 via Groq

---

## 📁 Project Structure

```
cv-evaluator/
├── backend/
│   ├── app/
│   │   ├── data/
│   │   │   └── roles_criteria.json     ← add new roles here
│   │   ├── routers/
│   │   │   ├── evaluate.py             ← API endpoints
│   │   │   └── health.py
│   │   ├── services/
│   │   │   ├── ai_evaluator.py         ← Groq/Gemini/OpenAI calls
│   │   │   ├── legitimacy_checker.py   ← Stage 1 logic
│   │   │   ├── role_dataset.py         ← Stage 2 matching logic
│   │   │   └── parser.py               ← PDF/DOCX text extraction
│   │   ├── config.py                   ← env var settings
│   │   ├── database.py                 ← SQLAlchemy setup
│   │   ├── main.py                     ← FastAPI app entry point
│   │   └── models.py / schemas.py
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/                 ← React UI components
│   │   ├── App.jsx                     ← main app logic & state
│   │   └── index.css                   ← all styles
│   ├── nginx.conf                      ← reverse proxy config
│   └── Dockerfile
│
├── docker-compose.yml                  ← local dev (single instance)
├── docker-stack.yml                    ← Docker Swarm (multi-replica)
├── deploy-swarm.sh                     ← one-click Swarm deploy (Linux/WSL)
├── .env.example                        ← copy this to .env
└── ONBOARDING.md                       ← this file
```

---

## 🛠️ Common Dev Tasks

### Rebuild after code changes
```bash
docker compose up --build
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
Edit `backend/app/data/roles_criteria.json` — add a new entry:
```json
{
  "id": "devops_engineer",
  "title": "DevOps Engineer",
  "description": "...",
  "core_skills": ["Linux", "Kubernetes", "Terraform", "CI/CD"],
  "frameworks_and_tools": ["Docker", "Helm", "Prometheus", "Grafana"],
  "concepts_and_methodologies": ["IaC", "GitOps", "SRE", "Monitoring"],
  "experience_signals": ["deployed", "automated", "reduced downtime", "scaled"]
}
```
No code changes needed — the backend and frontend load roles dynamically.

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
  -d '{"cv_text": "Your CV text here...", "role_id": "software_development"}'
```

---

## 🔄 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health + DB connectivity check |
| `GET` | `/api/roles` | List all available role rubrics |
| `POST` | `/api/evaluate/upload` | Evaluate uploaded PDF/DOCX/TXT file |
| `POST` | `/api/evaluate/text` | Evaluate pasted CV text |
| `GET` | `/api/history` | Fetch past evaluations from DB |
| `GET` | `/api/history/{id}` | Fetch one evaluation by ID |

Full interactive docs at [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 🐳 Docker Swarm (Production-Style Local Deploy)

> Use this to test the production setup locally, or to deploy to a real server.

### On Windows via WSL (Ubuntu)

```bash
# 1. Open WSL Ubuntu terminal

# 2. Fix Docker permissions (first time only)
sudo usermod -aG docker $USER
newgrp docker

# 3. Navigate to project
cd /mnt/c/Users/<YourUsername>/path/to/cv-evaluator

# 4. Make script executable (first time only)
chmod +x deploy-swarm.sh

# 5. (Optional) Set API key
export AI_API_KEY="gsk_your_key_here"

# 6. Deploy
./deploy-swarm.sh
```

### Verify Swarm is healthy

```bash
docker stack services cv-stack
# Should show:
# cv-stack_db         1/1
# cv-stack_backend    2/2
# cv-stack_frontend   2/2
```

### Swarm management commands

```bash
docker stack services cv-stack              # replica status
docker service logs cv-stack_backend        # backend logs
docker service logs cv-stack_frontend       # frontend logs
docker service scale cv-stack_backend=3     # scale up
docker stack rm cv-stack                    # tear down
```

---

## 🚨 Troubleshooting

| Problem | Fix |
|---------|-----|
| `docker: command not found` in WSL | Enable WSL Integration in Docker Desktop → Settings → Resources → WSL Integration → toggle Ubuntu ON |
| `permission denied /var/run/docker.sock` | Run `sudo usermod -aG docker $USER && newgrp docker` |
| `Port 8000/3000 already allocated` | Run `docker stack rm cv-stack` or `docker compose down`, wait 5s, retry |
| Backend keeps restarting | DB not ready yet — normal on first start, the backend retries automatically (up to 10 times) |
| AI evaluation returns error | Check your API key prefix: `gsk_` = Groq, `AIza` = Gemini, `sk-` = OpenAI |
| Groq model not found error | The backend auto-discovers models — try a different key or check [console.groq.com](https://console.groq.com) for your plan's active models |
| Frontend shows blank page | Run `docker compose logs frontend` — usually a failed nginx start. Check `nginx.conf` syntax |

---

## 👥 Contributing

1. **Fork / branch** off `main`
2. Make changes locally with `docker compose up --build`
3. Test your changes — check all 3 stages work (legitimacy → role match → AI review)
4. Submit a PR with a clear description of what changed and why

---

*Keep this file updated as the project evolves — it's the single source of truth for new contributors.*
