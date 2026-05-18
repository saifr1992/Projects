from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DATABASE_URL: str = "sqlite:///./exam_helper.db"
    JWT_SECRET: str = "change-me"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 1440

    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"
    OPENAI_MAX_TOKENS: int = 1024
    AI_DAILY_LIMIT_PER_USER: int = 50

    ADMIN_EMAIL: str = "admin@examhelper.com"
    ADMIN_PASSWORD: str = "Admin@12345"
    ADMIN_NAME: str = "Administrator"

    FRONTEND_ORIGIN: str = "http://localhost:5173"

    UPLOAD_DIR: str = "uploads"


settings = Settings()
