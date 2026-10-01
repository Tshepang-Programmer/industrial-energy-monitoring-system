# backend/app/database/session.py

from collections.abc import Generator
from sqlalchemy.orm import Session, sessionmaker
from app.database.connection import engine

# SessionLocal is a factory that creates a new SQLAlchemy
# database session whenever we need to communicate with
# PostgreSQL.
# autocommit=False:
#   Changes are NOT automatically committed to the database.
#   We explicitly call db.commit() when we want to save changes.
# autoflush=False:
#   SQLAlchemy will not automatically send pending changes
#   to the database before every query.
# bind=engine:
#   Connects these sessions to the database engine created
#   in connection.py.

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

def get_db() -> Generator[Session, None, None]:
    """
    Create a database session for a FastAPI request.

    The session is provided to the API route using FastAPI's
    dependency injection system.

    The finally block guarantees that the session is closed
    after the request, even if an error occurs.
    """

    # Create a new database session.
    db = SessionLocal()

    try:
        # Give the database session to the API route.
        yield db
    finally:
        # Always close the session when the request is finished.
        # This prevents database connections/resources from
        # being left open.
        db.close()