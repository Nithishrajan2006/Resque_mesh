"""
Database configuration and initialization for ResQMesh
Uses standard SQLite with SQLAlchemy ORM (100% native on Python 3.14+)
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session, DeclarativeBase
import logging

logger = logging.getLogger(__name__)

DATABASE_URL = "sqlite:///./resqmesh.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialize database tables and run safe column migrations"""
    from app import models  # noqa - ensures models are registered
    Base.metadata.create_all(bind=engine)
    with engine.connect() as conn:
        try:
            cursor = conn.exec_driver_sql("PRAGMA table_info(peers)")
            columns = [row[1] for row in cursor.fetchall()]
            if "battery_level" not in columns:
                conn.exec_driver_sql("ALTER TABLE peers ADD COLUMN battery_level INTEGER DEFAULT 100")
            if "sync_status" not in columns:
                conn.exec_driver_sql("ALTER TABLE peers ADD COLUMN sync_status VARCHAR(50) DEFAULT 'synced'")
            conn.commit()
        except Exception as e:
            logger.warning(f"Column migration check note: {e}")
    logger.info("Database tables created/verified successfully")
