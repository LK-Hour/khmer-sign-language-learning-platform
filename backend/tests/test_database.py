"""
Database connection and model tests
"""
import pytest
from sqlalchemy import text
from sqlalchemy import inspect
from src.models.user import User
from src.models.finger_spelling import FingerUnit, FingerChapter, FingerLesson

class TestDatabase:
    """Test database connectivity and model operations"""
    
    def test_database_connection(self, db):
        """Test database connection"""
        # Simple query to test connection
        result = db.execute(text("SELECT 1"))
        assert result.fetchone()[0] == 1
    
    def test_user_model_operations(self, db):
        """Test User model CRUD operations"""
        # Create user
        user_data = {
            "username": "db_test_user",
            "email": "db_test_user@example.com",
            "password_hash": "hashed_password",
            "display_name": "Test User",
            "account_type": "student",
            "is_active": True
        }
        
        user = User(**user_data)
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Verify user was created
        assert user.id is not None
        assert user.email == "db_test_user@example.com"
        assert user.display_name == "Test User"
        assert user.account_type == "student"
        assert user.is_active is True
        
        # Read user
        retrieved_user = db.query(User).filter(User.email == "db_test_user@example.com").first()
        assert retrieved_user is not None
        assert retrieved_user.id == user.id
        
        # Update user
        retrieved_user.display_name = "Updated User"
        db.commit()
        db.refresh(retrieved_user)
        assert retrieved_user.display_name == "Updated User"
        
        # Soft delete user
        retrieved_user.is_active = False
        db.commit()
        db.refresh(retrieved_user)
        assert retrieved_user.is_active is False
        
        # Verify user is soft deleted (still exists but inactive)
        deleted_user = db.query(User).filter(User.email == "db_test_user@example.com").first()
        assert deleted_user is not None
        assert deleted_user.is_active is False
    
    def test_finger_spelling_model_operations(self, db):
        """Test finger spelling model CRUD operations"""
        # Create finger unit
        unit_data = {
            "name_en": "Test Unit",
            "name_kh": "ឯកតាសាកល្បង",
            "description_en": "Test unit description",
            "description_kh": "សេចក្តីពិពណ៌នាសាកល្បង",
            "order_index": 9001,
            "is_active": True
        }
        
        unit = FingerUnit(**unit_data)
        db.add(unit)
        db.commit()
        db.refresh(unit)
        
        # Verify unit was created
        assert unit.id is not None
        assert unit.name_en == "Test Unit"
        assert unit.name_kh == "ឯកតាសាកល្បង"
        assert unit.is_active is True
        
        # Create finger chapter
        chapter_data = {
            "name_en": "Test Chapter",
            "name_kh": "ជំពូកសាកល្បង",
            "description_en": "Test chapter description",
            "description_kh": "សេចក្តីពិពណ៌នាជំពូក",
            "unit_id": unit.id,
            "order_index": 1,
            "is_active": True
        }
        
        chapter = FingerChapter(**chapter_data)
        db.add(chapter)
        db.commit()
        db.refresh(chapter)
        
        # Verify chapter was created
        assert chapter.id is not None
        assert chapter.name_en == "Test Chapter"
        assert chapter.unit_id == unit.id
        assert chapter.order_index == 1
        assert chapter.is_active is True
        
        # Create finger lesson
        lesson_data = {
            "name_en": "Test Lesson",
            "name_kh": "មេរៀនសាកល្បង",
            "description_en": "Test lesson description",
            "description_kh": "សេចក្តីពិពណ៌នាមេរៀន",
            "chapter_id": chapter.id,
            "order_index": 1,
            "is_active": True
        }
        
        lesson = FingerLesson(**lesson_data)
        db.add(lesson)
        db.commit()
        db.refresh(lesson)
        
        # Verify lesson was created
        assert lesson.id is not None
        assert lesson.name_en == "Test Lesson"
        assert lesson.chapter_id == chapter.id
        assert lesson.order_index == 1
        assert lesson.is_active is True
        
        # Test relationships
        assert unit.chapters[0] == chapter
        assert chapter.lessons[0] == lesson
        
        # Soft delete lesson
        lesson.is_active = False
        db.commit()
        db.refresh(lesson)
        assert lesson.is_active is False
        
        # Verify lesson is soft deleted
        deleted_lesson = db.query(FingerLesson).filter(FingerLesson.id == lesson.id).first()
        assert deleted_lesson is not None
        assert deleted_lesson.is_active is False
    
    def test_database_schema(self, db):
        """Test database schema structure"""
        inspector = inspect(db.bind)
        
        # Check tables exist
        tables = inspector.get_table_names()
        assert "users" in tables
        assert "finger_units" in tables
        assert "finger_chapters" in tables
        assert "finger_lessons" in tables
        
        # Check user table columns
        user_columns = [col["name"] for col in inspector.get_columns("users")]
        expected_user_columns = [
            "id", "username", "email", "password_hash", "display_name",
            "account_type", "auth_provider", "is_guest", "is_active",
            "created_at", "updated_at"
        ]
        for col in expected_user_columns:
            assert col in user_columns
        
        # Check finger_units table columns
        unit_columns = [col["name"] for col in inspector.get_columns("finger_units")]
        expected_unit_columns = [
            "id", "name_en", "name_kh", "description_en", "description_kh",
            "order_index", "is_active", "created_at", "updated_at"
        ]
        for col in expected_unit_columns:
            assert col in unit_columns
    
    def test_database_constraints(self, db):
        """Test database constraints"""
        # Test unique constraint on user email
        user1 = User(
            username="unique_user_1",
            email="unique_user@example.com",
            password_hash="hashed_password",
            display_name="User 1",
            account_type="student"
        )
        user2 = User(
            username="unique_user_1",  # Same username
            email="unique_user_2@example.com",
            password_hash="hashed_password",
            display_name="User 2",
            account_type="student"
        )
        
        db.add(user1)
        db.commit()
        
        with pytest.raises(Exception):  # Should raise integrity error
            db.add(user2)
            db.commit()
    
    def test_database_foreign_keys(self, db):
        """Test database foreign key constraints"""
        # Create a unit first
        unit = FingerUnit(
            name_en="FK Test Unit",
            name_kh="ឯកតា FK",
            description_en="Test unit",
            order_index=9002,
        )
        db.add(unit)
        db.commit()
        db.refresh(unit)
        
        # Create chapter with valid foreign key
        chapter = FingerChapter(
            name_en="Test Chapter",
            name_kh="ជំពូក FK",
            description_en="Test chapter",
            unit_id=unit.id,
            order_index=1
        )
        db.add(chapter)
        db.commit()
        db.refresh(chapter)
        
        # Try to create chapter with invalid foreign key
        invalid_chapter = FingerChapter(
            name_en="Invalid Chapter",
            name_kh="ជំពូកមិនត្រឹមត្រូវ",
            description_en="Invalid chapter",
            unit_id=-1,
            order_index=2
        )
        
        db.add(invalid_chapter)
        with pytest.raises(Exception):  # Should raise foreign key error
            db.commit()
