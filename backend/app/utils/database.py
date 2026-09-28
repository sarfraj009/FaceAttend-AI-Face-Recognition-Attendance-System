from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.utils.config import settings
from app.utils.security import hash_password
from datetime import datetime
import logging

logger = logging.getLogger("uvicorn")

class Database:
    client: AsyncIOMotorClient = None
    db: AsyncIOMotorDatabase = None

db_instance = Database()

async def connect_to_mongo():
    logger.info("Connecting to MongoDB at %s ...", settings.MONGO_URI)
    db_instance.client = AsyncIOMotorClient(settings.MONGO_URI)
    db_instance.db = db_instance.client[settings.DB_NAME]
    logger.info("Connected to MongoDB database: %s", settings.DB_NAME)
    
    # Initialize indexes and default seed data
    await init_indexes()
    await seed_initial_data()

async def close_mongo_connection():
    if db_instance.client:
        logger.info("Closing MongoDB connection...")
        db_instance.client.close()

def get_database() -> AsyncIOMotorDatabase:
    return db_instance.db

async def init_indexes():
    db = get_database()
    try:
        # Users indexes
        await db.users.create_index("email", unique=True)
        
        # Students indexes
        await db.students.create_index("rollNumber", unique=True)
        await db.students.create_index("email", unique=True, sparse=True)
        
        # Teachers indexes
        await db.teachers.create_index("email", unique=True)
        
        # Attendance compound index to prevent duplicates: studentId + sessionId
        await db.attendance.create_index([("studentId", 1), ("sessionId", 1)], unique=True)
        await db.attendance.create_index([("date", 1), ("studentId", 1)])
        
        # Attendance sessions index
        await db.attendance_sessions.create_index("date")
        await db.attendance_sessions.create_index("teacherId")
        
        logger.info("MongoDB indexes verified/created successfully.")
    except Exception as e:
        logger.warning("Error creating MongoDB indexes: %s", str(e))

async def seed_initial_data():
    """Seed default admin, teacher, and student demo accounts if users collection is empty."""
    db = get_database()
    user_count = await db.users.count_documents({})
    if user_count == 0:
        logger.info("No users found. Seeding initial accounts...")
        
        # 1. Admin
        admin_doc = {
            "name": "System Administrator",
            "email": "admin@faceattend.ai",
            "password": hash_password("admin123"),
            "role": "admin",
            "createdAt": datetime.now()
        }
        await db.users.insert_one(admin_doc)
        
        # 2. Teacher
        teacher_user = {
            "name": "Prof. Alan Turing",
            "email": "teacher@faceattend.ai",
            "password": hash_password("teacher123"),
            "role": "teacher",
            "createdAt": datetime.now()
        }
        teacher_res = await db.users.insert_one(teacher_user)
        
        teacher_profile = {
            "userId": str(teacher_res.inserted_id),
            "name": "Prof. Alan Turing",
            "email": "teacher@faceattend.ai",
            "subject": "Computer Networks",
            "department": "Computer Science & Engineering",
            "createdAt": datetime.now()
        }
        await db.teachers.insert_one(teacher_profile)
        
        # 3. Sample Classes
        classes = [
            {"course": "B.Tech CSE", "branch": "Computer Science", "year": "3rd Year", "section": "CSE-A", "subject": "Computer Networks"},
            {"course": "B.Tech CSE", "branch": "Computer Science", "year": "3rd Year", "section": "CSE-B", "subject": "Operating Systems"},
            {"course": "B.Tech AI-DS", "branch": "Artificial Intelligence", "year": "2nd Year", "section": "AI-1", "subject": "Machine Learning"},
        ]
        await db.classes.insert_many(classes)

        # 4. Student Demo
        student_user = {
            "name": "Rahul Sharma",
            "email": "student@faceattend.ai",
            "password": hash_password("student123"),
            "role": "student",
            "createdAt": datetime.now()
        }
        student_user_res = await db.users.insert_one(student_user)

        sample_student = {
            "userId": str(student_user_res.inserted_id),
            "name": "Rahul Sharma",
            "rollNumber": "2024CSE101",
            "enrollmentNumber": "EN202401001",
            "email": "student@faceattend.ai",
            "phone": "+91 9876543210",
            "course": "B.Tech CSE",
            "branch": "Computer Science",
            "year": "3rd Year",
            "section": "CSE-A",
            "profileImage": "",
            "faceEmbeddings": [],
            "createdAt": datetime.now()
        }
        await db.students.insert_one(sample_student)

        logger.info("Demo accounts successfully seeded: admin@faceattend.ai / admin123, teacher@faceattend.ai / teacher123, student@faceattend.ai / student123")
