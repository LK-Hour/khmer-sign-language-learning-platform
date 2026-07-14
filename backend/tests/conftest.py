"""
Pytest configuration and fixtures for testing
"""
import os
import uuid
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Import your app and models
from src.main import app
from src.db.session import Base, get_db
from src.models import user as _user_models  # noqa: F401
from src.models import media as _media_models  # noqa: F401
from src.models import finger_spelling as _finger_models  # noqa: F401
from src.models import word_detection as _word_detection_models  # noqa: F401
from src.models import user_oauth_provider as _oauth_models  # noqa: F401
from src.models import user_session as _session_models  # noqa: F401
from src.models import refresh_token as _refresh_token_models  # noqa: F401

# Use PostgreSQL for tests (models use UUID which SQLite doesn't support)
SQLALCHEMY_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    os.getenv(
    "DATABASE_URL",
    "postgresql://admin:admin@127.0.0.1:5432/khmer_sign_db",
    ),
)

# Create test database engine
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"options": "-c timezone=Asia/Phnom_Penh"},
)

# Create test session
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Tables whose serial IDs must stay ahead of seeded rows when tests share a DB.
_SERIAL_ID_TABLES = (
    "finger_units",
    "finger_chapters",
    "finger_lessons",
    "finger_exercises",
    "word_detection_units",
    "word_detection_chapters",
    "word_detection_lessons",
    "word_detection_exercises",
)


def _sync_serial_sequences(connection) -> None:
    """Ensure the next INSERT id is above any committed seed/test rows."""
    for table in _SERIAL_ID_TABLES:
        connection.execute(
            text(
                f"""
                SELECT setval(
                    pg_get_serial_sequence('{table}', 'id'),
                    COALESCE((SELECT MAX(id) FROM {table}), 0) + 1,
                    false
                )
                WHERE pg_get_serial_sequence('{table}', 'id') IS NOT NULL
                """
            )
        )


@pytest.fixture(scope="session")
def test_db():
    """Create test database schema for the test session."""
    Base.metadata.create_all(bind=engine)
    with engine.connect() as connection:
        _sync_serial_sequences(connection)
        connection.commit()
    yield


@pytest.fixture(scope="function")
def db(test_db):
    """Create a fresh database session for each test with transaction rollback."""
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    if transaction.is_active:
        transaction.rollback()
    connection.close()


@pytest.fixture
def client(db):
    """Create test client with database session override."""
    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def test_user_data():
    """Test user data for creating users"""
    suffix = uuid.uuid4().hex
    return {
        "username": f"test_{suffix}",
        "email": f"test_{suffix}@example.com",
        "password": "SecurePass123!",
        "display_name": "Test User",
        "account_type": "student",
        "auth_provider": "email",
        "is_guest": False,
    }


@pytest.fixture
def test_admin_data():
    """Test admin user data"""
    suffix = uuid.uuid4().hex
    return {
        "username": f"admin_{suffix}",
        "email": f"admin_{suffix}@example.com",
        "password": "AdminPass123!",
        "display_name": "Admin User",
        "account_type": "admin",
        "auth_provider": "email",
        "is_guest": False,
    }


@pytest.fixture
def auth_headers(client, test_user_data):
    """Create authentication headers for test user"""
    # Create user first
    response = client.post("/api/users/", json=test_user_data)
    assert response.status_code == 201

    # Login to get token
    login_data = {
        "email": test_user_data["email"],
        "password": test_user_data["password"],
    }
    login_response = client.post("/api/auth/login/email", json=login_data)
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def admin_headers(client, test_admin_data):
    """Create authentication headers for test admin"""
    # Create admin first
    response = client.post("/api/users/", json=test_admin_data)
    assert response.status_code == 201

    # Login to get token
    login_data = {
        "email": test_admin_data["email"],
        "password": test_admin_data["password"],
    }
    login_response = client.post("/api/auth/login/email", json=login_data)
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
