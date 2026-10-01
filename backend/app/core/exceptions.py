# backend/app/core/exceptions.py

import logging

from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError


# ============================================================
# Logger
# ============================================================

logger = logging.getLogger(__name__)


# ============================================================
# Database error handler
# ============================================================

def handle_database_error(
    error: SQLAlchemyError,
    message: str
) -> HTTPException:
    """
    Handle a database-related error.

    The detailed error is written to the server log.

    The client receives only a safe, general error message.
    """

    logger.exception(
        "Database error: %s",
        error
    )

    return HTTPException(
        status_code=500,
        detail=message
    )


# ============================================================
# Global unexpected exception handler
# ============================================================

async def global_exception_handler(
    request: Request,
    exc: Exception
) -> JSONResponse:
    """
    Handle unexpected application errors.

    This handler prevents internal application details from
    being exposed to API clients.

    Detailed information is logged on the server while the
    client receives a safe and consistent response.
    """

    logger.exception(
        "Unexpected error while processing %s %s",
        request.method,
        request.url.path,
        exc_info=exc
    )

    return JSONResponse(
        status_code=500,
        content={
            "detail": "An unexpected server error occurred."
        }
    )