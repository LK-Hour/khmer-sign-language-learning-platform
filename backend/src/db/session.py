from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from src.core.config import settings

# Validate timezone value at startup to prevent injection via malformed env vars.
_ALLOWED_TZ_CHARS = set("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789/_+-")

if not all(c in _ALLOWED_TZ_CHARS for c in settings.database_timezone):
    raise RuntimeError(
        f"Invalid database_timezone value: {settings.database_timezone!r}. "
        "Only alphanumeric, '/', '_', '+', '-' characters are allowed."
    )

engine = create_engine(
    settings.database_url,
    # Fail fast when the database is unreachable so requests return a 503
    # instead of hanging for the OS-level TCP timeout.
    connect_args={
        "options": f"-c timezone={settings.database_timezone}",
        "connect_timeout": 5,
    },
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    pool_timeout=10,
)


@event.listens_for(engine, "connect")
def _set_session_timezone(dbapi_connection, connection_record):
    """Set session timezone using parameterized SET command.

    PostgreSQL SET doesn't support $1 parameter syntax, so we validate
    the timezone value at module load instead.
    """
    cursor = dbapi_connection.cursor()
    cursor.execute("SET TIME ZONE %s", (settings.database_timezone,))
    cursor.close()


SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def check_database() -> bool:
    """Return True when a trivial query succeeds on a fresh connection."""
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return True
    except Exception:
        return False
