from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, DeclarativeBase
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://admin:admin@localhost:5432/khmer_sign_db")
DATABASE_TIMEZONE = os.getenv("DATABASE_TIMEZONE", "Asia/Phnom_Penh")

engine = create_engine(
    DATABASE_URL,
    connect_args={"options": f"-c timezone={DATABASE_TIMEZONE}"},
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
    finally:
        db.close()
