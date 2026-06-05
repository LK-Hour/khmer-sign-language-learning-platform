from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from dotenv import load_dotenv

# Load environment variables FIRST before importing routers
load_dotenv()

from .api.router import router as api_router
from .core.config import settings

app = FastAPI(title=settings.app_title)

# Include routes
app.include_router(api_router)

# Serve local dataset files for browser previews (e.g., /data_set/...png)
_BACKEND_DIR = os.path.dirname(os.path.dirname(__file__))
_REPO_ROOT_DIR = os.path.dirname(_BACKEND_DIR)
_DATASET_DIR = os.path.join(_REPO_ROOT_DIR, "data_set")
if os.path.isdir(_DATASET_DIR):
    app.mount("/data_set", StaticFiles(directory=_DATASET_DIR), name="data_set")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "Backend is running", "environment": settings.environment}
