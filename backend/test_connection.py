from sqlalchemy import text
from app.database import engine   # imported from __init__.py

try:
    with engine.connect() as connection:
        result = connection.execute(text("SELECT version()"))
        
        print("Database connection successful:", result.fetchone())
except Exception as e:
    print("Database connection failed:", str(e))
