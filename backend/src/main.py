from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import logging
import os
import time
from dotenv import load_dotenv

# Load environment variables FIRST before importing routers
load_dotenv()

from .api.router import router as api_router
from .core.config import settings

logger = logging.getLogger("ksl.timing")

app = FastAPI(title=settings.app_title)


@app.middleware("http")
async def timing_middleware(request: Request, call_next):
    """Log response time for API requests (skip static files)."""
    path = request.url.path
    if path.startswith("/api/"):
        start = time.perf_counter()
        response = await call_next(request)
        elapsed_ms = (time.perf_counter() - start) * 1000
        # Only log slow requests (>100ms) to reduce noise
        if elapsed_ms > 100:
            logger.warning("SLOW %s %s — %.0fms", request.method, path, elapsed_ms)
        else:
            logger.info("%s %s — %.0fms", request.method, path, elapsed_ms)
        response.headers["X-Response-Time"] = f"{elapsed_ms:.0f}ms"
        return response
    return await call_next(request)

# Configure CORS — must be added before mounting static files so that
# cross-origin requests to /data_set/... (video/image assets) also receive
# the appropriate Access-Control-Allow-Origin headers.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(api_router)

# Serve local dataset files for browser previews (e.g., /data_set/...png)
_BACKEND_DIR = os.path.dirname(os.path.dirname(__file__))
_REPO_ROOT_DIR = os.path.dirname(_BACKEND_DIR)
_DATASET_DIR = os.path.join(_REPO_ROOT_DIR, "data_set")
if os.path.isdir(_DATASET_DIR):
    app.mount("/data_set", StaticFiles(directory=_DATASET_DIR), name="data_set")


@app.get("/")
def read_root():
    return {"status": "Backend is running", "environment": settings.environment}
