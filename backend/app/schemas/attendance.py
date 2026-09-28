from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class SessionStart(BaseModel):
    subject: str
    className: str
    section: str
    date: Optional[str] = None
    startTime: Optional[str] = None

class SessionEnd(BaseModel):
    sessionId: str

class SessionResponse(BaseModel):
    id: str
    teacherId: str
    teacherName: str
    subject: str
    className: str
    section: str
    date: str
    startTime: str
    endTime: Optional[str] = None
    status: str
    presentCount: int = 0
    totalStudents: int = 0
    createdAt: Optional[str] = None

class MarkAttendanceRequest(BaseModel):
    studentId: str
    sessionId: str
    confidence: float = 90.0
    status: str = "Present"

class AttendanceRecordResponse(BaseModel):
    id: str
    studentId: str
    studentName: str
    rollNumber: str
    sessionId: str
    subject: Optional[str] = None
    className: Optional[str] = None
    section: Optional[str] = None
    date: str
    time: str
    status: str
    confidence: float
    createdAt: Optional[str] = None

class AttendanceFilter(BaseModel):
    studentId: Optional[str] = None
    rollNumber: Optional[str] = None
    className: Optional[str] = None
    section: Optional[str] = None
    subject: Optional[str] = None
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    status: Optional[str] = None
