"""Translate database-connectivity failures into a clear 503 response.

Without this, an unreachable database surfaces as a bare 500 (or, for
errors raised outside the CORS middleware, as a browser network error), so the
frontend cannot tell "database down" apart from an ordinary bug.
"""

from __future__ import annotations

import logging

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from sqlalchemy.exc import InterfaceError, OperationalError
from sqlalchemy.exc import TimeoutError as PoolTimeoutError

logger = logging.getLogger("ksl.errors")

# Raised when the database cannot be reached, the connection drops mid-request,
# or the pool has no connection to hand out. Constraint/data errors are not
# included on purpose: those are caller problems, not an outage.
DATABASE_UNAVAILABLE_ERRORS = (OperationalError, InterfaceError, PoolTimeoutError)

DATABASE_UNAVAILABLE_CODE = "database_unavailable"
DATABASE_UNAVAILABLE_DETAIL = "The database is currently unavailable. Please try again shortly."
RETRY_AFTER_SECONDS = "5"


async def _database_unavailable_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.error("Database unavailable on %s %s: %s", request.method, request.url.path, exc)
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={"detail": DATABASE_UNAVAILABLE_DETAIL, "code": DATABASE_UNAVAILABLE_CODE},
        headers={"Retry-After": RETRY_AFTER_SECONDS},
    )


def register_exception_handlers(app: FastAPI) -> None:
    """Register handlers inside the CORS layer so the browser can read the 503."""
    for exc_type in DATABASE_UNAVAILABLE_ERRORS:
        app.add_exception_handler(exc_type, _database_unavailable_handler)
