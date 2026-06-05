from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from src.core.config import settings

DATABASE_URL = settings.database_url
DATABASE_TIMEZONE = settings.database_timezone

engine = create_engine(
    DATABASE_URL,
    connect_args={"options": f"-c timezone={DATABASE_TIMEZONE}"},
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    pool_timeout=30,
)


@event.listens_for(engine, "connect")
def _set_session_timezone(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute(f"SET TIME ZONE '{DATABASE_TIMEZONE}'")
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
