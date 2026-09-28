from fastapi import APIRouter, HTTPException, Depends, Query
from bson import ObjectId
from datetime import datetime
from typing import List, Optional
from app.schemas.attendance import (
    SessionStart, SessionEnd, SessionResponse,
    MarkAttendanceRequest, AttendanceRecordResponse
)
from app.utils.database import get_database
from app.services.attendance_service import attendance_service
from app.middleware.auth import get_current_user, require_teacher

router = APIRouter(prefix="/attendance", tags=["Attendance"])

@router.post("/start", response_model=SessionResponse)
async def start_attendance_session(
    payload: SessionStart,
    current_user: dict = Depends(require_teacher)
):
    """Start an attendance session and prepare live camera identification."""
    db = get_database()
    today_str = payload.date or datetime.now().strftime("%Y-%m-%d")
    now_time = payload.startTime or datetime.now().strftime("%I:%M %p")

    # Count total registered students in this course/section
    student_count = await db.students.count_documents({
        "course": payload.className,
        "section": payload.section
    })
    if student_count == 0:
        # Fallback to total students in course or overall
        student_count = await db.students.count_documents({"course": payload.className})
        if student_count == 0:
            student_count = await db.students.count_documents({})

    session_doc = {
        "teacherId": current_user["id"],
        "teacherName": current_user["name"],
        "subject": payload.subject,
        "className": payload.className,
        "section": payload.section,
        "date": today_str,
        "startTime": now_time,
        "endTime": None,
        "status": "active",
        "totalStudents": student_count,
        "createdAt": datetime.now()
    }

    res = await db.attendance_sessions.insert_one(session_doc)
    
    return SessionResponse(
        id=str(res.inserted_id),
        teacherId=current_user["id"],
        teacherName=current_user["name"],
        subject=payload.subject,
        className=payload.className,
        section=payload.section,
        date=today_str,
        startTime=now_time,
        endTime=None,
        status="active",
        presentCount=0,
        totalStudents=student_count,
        createdAt=datetime.now().strftime("%Y-%m-%d %H:%M")
    )

@router.post("/stop")
async def stop_attendance_session(
    payload: SessionEnd,
    current_user: dict = Depends(require_teacher)
):
    db = get_database()
    try:
        oid = ObjectId(payload.sessionId)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid session ID.")

    session = await db.attendance_sessions.find_one({"_id": oid})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")

    end_time = datetime.now().strftime("%I:%M %p")
    await db.attendance_sessions.update_one(
        {"_id": oid},
        {"$set": {"status": "completed", "endTime": end_time}}
    )

    present_count = await db.attendance.count_documents({"sessionId": payload.sessionId, "status": "Present"})

    return {
        "success": True,
        "message": "Attendance session stopped.",
        "sessionId": payload.sessionId,
        "endTime": end_time,
        "presentCount": present_count
    }

@router.post("/mark")
async def mark_student_attendance(
    payload: MarkAttendanceRequest,
    current_user: dict = Depends(require_teacher)
):
    """Manually mark or override attendance for a student."""
    res = await attendance_service.mark_attendance(
        student_id=payload.studentId,
        session_id=payload.sessionId,
        confidence=payload.confidence,
        status=payload.status
    )
    return res

@router.get("/today")
async def get_today_attendance(current_user: dict = Depends(get_current_user)):
    db = get_database()
    today_str = datetime.now().strftime("%Y-%m-%d")

    # Get active and today's sessions
    session_cursor = db.attendance_sessions.find({"date": today_str}).sort("createdAt", -1)
    sessions = []
    async for s in session_cursor:
        sid = str(s["_id"])
        present_cnt = await db.attendance.count_documents({"sessionId": sid, "status": "Present"})
        sessions.append({
            "id": sid,
            "subject": s.get("subject", ""),
            "className": s.get("className", ""),
            "section": s.get("section", ""),
            "startTime": s.get("startTime", ""),
            "endTime": s.get("endTime"),
            "status": s.get("status", "active"),
            "presentCount": present_cnt,
            "totalStudents": s.get("totalStudents", 0)
        })

    # Today's attendance records
    rec_cursor = db.attendance.find({"date": today_str}).sort("createdAt", -1).limit(50)
    records = []
    async for r in rec_cursor:
        records.append({
            "id": str(r["_id"]),
            "studentId": r.get("studentId"),
            "studentName": r.get("studentName"),
            "rollNumber": r.get("rollNumber"),
            "subject": r.get("subject"),
            "className": r.get("className"),
            "section": r.get("section"),
            "time": r.get("time"),
            "status": r.get("status"),
            "confidence": r.get("confidence")
        })

    total_students = await db.students.count_documents({})
    present_today = len(records)
    absent_today = max(0, total_students - present_today)
    pct = round((present_today / max(1, total_students)) * 100, 1)

    return {
        "date": today_str,
        "totalStudents": total_students,
        "presentToday": present_today,
        "absentToday": absent_today,
        "attendancePercentage": pct,
        "sessions": sessions,
        "recentAttendance": records
    }

@router.get("/session/{session_id}")
async def get_session_details(
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    try:
        oid = ObjectId(session_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid session ID.")

    session = await db.attendance_sessions.find_one({"_id": oid})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")

    # Fetch marked attendance records for this session
    records_cursor = db.attendance.find({"sessionId": session_id}).sort("createdAt", -1)
    present_records = []
    present_student_ids = set()
    async for r in records_cursor:
        present_student_ids.add(r.get("studentId"))
        present_records.append({
            "id": str(r["_id"]),
            "studentId": r.get("studentId"),
            "studentName": r.get("studentName"),
            "rollNumber": r.get("rollNumber"),
            "time": r.get("time"),
            "status": r.get("status"),
            "confidence": r.get("confidence")
        })

    # Fetch absent students in this class/section (with fallback to course or all)
    all_students_cursor = db.students.find({
        "course": session.get("className"),
        "section": session.get("section")
    })
    absent_students = []
    async for s in all_students_cursor:
        s_id = str(s["_id"])
        if s_id not in present_student_ids:
            absent_students.append({
                "studentId": s_id,
                "studentName": s.get("name"),
                "rollNumber": s.get("rollNumber"),
                "status": "Absent"
            })

    # If no students found with exact course+section, fallback to course
    if not absent_students and len(present_records) == 0:
        fallback_cursor = db.students.find({"course": session.get("className")})
        async for s in fallback_cursor:
            s_id = str(s["_id"])
            if s_id not in present_student_ids:
                absent_students.append({
                    "studentId": s_id,
                    "studentName": s.get("name"),
                    "rollNumber": s.get("rollNumber"),
                    "status": "Absent"
                })

    # If still 0, fallback to all registered students
    if not absent_students and len(present_records) == 0:
        fallback_cursor = db.students.find({})
        async for s in fallback_cursor:
            s_id = str(s["_id"])
            if s_id not in present_student_ids:
                absent_students.append({
                    "studentId": s_id,
                    "studentName": s.get("name"),
                    "rollNumber": s.get("rollNumber"),
                    "status": "Absent"
                })

    return {
        "session": {
            "id": str(session["_id"]),
            "subject": session.get("subject"),
            "className": session.get("className"),
            "section": session.get("section"),
            "date": session.get("date"),
            "startTime": session.get("startTime"),
            "endTime": session.get("endTime"),
            "status": session.get("status"),
            "teacherName": session.get("teacherName")
        },
        "presentCount": len(present_records),
        "absentCount": len(absent_students),
        "presentRecords": present_records,
        "absentStudents": absent_students
    }

@router.get("/student/{student_id}")
async def get_student_attendance(
    student_id: str,
    current_user: dict = Depends(get_current_user)
):
    report = await attendance_service.get_student_report(student_id)
    if "error" in report:
        raise HTTPException(status_code=404, detail=report["error"])
    return report

@router.get("/analytics")
async def get_attendance_analytics(current_user: dict = Depends(get_current_user)):
    return await attendance_service.get_dashboard_analytics()
