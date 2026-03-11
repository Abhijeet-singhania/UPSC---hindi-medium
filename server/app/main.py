from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import router as api_router
from app.db.database import engine
from app.db import models

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="UPSC Hindi Peer Network",
    description="A peer-to-peer UPSC Hindi learning ecosystem",
    version="0.1.0"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix="/api/v1")


@app.get("/")
def root():
    return {"message": "Welcome to UPSC Hindi Peer Network API"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
