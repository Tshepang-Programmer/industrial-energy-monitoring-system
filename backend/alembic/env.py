# backend/alembic/env.py

from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

# ------------------------------------------------------------
# Import application database configuration
# ------------------------------------------------------------

from app.database.connection import DATABASE_URL
from app.database.base import Base

# Import the models so SQLAlchemy registers their tables
# with Base.metadata.
from app.models.device import Device
from app.models.reading import SensorReading


# Alembic Config object.
#
# This object provides access to values from alembic.ini.
config = context.config


# ------------------------------------------------------------
# Configure logging
# ------------------------------------------------------------

if config.config_file_name is not None:
    fileConfig(config.config_file_name)


# ------------------------------------------------------------
# SQLAlchemy metadata
# ------------------------------------------------------------
#
# Alembic uses this metadata when comparing the current
# PostgreSQL database structure with our SQLAlchemy models.
#
# This allows us to use:
#
#     alembic revision --autogenerate
#
# later.

target_metadata = Base.metadata


# ------------------------------------------------------------
# Database URL
# ------------------------------------------------------------
#
# Use the same DATABASE_URL that the FastAPI application
# already uses.
#
# This means we don't need to place the PostgreSQL password
# directly inside alembic.ini.

config.set_main_option(
    "sqlalchemy.url",
    DATABASE_URL
)


# ------------------------------------------------------------
# Offline migrations
# ------------------------------------------------------------

def run_migrations_offline() -> None:
    """
    Run migrations without creating a live database connection.

    Alembic generates SQL statements using the configured
    database URL.
    """

    url = config.get_main_option("sqlalchemy.url")

    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={
            "paramstyle": "named"
        },
    )

    with context.begin_transaction():
        context.run_migrations()


# ------------------------------------------------------------
# Online migrations
# ------------------------------------------------------------

def run_migrations_online() -> None:
    """
    Run migrations using a live database connection.
    """

    # Create the SQLAlchemy engine using the configuration
    # from alembic.ini.
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    # Connect to PostgreSQL.
    with connectable.connect() as connection:

        # Configure Alembic with the live connection and
        # SQLAlchemy model metadata.
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )

        # Run the migration inside a transaction.
        with context.begin_transaction():
            context.run_migrations()


# ------------------------------------------------------------
# Select migration mode
# ------------------------------------------------------------

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()