"""Application settings."""

from __future__ import annotations

from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_title: str = "Khmer Sign Language Platform"
    environment: str = Field(default="development", validation_alias="APP_ENV")
    frontend_url: str = "http://localhost:3000"
    allowed_origins: list[str] = Field(
        default_factory=lambda: [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:8000",
            "https://delicious-folk-recount.ngrok-free.dev",
            "https://khmersignlanguage.share.zrok.io",
        ]
    )
    database_url: str = "postgresql://admin:admin@localhost:5432/khmer_sign_db"
    database_timezone: str = "Asia/Phnom_Penh"
    jwt_secret_key: str = "dev-only-insecure-change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        populate_by_name=True,
    )

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def parse_allowed_origins(cls, value: object) -> object:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    def validate_runtime_security(self) -> None:
        if self.environment.lower() in {"production", "prod"} and (
            not self.jwt_secret_key
            or self.jwt_secret_key == "dev-only-insecure-change-me"
        ):
            raise RuntimeError("JWT_SECRET_KEY must be configured in production")


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    settings.validate_runtime_security()
    return settings


settings = get_settings()
