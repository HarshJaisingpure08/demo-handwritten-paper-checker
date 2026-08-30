from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    openai_api_key: Optional[str] = None
    gemini_api_key: Optional[str] = None
    frontend_url: str = "http://localhost:3000"
    max_file_size_mb: int = 20
    debug: bool = False

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


def get_settings() -> Settings:
    from pathlib import Path
    env_path = Path(__file__).resolve().parent / ".env"
    if env_path.exists():
        return Settings(_env_file=str(env_path))
    return Settings()


settings = get_settings()

