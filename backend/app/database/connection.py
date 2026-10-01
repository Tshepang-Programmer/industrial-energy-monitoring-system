# backend/app/database/connection.py

import os
from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.pool import NullPool
from dotenv import load_dotenv

# ✅ Load environment variables from .env
load_dotenv()

# Database URL (e.g., postgresql+psycopg2://user:password@localhost/dbname)
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set in environment variables")

# ✅ Create SQLAlchemy engine
# - NullPool: avoids connection reuse (safe for FastAPI dev reloads)
# - echo=True: logs SQL queries (set False in production)
# - future=True: enables SQLAlchemy 2.0 style
engine: Engine = create_engine(
    DATABASE_URL,
    poolclass=NullPool,
    echo=True,   # flip to False in production
    future=True
)
