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
    """Initialize database tables"""
    from app import models  # noqa - ensures models are registered
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created/verified successfully")
