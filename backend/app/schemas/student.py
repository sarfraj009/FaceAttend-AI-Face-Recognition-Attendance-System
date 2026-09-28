from pydantic import BaseModel, EmailStr
from typing import Optional, List

class StudentCreate(BaseModel):
    name: str
    rollNumber: str
    enrollmentNumber: str
    email: EmailStr
    phone: str
    course: str
    branch: str
    year: str
    section: str
    profileImage: Optional[str] = ""

class StudentUpdate(BaseModel):
    name: Optional[str] = None
    rollNumber: Optional[str] = None
    enrollmentNumber: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    course: Optional[str] = None
    branch: Optional[str] = None
    year: Optional[str] = None
    section: Optional[str] = None
    profileImage: Optional[str] = None

class StudentResponse(BaseModel):
    id: str
    name: str
    rollNumber: str
    enrollmentNumber: str
    email: str
    phone: str
    course: str
    branch: str
    year: str
    section: str
    profileImage: Optional[str] = ""
    hasFaceData: bool = False
    faceSamplesCount: int = 0
    createdAt: Optional[str] = None

class FaceRegisterRequest(BaseModel):
    studentId: str
    images: List[str] # base64 encoded data URLs (multi-angle frames)
    angle: Optional[str] = "front"

class FaceRecognizeRequest(BaseModel):
    image: str # base64 image data URL
    sessionId: Optional[str] = None
    autoMark: bool = True
