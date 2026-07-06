from __future__ import annotations

from io import BytesIO

import pytest

from src.core.config import settings
from src.models.word_detection import (
    WordDetectionChapter,
    WordDetectionContribution,
    WordDetectionLesson,
    WordDetectionLessonWord,
    WordDetectionUnit,
    WordDetectionWord,
)
from tests.helpers import safe_order_index, unique_suffix


@pytest.fixture(autouse=True)
def _contribution_storage_tmpdir(tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "word_detection_contributions_dir", tmp_path)


def _create_word_lesson(db):
    suffix = unique_suffix()
    order = safe_order_index(suffix)

    unit = WordDetectionUnit(
        name_en=f"Upload Unit {suffix}",
        name_kh=f"ឯកតា {suffix}",
        order_index=order,
    )
    db.add(unit)
    db.flush()

    chapter = WordDetectionChapter(
        unit_id=unit.id,
        name_en=f"Upload Chapter {suffix}",
        name_kh=f"ជំពូក {suffix}",
        order_index=1,
    )
    db.add(chapter)
    db.flush()

    lesson = WordDetectionLesson(
        chapter_id=chapter.id,
        name_en=f"Upload Lesson {suffix}",
        name_kh=f"មេរៀន {suffix}",
        order_index=1,
    )
    word = WordDetectionWord(
        word_en=f"Upload Word {suffix}",
        word_kh=f"ពាក្យ{suffix}",
    )
    db.add_all([lesson, word])
    db.flush()

    db.add(
        WordDetectionLessonWord(
            lesson_id=lesson.id,
            word_id=word.id,
            order_index=1,
        )
    )
    db.flush()
    return lesson, word


def _video_file():
    return {"video": ("sample.webm", BytesIO(b"fake-webm-data"), "video/webm")}


def test_upload_word_contribution_allows_guest(client, db):
    lesson, word = _create_word_lesson(db)

    response = client.post(
        "/api/word_detection/contributions",
        data={
            "lesson_id": str(lesson.id),
            "word": word.word_kh,
            "predicted_label": word.word_kh,
            "confidence": "92",
        },
        files=_video_file(),
        headers={"X-KSL-Guest-Id": "guest_test"},
    )

    assert response.status_code == 200, response.text
    data = response.json()
    assert data["status"] == "pending"
    assert data["file_url"].endswith(".webm")

    contribution = db.query(WordDetectionContribution).filter_by(id=data["id"]).one()
    assert contribution.user_id is None
    assert contribution.guest_id == "guest_test"
    assert contribution.word_id == word.id
    assert contribution.word_detection_lesson_id == lesson.id


def test_upload_word_contribution_requires_user_or_guest(client, db):
    lesson, word = _create_word_lesson(db)

    response = client.post(
        "/api/word_detection/contributions",
        data={"lesson_id": str(lesson.id), "word": word.word_kh},
        files=_video_file(),
    )

    assert response.status_code == 401


def test_upload_word_contribution_rejects_non_video(client, db):
    lesson, word = _create_word_lesson(db)

    response = client.post(
        "/api/word_detection/contributions",
        data={"lesson_id": str(lesson.id), "word": word.word_kh},
        files={"video": ("sample.txt", BytesIO(b"not video"), "text/plain")},
        headers={"X-KSL-Guest-Id": "guest_test"},
    )

    assert response.status_code == 415


def test_upload_word_contribution_returns_404_for_unknown_word(client):
    response = client.post(
        "/api/word_detection/contributions",
        data={"word": "missing"},
        files=_video_file(),
        headers={"X-KSL-Guest-Id": "guest_test"},
    )

    assert response.status_code == 404
