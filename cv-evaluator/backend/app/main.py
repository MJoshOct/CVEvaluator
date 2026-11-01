import time
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
from app.routers import health, evaluate

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)

# Attempt table creation with retries for container startup
def init_db():
    max_retries = 10
    retry_interval = 2
    for attempt in range(1, max_retries + 1):
        try:
            logger.info(f"Connecting to database (attempt {attempt}/{max_retries})...")
            Base.metadata.create_all(bind=engine)
            logger.info("Database schema verified and tables created.")
            return
        except Exception as e:
            logger.warning(f"Database not ready yet ({e}). Waiting {retry_interval}s...")
            time.sleep(retry_interval)
    logger.error("Could not initialize database tables after multiple retries.")

init_db()

app = FastAPI(
    title="CV Evaluator API",
    description="Automated CV evaluation system with rule-based dataset checks and AI model analysis.",
    version="1.0.0"
)

# CORS configuration
origins = [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()]
if "*" in origins or not origins:
    origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(evaluate.router)

@app.get("/")
def root():
    return {
        "message": "CV Evaluator API is running",
        "docs_url": "/docs",
        "health_check": "/health"
    }
