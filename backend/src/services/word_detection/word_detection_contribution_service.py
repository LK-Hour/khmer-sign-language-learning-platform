from __future__ import annotations

import re
from pathlib import Path
from uuid import UUID, uuid4

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from src.core.config import settings
from src.models.contribution_media import ContributionMedia
from src.models.media import MediaType
from src.models.word_detection import WordDetectionContribution, WordDetectionLesson, WordDetectionWord

_SAFE_PART_RE = re.compile(r"[^a-zA-Z0-9._\-\u1780-\u17ff]+")
MAX_UPLOAD_BYTES = 10 * 1024 * 1024


def _safe_path_part(value: str) -> str:
    cleaned = _SAFE_PART_RE.sub("_", value.strip()).strip("._")
    return cleaned or "unknown"


def _extension_for_upload(upload: UploadFile) -> str:
    suffix = Path(upload.filename or "").suffix.lower()
    if suffix in {".webm", ".mp4", ".mov", ".m4v"}:
        return suffix
    content_type = (upload.content_type or "").lower()
    if "mp4" in content_type:
        return ".mp4"
    if "quicktime" in content_type:
        return ".mov"
    return ".webm"


class WordDetectionContributionService:
    def __init__(self, db: Session):
        self.db = db

    def get_word_by_label(self, label: str) -> WordDetectionWord | None:
        return (
            self.db.query(WordDetectionWord)
            .filter(WordDetectionWord.word_kh == label)
            .one_or_none()
        )

    def get_lesson(self, lesson_id: int | None) -> WordDetectionLesson | None:
        if lesson_id is None:
            return None
        return self.db.get(WordDetectionLesson, lesson_id)

    def save_upload(
        self,
        *,
        upload: UploadFile,
        word: WordDetectionWord,
        lesson: WordDetectionLesson | None,
        user_id: UUID | None,
        guest_id: str | None,
    ) -> WordDetectionContribution:
        root = settings.word_detection_contributions_dir
        target_dir = root / _safe_path_part(word.word_kh)
        target_dir.mkdir(parents=True, exist_ok=True)

        ext = _extension_for_upload(upload)
        filename = f"{_safe_path_part(word.word_kh)}-contribution-{uuid4().hex[:8]}{ext}"
        file_path = target_dir / filename
        relative_url = f"/data_set/word_detection_contributions/{_safe_path_part(word.word_kh)}/{filename}"

        try:
            written = 0
            with file_path.open("wb") as out_file:
                while chunk := upload.file.read(1024 * 1024):
                    written += len(chunk)
                    if written > MAX_UPLOAD_BYTES:
                        raise HTTPException(
                            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                            detail="Video file is too large",
                        )
                    out_file.write(chunk)

            contribution_media = ContributionMedia(media_type=MediaType.VIDEO.value, file_url=relative_url)
            self.db.add(contribution_media)
            self.db.flush()

            contribution = WordDetectionContribution(
                user_id=user_id,
                guest_id=guest_id,
                word_id=word.id,
                word_detection_lesson_id=lesson.id if lesson else None,
                filename=filename,
                contribution_media_id=contribution_media.id,
                status="pending",
                consent_version="deferred-v1",
                consent_given=False,
            )
            self.db.add(contribution)
            self.db.commit()
            self.db.refresh(contribution)
            return contribution
        except Exception:
            self.db.rollback()
            if file_path.exists():
                file_path.unlink()
            raise
