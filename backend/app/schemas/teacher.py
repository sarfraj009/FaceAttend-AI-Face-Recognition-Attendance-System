from pydantic import BaseModel, EmailStr
from typing import Optional

class TeacherCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    subject: str
    department: str

class TeacherUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    subject: Optional[str] = None
    department: Optional[str] = None
    password: Optional[str] = None

class TeacherResponse(BaseModel):
    id: str
    name: str
    email: str
    subject: str
    department: str
    createdAt: Optional[str] = None
