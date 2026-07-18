"""Application settings."""

from __future__ import annotations

import logging
import secrets
from functools import lru_cache
from pathlib import Path

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger(__name__)

_BACKEND_ROOT = Path(__file__).resolve().parents[2]
_REPO_ROOT = _BACKEND_ROOT.parent
_DEFAULT_ML_MODEL = _BACKEND_ROOT / "ml" / "models" / "mlp_khmer_model_v3.h5"
_DEFAULT_LANDMARKER = _BACKEND_ROOT / "ml" / "models" / "hand_landmarker.task"
_DEFAULT_LABEL_ENCODER = _BACKEND_ROOT / "ml" / "models" / "khmer_label_encoder.pkl"
_DEFAULT_WORD_ML_MODEL = (
    _REPO_ROOT / "data_set" / "word_detection_model_assets" / "best_model_25class_fix.h5"
)
_DEFAULT_WORD_LABEL_MAP = (
    _REPO_ROOT / "data_set" / "word_detection_model_assets" / "label_map_25class.json"
)
_DEFAULT_WORD_CONTRIBUTIONS_DIR = (
    _REPO_ROOT / "data_set" / "word_detection_contributions"
)
_DEFAULT_MEDIA_UPLOAD_DIR = _REPO_ROOT / "data_set" / "media_uploads"


class Settings(BaseSettings):
    app_title: str = "Khmer Sign Language Platform"
    environment: str = Field(default="development", validation_alias="APP_ENV")
    frontend_url: str = "http://localhost:3000"
    allowed_origins: str | list[str] = Field(default="")
    database_url: str = "postgresql://admin:admin@localhost:5432/khmer_sign_db"
    database_timezone: str = "Asia/Phnom_Penh"
    redis_url: str = Field(default="redis://localhost:6379/0", validation_alias="REDIS_URL")
    jwt_secret_key: str = Field(default="")
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = Field(default=7, validation_alias="REFRESH_TOKEN_EXPIRE_DAYS")
    cookie_domain: str | None = Field(default=None, validation_alias="COOKIE_DOMAIN")
    cookie_secure: bool = Field(default=False, validation_alias="COOKIE_SECURE")
    cookie_samesite: str = Field(default="none", validation_alias="COOKIE_SAMESITE")
    csrf_header_value: str = Field(default="KSL-Client", validation_alias="CSRF_HEADER_VALUE")

    ml_enabled: bool = Field(default=True, validation_alias="ML_ENABLED")
    ml_model_path: Path = Field(
        default=_DEFAULT_ML_MODEL,
        validation_alias="ML_MODEL_PATH",
    )
    ml_landmarker_path: Path = Field(
        default=_DEFAULT_LANDMARKER,
        validation_alias="ML_LANDMARKER_PATH",
    )
    ml_label_encoder_path: Path = Field(
        default=_DEFAULT_LABEL_ENCODER,
        validation_alias="ML_LABEL_ENCODER_PATH",
    )
    word_ml_enabled: bool = Field(default=True, validation_alias="WORD_ML_ENABLED")
    word_ml_model_path: Path = Field(
        default=_DEFAULT_WORD_ML_MODEL,
        validation_alias="WORD_ML_MODEL_PATH",
    )
    word_ml_label_map_path: Path = Field(
        default=_DEFAULT_WORD_LABEL_MAP,
        validation_alias="WORD_ML_LABEL_MAP_PATH",
    )
    word_detection_contributions_dir: Path = Field(
        default=_DEFAULT_WORD_CONTRIBUTIONS_DIR,
        validation_alias="WORD_DETECTION_CONTRIBUTIONS_DIR",
    )
    media_upload_dir: Path = Field(
        default=_DEFAULT_MEDIA_UPLOAD_DIR,
        validation_alias="MEDIA_UPLOAD_DIR",
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        populate_by_name=True,
    )

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def parse_allowed_origins(cls, value: object) -> list[str]:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        if isinstance(value, list):
            return value
        return []

    @field_validator(
        "ml_model_path",
        "ml_landmarker_path",
        "ml_label_encoder_path",
        "word_ml_model_path",
        "word_ml_label_map_path",
        "word_detection_contributions_dir",
        "media_upload_dir",
        mode="before",
    )
    @classmethod
    def resolve_ml_paths(cls, value: object) -> Path:
        path = Path(str(value)) if value is not None else Path()
        if not path.is_absolute():
            return (_BACKEND_ROOT / path).resolve()
        return path.resolve()

    def validate_runtime_security(self) -> None:
        """Validate security-critical settings at startup."""
        is_prod = self.environment.lower() in {"production", "prod"}

        if is_prod:
            if len(self.jwt_secret_key) < 32:
                raise RuntimeError(
                    "JWT_SECRET_KEY must be at least 32 characters in production."
                )
            if self.cookie_samesite.lower() == "none" and not self.cookie_secure:
                raise RuntimeError(
                    "COOKIE_SECURE must be True when COOKIE_SAMESITE is 'none'. "
                    "Browsers reject SameSite=None cookies without the Secure flag."
                )
            if not self.allowed_origins:
                raise RuntimeError(
                    "ALLOWED_ORIGINS must be set in production."
                )
        elif not self.jwt_secret_key:
            # Outside production a missing/empty signing key would otherwise be
            # accepted, and HS256 tokens signed with an empty key are trivially
            # forgeable (anyone could mint admin JWTs). Fall back to a random
            # ephemeral key so tokens cannot be forged; it is regenerated on
            # every restart, which is acceptable for non-production use.
            self.jwt_secret_key = secrets.token_urlsafe(48)
            logger.warning(
                "JWT_SECRET_KEY is not set; generated a random ephemeral key. "
                "Set JWT_SECRET_KEY in the environment for stable tokens."
            )


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    settings.validate_runtime_security()
    return settings


settings = get_settings()
