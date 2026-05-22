from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

# Load environment variables FIRST before importing routers
load_dotenv()

from .routes.oauth import router as oauth_router
from .routes.users import router as users_router

app = FastAPI(title="Khmer Sign Language Platform")

# Include routes
app.include_router(oauth_router)
app.include_router(users_router)

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