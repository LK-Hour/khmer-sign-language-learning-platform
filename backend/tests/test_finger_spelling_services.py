"""
Verify finger spelling repositories, services, and API routes.

Run from backend directory:
    python tests/test_finger_spelling_services.py
"""

from __future__ import annotations

import sys
import uuid
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BASE_DIR))

from dotenv import load_dotenv

load_dotenv(BASE_DIR / ".env")

from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import select  # noqa: E402

from src.db.session import SessionLocal  # noqa: E402
from src.main import app  # noqa: E402
from src.models.finger_spelling import FingerLetter  # noqa: E402
from src.models.user import User  # noqa: E402
from src.repositories.finger_curriculum_repository import FingerCurriculumRepository  # noqa: E402
from src.repositories.finger_exercise_repository import FingerExerciseRepository  # noqa: E402
from src.repositories.finger_practice_repository import FingerPracticeRepository  # noqa: E402
from src.repositories.finger_progress_repository import FingerProgressRepository  # noqa: E402
from src.services.finger_spelling.finger_curriculum_service import FingerCurriculumService  # noqa: E402
from src.services.finger_spelling.finger_exercise_service import FingerExerciseService  # noqa: E402
from src.services.finger_spelling.finger_practice_service import FingerPracticeService  # noqa: E402
from src.services.finger_spelling.finger_progress_service import FingerProgressService  # noqa: E402
from src.utils.jwt_utils import create_access_token  # noqa: E402


def _get_test_user(db) -> User | None:
    return db.query(User).filter(User.is_active.is_(True)).first()


def _configure_stdio() -> None:
    for stream in (sys.stdout, sys.stderr):
        reconfigure = getattr(stream, "reconfigure", None)
        if callable(reconfigure):
            try:
                reconfigure(encoding="utf-8", errors="replace")
            except (OSError, ValueError, AttributeError):
                pass


def test_letter_data_service() -> bool:
    print("\nTest: Letter data service (ka / U+1780)")
    print("-" * 50)
    db = SessionLocal()
    try:
        service = FingerCurriculumService(db)
        bundle = service.get_letter_data_by_kh("ក")
        if bundle is None:
            print("FAIL: letter ក not found — run seed_curriculum.py")
            return False

        if bundle.letter.letter_en != "ka":
            print(f"FAIL: expected letter_en 'ka', got {bundle.letter.letter_en!r}")
            return False
        if len(bundle.medias) < 1:
            print(f"FAIL: expected at least 1 media, got {len(bundle.medias)}")
            return False
        if not bundle.lesson_paths:
            print("FAIL: expected at least one lesson path")
            return False

        print(f"  letter: {bundle.letter.letter_kh} ({bundle.letter.letter_en})")
        print(f"  medias: {len(bundle.medias)}")
        print(f"  lesson paths: {len(bundle.lesson_paths)}")
        print("PASS")
        return True
    except Exception as exc:
        print(f"FAIL: {exc}")
        return False
    finally:
        db.close()


def test_letter_belongs_to_lesson() -> bool:
    print("\nTest: letter_belongs_to_lesson validation")
    print("-" * 50)
    db = SessionLocal()
    try:
        repo = FingerCurriculumRepository(db)
        letter = repo.get_letter_by_kh("ក")
        if letter is None:
            print("FAIL: letter ក not found")
            return False

        paths = repo.list_lesson_paths_for_letter(letter.id)
        if not paths:
            print("FAIL: no lesson paths for ក")
            return False

        lesson, _chapter, _unit = paths[0]
        if not repo.letter_belongs_to_lesson(lesson.id, letter.id):
            print("FAIL: expected letter to belong to its lesson")
            return False

        other = db.scalars(
            select(FingerLetter).where(FingerLetter.letter_kh != "ក").limit(1)
        ).first()
        if other and repo.letter_belongs_to_lesson(lesson.id, other.id):
            print("FAIL: foreign letter should not belong to lesson")
            return False

        print("PASS")
        return True
    except Exception as exc:
        print(f"FAIL: {exc}")
        return False
    finally:
        db.close()


def test_practice_upsert_and_foreign_letter() -> bool:
    print("\nTest: practice upsert + reject foreign letter")
    print("-" * 50)
    db = SessionLocal()
    try:
        user = _get_test_user(db)
        if user is None:
            print("SKIP: no users in database (seed users first)")
            return True

        curriculum = FingerCurriculumRepository(db)
        letter = curriculum.get_letter_by_kh("ក")
        if letter is None:
            print("FAIL: letter ក not found")
            return False

        paths = curriculum.list_lesson_paths_for_letter(letter.id)
        lesson = paths[0][0]
        practice_svc = FingerPracticeService(db)
        session = practice_svc.start_session(user_id=user.id, lesson_id=lesson.id)
        if session is None:
            print("FAIL: could not start practice session")
            return False

        ok = practice_svc.submit_letter(
            user_id=user.id,
            session_id=session.id,
            letter_id=letter.id,
            accuracy=85.0,
        )
        if ok is None:
            print("FAIL: valid letter submit rejected")
            return False

        again = practice_svc.submit_letter(
            user_id=user.id,
            session_id=session.id,
            letter_id=letter.id,
            accuracy=90.0,
        )
        if again is None:
            print("FAIL: upsert submit failed")
            return False

        practice_repo = FingerPracticeRepository(db)
        row = practice_repo.get_session_letter(session.id, letter.id)
        if row is None:
            print("FAIL: session letter row missing after upsert")
            return False
        if float(row.accuracy) != 90.0:
            print(f"FAIL: expected accuracy 90.0 after upsert, got {row.accuracy}")
            return False

        foreign = db.scalars(
            select(FingerLetter).where(FingerLetter.id != letter.id).limit(1)
        ).first()
        if foreign:
            rejected = practice_svc.submit_letter(
                user_id=user.id,
                session_id=session.id,
                letter_id=foreign.id,
                accuracy=99.0,
            )
            if rejected is not None:
                print("FAIL: foreign letter should be rejected")
                return False

        practice_svc.end_session(user_id=user.id, session_id=session.id)
        print("PASS")
        return True
    except Exception as exc:
        db.rollback()
        print(f"FAIL: {exc}")
        return False
    finally:
        db.close()


def test_lesson_locking() -> bool:
    print("\nTest: lesson locking by order")
    print("-" * 50)
    db = SessionLocal()
    try:
        repo = FingerCurriculumRepository(db)
        progress = FingerProgressService(db)
        chapter = repo.list_chapters_by_unit(2)[0] if repo.list_units() else None
        if chapter is None:
            print("SKIP: no chapters")
            return True

        lessons = repo.list_lessons_by_chapter(chapter.id)
        if len(lessons) < 2:
            print("SKIP: chapter has fewer than 2 lessons")
            return True

        first, second = lessons[0], lessons[1]
        guest_locked = progress.is_lesson_locked_by_id(None, second.id)
        if not guest_locked:
            print("FAIL: second lesson should be locked for guest")
            return False

        print("PASS")
        return True
    except Exception as exc:
        print(f"FAIL: {exc}")
        return False
    finally:
        db.close()


def test_curriculum_repository_hierarchy() -> bool:
    print("\nTest: FingerCurriculumRepository hierarchy + counts")
    print("-" * 50)
    db = SessionLocal()
    try:
        repo = FingerCurriculumRepository(db)
        units = repo.list_units()
        if len(units) != 6:
            print(f"FAIL: expected 6 units, got {len(units)}")
            return False

        unit = units[0]
        chapters = repo.list_chapters_by_unit(unit.id)
        if not chapters:
            print("FAIL: unit has no chapters")
            return False

        chapter = chapters[0]
        lessons = repo.list_lessons_by_chapter(chapter.id)
        if not lessons:
            print("FAIL: chapter has no lessons")
            return False

        lesson = lessons[0]
        linked = repo.list_letters_for_lesson(lesson.id)
        if not linked:
            print("FAIL: lesson has no letters")
            return False

        lesson_h = repo.get_lesson_in_hierarchy(unit.id, chapter.id, lesson.id)
        if lesson_h is None:
            print("FAIL: get_lesson_in_hierarchy returned None")
            return False

        n_ch = repo.count_chapters(unit.id)
        n_lessons = repo.count_lessons(chapter.id)
        if n_ch < 1 or n_lessons < 1:
            print("FAIL: count methods returned zero")
            return False

        print(f"  unit={unit.name_en}, chapters={n_ch}, lessons={n_lessons}, letters={len(linked)}")
        print("PASS")
        return True
    except Exception as exc:
        print(f"FAIL: {exc}")
        return False
    finally:
        db.close()


def test_progress_repository() -> bool:
    print("\nTest: FingerProgressRepository get_or_create + completed counts")
    print("-" * 50)
    db = SessionLocal()
    try:
        user = _get_test_user(db)
        if user is None:
            print("SKIP: no users")
            return True

        curriculum = FingerCurriculumRepository(db)
        progress_repo = FingerProgressRepository(db)
        lesson = curriculum.list_lessons_by_chapter(
            curriculum.list_chapters_by_unit(curriculum.list_units()[0].id)[0].id
        )[0]

        row = progress_repo.get_or_create_lesson_progress(user.id, lesson.id)
        if row.user_id != user.id or row.finger_lesson_id != lesson.id:
            print("FAIL: progress row mismatch")
            return False

        again = progress_repo.get_or_create_lesson_progress(user.id, lesson.id)
        if again.id != row.id:
            print("FAIL: get_or_create should return same row")
            return False

        lesson_ids = curriculum.list_lesson_ids_for_chapter(lesson.chapter_id)
        completed = progress_repo.count_completed_lessons(user.id, lesson_ids)
        if completed < 0:
            print("FAIL: negative completed count")
            return False

        print(f"  progress_id={row.id}, completed_in_chapter={completed}")
        print("PASS")
        return True
    except Exception as exc:
        db.rollback()
        print(f"FAIL: {exc}")
        return False
    finally:
        db.close()


def test_exercise_repository_and_service() -> bool:
    print("\nTest: FingerExerciseRepository + FingerExerciseService")
    print("-" * 50)
    db = SessionLocal()
    try:
        ex_repo = FingerExerciseRepository(db)
        curriculum = FingerCurriculumRepository(db)
        lesson = curriculum.get_lesson_by_id(1)
        if lesson is None:
            lesson = curriculum.list_lessons_by_chapter(
                curriculum.list_chapters_by_unit(curriculum.list_units()[0].id)[0].id
            )[0]

        exercises = ex_repo.list_with_options_by_lesson(lesson.id)
        if not exercises:
            print("  SKIP: no exercises seeded for lesson (repository OK, empty data)")
            return True

        ex = ex_repo.get_with_options(exercises[0].id)
        if ex is None or not ex.options:
            print("FAIL: get_with_options missing data")
            return False

        user = _get_test_user(db)
        if user is None:
            print("SKIP: no users for submit test")
            return True

        svc = FingerExerciseService(db)
        listed = svc.list_lesson_exercises(lesson.id)
        if listed is None or len(listed) != len(exercises):
            print("FAIL: list_lesson_exercises mismatch")
            return False

        print(f"  lesson_id={lesson.id}, exercises={len(exercises)}")
        print("PASS")
        return True
    except Exception as exc:
        print(f"FAIL: {exc}")
        return False
    finally:
        db.close()


def test_practice_end_sets_is_completed() -> bool:
    print("\nTest: end_session sets is_completed (ERD column)")
    print("-" * 50)
    db = SessionLocal()
    try:
        user = _get_test_user(db)
        if user is None:
            print("SKIP: no users")
            return True

        curriculum = FingerCurriculumRepository(db)
        letter = curriculum.get_letter_by_kh("ក")
        if letter is None:
            print("FAIL: letter not found")
            return False

        lesson = curriculum.list_lesson_paths_for_letter(letter.id)[0][0]
        svc = FingerPracticeService(db)
        session = svc.start_session(user_id=user.id, lesson_id=lesson.id)
        if session is None:
            print("FAIL: could not start session")
            return False

        if session.is_completed:
            print("FAIL: new session should not be completed")
            return False

        svc.submit_letter(
            user_id=user.id,
            session_id=session.id,
            letter_id=letter.id,
            accuracy=88.0,
        )
        result = svc.end_session(user_id=user.id, session_id=session.id)
        if result is None:
            print("FAIL: end_session failed")
            return False
        if not result.session.is_completed:
            print("FAIL: is_completed should be True after end_session")
            return False
        if result.peak_accuracy is None or result.peak_accuracy < 80:
            print("FAIL: expected peak_accuracy >= 80 for pass")
            return False

        progress = FingerProgressService(db).get_lesson_progress(user.id, lesson.id)
        if progress is None or not progress.is_completed:
            print("FAIL: lesson progress should be completed after passing practice")
            return False

        print(f"  session.is_completed={result.session.is_completed}, peak={result.peak_accuracy}")
        print("PASS")
        return True
    except Exception as exc:
        db.rollback()
        print(f"FAIL: {exc}")
        return False
    finally:
        db.close()


def test_api_finger_spelling_with_auth() -> bool:
    print("\nTest: finger_spelling API (units + auth on practice)")
    print("-" * 50)
    client = TestClient(app)
    try:
        units = client.get("/api/finger_spelling/units")
        if units.status_code != 200 or len(units.json()) < 1:
            print(f"FAIL: units {units.status_code}")
            return False

        unit_id = units.json()[0]["id"]
        chapters = client.get(f"/api/finger_spelling/units/{unit_id}/chapters")
        if chapters.status_code != 200:
            print(f"FAIL: chapters {chapters.status_code}")
            return False

        ch_id = chapters.json()[0]["id"]
        lessons = client.get(f"/api/finger_spelling/chapters/{ch_id}/lessons")
        if lessons.status_code != 200 or not lessons.json():
            print("FAIL: lessons empty or error")
            return False

        lesson_id = lessons.json()[0]["id"]
        detail = client.get(f"/api/finger_spelling/lessons/{lesson_id}")
        if detail.status_code != 200:
            print(f"FAIL: lesson detail {detail.status_code}")
            return False

        unauth = client.post(f"/api/finger_spelling/lessons/{lesson_id}/practice/sessions", json={})
        if unauth.status_code != 401:
            print(f"FAIL: expected 401 without token, got {unauth.status_code}")
            return False

        with SessionLocal() as db:
            user = db.query(User).filter(User.is_active.is_(True)).first()
        if user:
            token = create_access_token(data={"sub": str(user.id)})
            auth = client.post(
                f"/api/finger_spelling/lessons/{lesson_id}/practice/sessions",
                json={},
                headers={"Authorization": f"Bearer {token}"},
            )
            if auth.status_code != 200:
                print(f"FAIL: start session with token {auth.status_code} {auth.text}")
                return False

        print("PASS")
        return True
    except Exception as exc:
        print(f"FAIL: {exc}")
        return False


def test_api_curriculum_letter() -> bool:
    print("\nTest: GET /api/curriculum/letters/{ka}")
    print("-" * 50)
    client = TestClient(app)
    try:
        response = client.get("/api/curriculum/letters/%E1%9E%80")
        if response.status_code != 200:
            print(f"FAIL: status {response.status_code} — {response.text}")
            return False

        data = response.json()
        if data["letter"]["letter_kh"] != "ក":
            print("FAIL: wrong letter in response")
            return False
        if data["medias_count"] != len(data["letter"]["medias"]):
            print("FAIL: medias_count does not match medias array length")
            return False

        medias_resp = client.get("/api/curriculum/letters/%E1%9E%80/medias")
        if medias_resp.status_code != 200:
            print(f"FAIL: medias endpoint status {medias_resp.status_code}")
            return False
        medias_body = medias_resp.json()
        if medias_body["total_medias"] != len(medias_body["medias"]):
            print("FAIL: medias endpoint count mismatch")
            return False

        units_resp = client.get("/api/finger_spelling/units")
        if units_resp.status_code != 200:
            print(f"FAIL: units endpoint status {units_resp.status_code}")
            return False
        if not units_resp.json():
            print("FAIL: units list empty")
            return False

        print("PASS")
        return True
    except Exception as exc:
        print(f"FAIL: {exc}")
        return False


def run_all() -> int:
    _configure_stdio()
    print("=" * 50)
    print("FINGER SPELLING SERVICE TEST SUITE")
    print("=" * 50)

    results = [
        ("Curriculum repository", test_curriculum_repository_hierarchy()),
        ("Progress repository", test_progress_repository()),
        ("Letter data service", test_letter_data_service()),
        ("Letter belongs to lesson", test_letter_belongs_to_lesson()),
        ("Exercise repository/service", test_exercise_repository_and_service()),
        ("Practice upsert + validation", test_practice_upsert_and_foreign_letter()),
        ("Practice end is_completed", test_practice_end_sets_is_completed()),
        ("Lesson locking", test_lesson_locking()),
        ("API curriculum letter", test_api_curriculum_letter()),
        ("API finger_spelling + auth", test_api_finger_spelling_with_auth()),
    ]

    print("\n" + "=" * 50)
    print("SUMMARY")
    print("=" * 50)
    passed = sum(1 for _, ok in results if ok)
    for name, ok in results:
        print(f"{'PASS' if ok else 'FAIL'}: {name}")
    print(f"\n{passed}/{len(results)} passed")
    return 0 if passed == len(results) else 1


if __name__ == "__main__":
    sys.exit(run_all())
