import os
from dotenv import load_dotenv

# Load from .env if present
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '.env'))

class Settings:
    MONGO_URI: str = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    DB_NAME: str = os.getenv("DB_NAME", "ai_attendance_system")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "face_recognition_attendance_jwt_secret_key_2026_super_secure")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    
    # SFace cosine similarity threshold: 0.363 is official threshold, 0.40 - 0.45 provides high accuracy
    FACE_MATCH_THRESHOLD: float = float(os.getenv("FACE_MATCH_THRESHOLD", "0.45"))
    RECOGNITION_COOLDOWN_SECONDS: int = int(os.getenv("RECOGNITION_COOLDOWN_SECONDS", "10"))
    
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    PORT: int = int(os.getenv("PORT", "8000"))

    # File paths for models
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    MODELS_DIR = os.path.join(BASE_DIR, "models_weights")
    YUNET_PATH = os.path.join(MODELS_DIR, "face_detection_yunet_2023mar.onnx")
    SFACE_PATH = os.path.join(MODELS_DIR, "face_recognition_sface_2021dec.onnx")

settings = Settings()
