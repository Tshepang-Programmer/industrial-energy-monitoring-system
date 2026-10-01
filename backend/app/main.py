# backend/app/main.py

from fastapi import FastAPI, Request

from app.api.routes.devices import router as devices_router
from app.api.routes.readings import router as readings_router
from app.core.exceptions import global_exception_handler


# ============================================================
# FastAPI application
# ============================================================

app = FastAPI(
    title="Industrial Energy Monitoring System",
    description=(
        "IoT-based industrial energy monitoring "
        "and power quality analysis API"
    ),
    version="1.0.0"
)


# ============================================================
# Global exception handler
# ============================================================

app.add_exception_handler(
    Exception,
    global_exception_handler
)


# ============================================================
# API routers
# ============================================================

app.include_router(devices_router)
app.include_router(readings_router)


# ============================================================
# Root endpoint
# ============================================================

@app.get("/")
def root():
    """
    Confirm that the API is running.
    """

    return {
        "message": "Industrial Energy Monitoring API is running"
    }


# ============================================================
# Health check
# ============================================================

@app.get("/health")
def health_check():
    """
    Health check endpoint.

    Used to determine whether the FastAPI application
    is responding.
    """

    return {
        "status": "healthy"
    }