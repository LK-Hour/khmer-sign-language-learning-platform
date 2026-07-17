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
    connect_args={"options": f"-c timezone={settings.database_timezone}"},
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    pool_timeout=30,
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
