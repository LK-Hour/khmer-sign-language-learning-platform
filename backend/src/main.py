from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from dotenv import load_dotenv

# Load environment variables FIRST before importing routers
load_dotenv()

from .routes.oauth import router as oauth_router
from .routes.users import router as users_router
from .routes.curriculum import router as curriculum_router
from .routes.finger_spelling import router as finger_spelling_router

app = FastAPI(title="Khmer Sign Language Platform")

# Include routes
app.include_router(oauth_router)
app.include_router(users_router)
app.include_router(curriculum_router)
app.include_router(finger_spelling_router)

# Serve local dataset files for browser previews (e.g., /data_set/...png)
_BACKEND_DIR = os.path.dirname(os.path.dirname(__file__))
_REPO_ROOT_DIR = os.path.dirname(_BACKEND_DIR)
_DATASET_DIR = os.path.join(_REPO_ROOT_DIR, "data_set")
if os.path.isdir(_DATASET_DIR):
    app.mount("/data_set", StaticFiles(directory=_DATASET_DIR), name="data_set")

# Configure CORS
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "https://delicious-folk-recount.ngrok-free.dev",
    "https://khmersignlanguage.share.zrok.io",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "Backend is running", "environment": "development"}