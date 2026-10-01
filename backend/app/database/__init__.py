# backend/app/database/__init__.py

# Re-export important database components.
#
# This allows other parts of the application to use:
#
#     from app.database import engine
#     from app.database import SessionLocal
#     from app.database import get_db
#     from app.database import Base
#
# instead of importing each component from its individual module.

from app.database.connection import engine
from app.database.session import SessionLocal, get_db
from app.database.base import Base