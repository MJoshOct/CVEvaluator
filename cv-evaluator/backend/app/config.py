import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://cveval_user:cveval_pass@db:5432/cveval_db")
    AI_API_KEY: str = os.getenv("AI_API_KEY", "")
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "groq") # "groq", "gemini", or "openai"
    AI_MODEL: str = os.getenv("AI_MODEL", "llama-3.1-8b-instant") # e.g. "llama-3.1-8b-instant" (universally available on Groq)
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "*")

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
