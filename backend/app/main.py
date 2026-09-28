from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.utils.config import settings
from app.utils.database import connect_to_mongo, close_mongo_connection
from app.routes.auth_routes import router as auth_router
from app.routes.student_routes import router as student_router
from app.routes.teacher_routes import router as teacher_router
from app.routes.class_routes import router as class_router
from app.routes.face_routes import router as face_router
from app.routes.attendance_routes import router as attendance_router
from app.routes.report_routes import router as report_router

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("uvicorn")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Initializing AI Attendance & Face Recognition System Backend...")
    await connect_to_mongo()
    yield
    # Shutdown
    logger.info("Shutting down AI Attendance System Backend...")
    await close_mongo_connection()

app = FastAPI(
    title="AI Attendance & Face Recognition System",
    description="Enterprise automated AI attendance system using computer vision, face detection, and biometric embeddings.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
origins = [
    settings.FRONTEND_URL,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers under /api
app.include_router(auth_router, prefix="/api")
app.include_router(student_router, prefix="/api")
app.include_router(teacher_router, prefix="/api")
app.include_router(class_router, prefix="/api")
app.include_router(face_router, prefix="/api")
app.include_router(attendance_router, prefix="/api")
app.include_router(report_router, prefix="/api")

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "AI Face Recognition Attendance System",
        "version": "1.0.0",
        "yunet": "ready",
        "sface": "ready",
        "matchThreshold": settings.FACE_MATCH_THRESHOLD
    }

@app.get("/")
async def root():
    return {
        "message": "AI Attendance & Face Recognition System API is running.",
        "documentation": "/docs",
        "health": "/api/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=True)
