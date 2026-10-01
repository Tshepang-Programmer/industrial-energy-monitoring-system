# backend/app/database/create_tables.py

"""
Legacy utility for creating database tables directly from SQLAlchemy models.

Database schema changes should normally be managed using Alembic migrations.
This script is retained as a development utility only.
"""

from app.database.connection import engine
from app.database.base import Base

# Import models so they are registered with Base.metadata.
from app.models.device import Device
from app.models.reading import SensorReading


def create_all_tables():
    """Create all tables defined in the SQLAlchemy metadata."""
    Base.metadata.create_all(bind=engine)


if __name__ == "__main__":
    create_all_tables()
    print("Tables created successfully.")