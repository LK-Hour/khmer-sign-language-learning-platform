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


@pytest.fixture(autouse=True)
def _reset_rate_limits():
    """Clear rate-limit counters before each test.

    Rate limiting keys (ksl:rate:*) live in the shared Redis instance and are
    keyed by client IP + path, which is the same for every TestClient request.
    Without this, tests that hit a rate-limited endpoint (e.g. /login/email)
    many times across the suite would eventually trip the limiter.
    """
    from src.core.redis import get_redis_client

    try:
        rc = get_redis_client()
        for key in rc.scan_iter(match="ksl:rate:*"):
            rc.delete(key)
    except Exception:
        pass
    yield


@pytest.fixture
def client(db):
    """Create test client with database session override."""
    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    # Use an https:// base_url so httpx's cookie jar accepts the backend's
    # Secure refresh_token cookie (COOKIE_SECURE=true is required for
    # SameSite=None cookies to be stored by any real browser — see
    # backend/.env). TestClient never makes a real network call, so the
    # scheme here has no effect on connectivity, only on cookie handling.
    with TestClient(app, base_url="https://testserver") as c:
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
def auth_headers(client, test_user_data, db):
    """Create authentication headers for test user"""
    from src.models.user import User
    from src.utils.password import hash_password

    # Create user directly in DB (endpoint now requires admin auth)
    user = User(
        username=test_user_data["username"],
        email=test_user_data["email"],
        password_hash=hash_password(test_user_data["password"]),
        display_name=test_user_data["display_name"],
        account_type=test_user_data["account_type"],
        auth_provider=test_user_data["auth_provider"],
        is_guest=test_user_data["is_guest"],
    )
    db.add(user)
    db.flush()

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
def admin_headers(client, test_admin_data, db):
    """Create authentication headers for test admin"""
    from src.models.user import User
    from src.utils.password import hash_password

    # Create admin directly in DB (endpoint now requires admin auth)
    user = User(
        username=test_admin_data["username"],
        email=test_admin_data["email"],
        password_hash=hash_password(test_admin_data["password"]),
        display_name=test_admin_data["display_name"],
        account_type=test_admin_data["account_type"],
        auth_provider=test_admin_data["auth_provider"],
        is_guest=test_admin_data["is_guest"],
    )
    db.add(user)
    db.flush()

    # Login to get token
    login_data = {
        "email": test_admin_data["email"],
        "password": test_admin_data["password"],
    }
    login_response = client.post("/api/auth/login/email", json=login_data)
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def seed_user(db):
    """Create a user directly in the DB and return it. Useful for tests that
    need a user to exist before calling auth endpoints."""
    from src.models.user import User
    from src.utils.password import hash_password

    def _create(user_data: dict) -> User:
        user = User(
            username=user_data["username"],
            email=user_data.get("email"),
            password_hash=hash_password(user_data["password"]) if user_data.get("password") else None,
            display_name=user_data["display_name"],
            account_type=user_data.get("account_type", "student"),
            auth_provider=user_data.get("auth_provider", "email"),
            is_guest=user_data.get("is_guest", False),
        )
        db.add(user)
        db.flush()
        return user

    return _create
