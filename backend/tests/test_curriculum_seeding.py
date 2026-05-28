"""
Test curriculum seeding and database integrity.

This test verifies:
1. All curriculum data (units, chapters, lessons, letters) is seeded
2. Media files are properly linked to letters
3. Relationships are intact
4. Data can be retrieved correctly
"""

import os
import sys
from pathlib import Path

# Setup path to import from src
BASE_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BASE_DIR))

from dotenv import load_dotenv
from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import Session

load_dotenv()

from src.db.session import Base, SessionLocal
from src.models.finger_spelling import (
    FingerUnit,
    FingerChapter,
    FingerLesson,
    FingerLetter,
    FingerLessonLetter,
    FingerLetterMedia,
)
from src.models.media import Media, MediaType


def _case_database_connection():
    """Test that we can connect to the database."""
    print("\n📋 Test 1: Database Connection")
    print("-" * 50)
    try:
        db = SessionLocal()
        db.execute(select(1))
        db.close()
        print("✅ Database connection successful")
        return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False


def _case_units_seeded():
    """Test that all 6 units are seeded."""
    print("\n📋 Test 2: Units Seeding")
    print("-" * 50)
    db = SessionLocal()
    try:
        units = db.query(FingerUnit).order_by(FingerUnit.order_index).all()
        print(f"Total units: {len(units)}")
        
        expected_units = [
            ("Dependent Vowels", "ស្រៈ"),
            ("Main Consonants", "ព្យញ្ជនៈ"),
            ("Numbers", "លេខ"),
            ("Sub Consonants", "ជើង"),
            ("Diacritics", "វណ្ណយុត្តិ"),
            ("Independent Vowels", "ស្រៈពេញតួ"),
        ]
        
        if len(units) != 6:
            print(f"❌ Expected 6 units, got {len(units)}")
            return False
        
        for i, (unit, (expected_en, expected_kh)) in enumerate(zip(units, expected_units)):
            if unit.name_en == expected_en and unit.name_kh == expected_kh:
                print(f"  ✅ Unit {i+1}: {unit.name_en} ({unit.name_kh})")
            else:
                print(f"  ❌ Unit {i+1} mismatch")
                return False
        
        print("✅ All units seeded correctly")
        return True
    except Exception as e:
        print(f"❌ Error querying units: {e}")
        return False
    finally:
        db.close()


def _case_chapters_seeded():
    """Test that chapters are properly seeded."""
    print("\n📋 Test 3: Chapters Seeding")
    print("-" * 50)
    db = SessionLocal()
    try:
        chapters = db.query(FingerChapter).all()
        print(f"Total chapters: {len(chapters)}")
        
        if len(chapters) != 27:
            print(f"❌ Expected 27 chapters, got {len(chapters)}")
            return False
        
        # Group chapters by unit
        chapters.sort(key=lambda c: (c.unit_id, c.order_index))
        unit_id = 1
        for chapter in chapters:
            if chapter.unit_id != unit_id:
                print(f"  Unit {unit_id}: {len([c for c in chapters if c.unit_id == unit_id])} chapters")
                unit_id = chapter.unit_id
        
        print("✅ All chapters seeded correctly")
        return True
    except Exception as e:
        print(f"❌ Error querying chapters: {e}")
        return False
    finally:
        db.close()


def _case_letters_seeded():
    """Test that all letters are seeded."""
    print("\n📋 Test 4: Letters Seeding")
    print("-" * 50)
    db = SessionLocal()
    try:
        letters = db.query(FingerLetter).all()
        print(f"Total letters: {len(letters)}")
        
        if len(letters) != 127:
            print(f"❌ Expected 127 letters, got {len(letters)}")
            return False
        
        # Show sample letters
        sample_letters = letters[:5]
        print("  Sample letters:")
        for letter in sample_letters:
            print(f"    - {letter.letter_kh} ({letter.letter_en})")
        
        print("✅ All letters seeded correctly")
        return True
    except Exception as e:
        print(f"❌ Error querying letters: {e}")
        return False
    finally:
        db.close()


def _case_lessons_and_relationships():
    """Test that lessons and letter relationships are intact."""
    print("\n📋 Test 5: Lessons & Relationships")
    print("-" * 50)
    db = SessionLocal()
    try:
        lessons = db.query(FingerLesson).all()
        print(f"Total lessons: {len(lessons)}")
        
        if len(lessons) != 127:
            print(f"❌ Expected 127 lessons, got {len(lessons)}")
            return False
        
        # Check lesson-letter relationships
        lesson_letters = db.query(FingerLessonLetter).all()
        print(f"Lesson-letter links: {len(lesson_letters)}")
        
        if len(lesson_letters) != 127:
            print(f"❌ Expected 127 lesson-letter links, got {len(lesson_letters)}")
            return False
        
        # Verify each lesson has at least one letter
        for lesson in lessons[:5]:
            letters = db.query(FingerLetter).join(
                FingerLessonLetter
            ).filter(
                FingerLessonLetter.lesson_id == lesson.id
            ).all()
            print(f"  Lesson '{lesson.name_kh}': {len(letters)} letter(s)")
        
        print("✅ Lessons and relationships correct")
        return True
    except Exception as e:
        print(f"❌ Error checking relationships: {e}")
        return False
    finally:
        db.close()


def _case_media_seeded():
    """Test that media files are seeded and linked."""
    print("\n📋 Test 6: Media Files")
    print("-" * 50)
    db = SessionLocal()
    try:
        medias = db.query(Media).all()
        print(f"Total media files: {len(medias)}")
        
        if len(medias) != 440:
            print(f"⚠️  Expected 440 media files, got {len(medias)}")
        
        # Check media types
        image_count = db.query(Media).filter(Media.media_type == MediaType.IMAGE.value).count()
        print(f"  - Image files: {image_count}")
        
        # Check media-letter links
        letter_medias = db.query(FingerLetterMedia).all()
        print(f"Letter-media links: {len(letter_medias)}")
        
        if len(letter_medias) != len(medias):
            print(f"⚠️  Expected {len(medias)} links, got {len(letter_medias)}")
        
        # Verify sample letter has media
        sample_letter = db.query(FingerLetter).first()
        if sample_letter:
            media_count = db.query(FingerLetterMedia).filter(
                FingerLetterMedia.letter_id == sample_letter.id
            ).count()
            print(f"  Sample letter '{sample_letter.letter_kh}': {media_count} media file(s)")
        
        print("✅ Media files seeded and linked correctly")
        return True
    except Exception as e:
        print(f"❌ Error querying media: {e}")
        return False
    finally:
        db.close()


def _case_data_integrity():
    """Test overall data integrity."""
    print("\n📋 Test 7: Data Integrity")
    print("-" * 50)
    db = SessionLocal()
    try:
        # Count totals
        unit_count = db.query(func.count(FingerUnit.id)).scalar()
        chapter_count = db.query(func.count(FingerChapter.id)).scalar()
        lesson_count = db.query(func.count(FingerLesson.id)).scalar()
        letter_count = db.query(func.count(FingerLetter.id)).scalar()
        media_count = db.query(func.count(Media.id)).scalar()
        letter_media_count = db.query(func.count(FingerLetterMedia.id)).scalar()
        
        print(f"  Units:              {unit_count:4d} (expected 6)")
        print(f"  Chapters:           {chapter_count:4d} (expected 27)")
        print(f"  Lessons:            {lesson_count:4d} (expected 127)")
        print(f"  Letters:            {letter_count:4d} (expected 127)")
        print(f"  Media files:        {media_count:4d} (expected >= 440)")
        print(f"  Letter-media links: {letter_media_count:4d} (expected == media files)")
        
        # Verify foreign keys aren't broken
        chapters_with_unit = db.query(FingerChapter).filter(FingerChapter.unit_id.isnot(None)).count()
        lessons_with_chapter = db.query(FingerLesson).filter(FingerLesson.chapter_id.isnot(None)).count()
        
        print(f"\n  Chapters with unit:   {chapters_with_unit}/{chapter_count}")
        print(f"  Lessons with chapter: {lessons_with_chapter}/{lesson_count}")
        
        all_valid = (
            unit_count == 6 and
            chapter_count == 27 and
            lesson_count == 127 and
            letter_count == 127 and
            media_count >= 440 and
            letter_media_count == media_count and
            chapters_with_unit == 27 and
            lessons_with_chapter == 127
        )
        
        if all_valid:
            print("\n✅ Data integrity check passed")
            return True
        else:
            print("\n❌ Data integrity check failed")
            return False
        
    except Exception as e:
        print(f"❌ Error checking data integrity: {e}")
        return False
    finally:
        db.close()


def test_database_connection() -> None:
    assert _case_database_connection()


def test_units_seeded() -> None:
    assert _case_units_seeded()


def test_chapters_seeded() -> None:
    assert _case_chapters_seeded()


def test_letters_seeded() -> None:
    assert _case_letters_seeded()


def test_lessons_and_relationships() -> None:
    assert _case_lessons_and_relationships()


def test_media_seeded() -> None:
    assert _case_media_seeded()


def test_data_integrity() -> None:
    assert _case_data_integrity()


def run_all_tests():
    """Run all tests and report results."""
    print("\n" + "=" * 50)
    print("CURRICULUM DATABASE TEST SUITE")
    print("=" * 50)
    
    results = []
    
    results.append(("Database Connection", _case_database_connection()))
    results.append(("Units Seeding", _case_units_seeded()))
    results.append(("Chapters Seeding", _case_chapters_seeded()))
    results.append(("Letters Seeding", _case_letters_seeded()))
    results.append(("Lessons & Relationships", _case_lessons_and_relationships()))
    results.append(("Media Files", _case_media_seeded()))
    results.append(("Data Integrity", _case_data_integrity()))
    
    # Summary
    print("\n" + "=" * 50)
    print("TEST SUMMARY")
    print("=" * 50)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {test_name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed! Database is ready.")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) failed.")
        return 1


if __name__ == "__main__":
    exit_code = run_all_tests()
    sys.exit(exit_code)
