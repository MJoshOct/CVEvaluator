# Deploying to Railway

## Overview

Railway hosts the full app as a single service:
- Django backend (Gunicorn)
- React frontend (served as static files by WhiteNoise)
- PostgreSQL (Railway addon)

## Step-by-Step

### 1. Push code to GitHub
Make sure your repo is pushed to GitHub.

### 2. Create a Railway project
1. Go to railway.app and log in with GitHub
2. Click "New Project" -> "Deploy from GitHub repo"
3. Select your CVEvaluator repo

### 3. Add PostgreSQL
In your Railway project:
1. Click "+ New" -> "Database" -> "Add PostgreSQL"
2. Railway automatically sets DATABASE_URL in your service

### 4. Set environment variables
In Railway -> your service -> Variables tab, add:

| Variable | Value |
|---|---|
| SECRET_KEY | (generate a random 50-char string) |
| DEBUG | False |
| ALLOWED_HOSTS | your-app.up.railway.app |
| CORS_ALLOWED_ORIGINS | https://your-app.up.railway.app |
| CSRF_TRUSTED_ORIGINS | https://your-app.up.railway.app |
| AI_API_KEY | your Groq/OpenAI key |
| AI_PROVIDER | groq |
| AI_MODEL | llama-3.1-8b-instant |
| GUNICORN_WORKERS | 2 |

Railway sets DATABASE_URL automatically from the PostgreSQL addon.

### 5. Configure the build
Railway will use `railway.json` to know what to build and run.

### 6. Set Root Directory
In Railway service settings, set the root directory to: `cv-evaluator`

### 7. Deploy
Push a commit to GitHub. Railway auto-deploys.

### 8. Create the admin superuser
After first deploy, run via Railway CLI or Shell tab:
```
python manage.py createsuperuser
```

### 9. Update Google OAuth (if using)
Add your Railway URL to Google Cloud Console:
- Authorized JavaScript origins: https://your-app.up.railway.app
- Authorized redirect URIs: https://your-app.up.railway.app

## Generating a SECRET_KEY

Run in any Python environment:
```python
import secrets
print(secrets.token_urlsafe(50))
```

## Custom Domain (optional)

In Railway -> your service -> Settings -> Custom Domains, add your domain.
Railway provides free SSL automatically.

## Checking Logs

Railway dashboard -> your service -> Logs tab.
