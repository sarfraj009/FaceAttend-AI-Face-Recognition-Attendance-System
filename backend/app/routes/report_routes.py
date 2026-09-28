from fastapi import APIRouter, HTTPException, Depends, Query, Response
from typing import Optional, List
from datetime import datetime
from app.utils.database import get_database
from app.services.attendance_service import attendance_service
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/reports", tags=["Reports"])

async def query_attendance_records(
    student_id: Optional[str] = None,
    roll_number: Optional[str] = None,
    class_name: Optional[str] = None,
    section: Optional[str] = None,
    subject: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    status_filter: Optional[str] = None
) -> List[dict]:
    db = get_database()
    query = {}
    
    if student_id:
        query["studentId"] = student_id
    if roll_number:
        query["rollNumber"] = {"$regex": roll_number, "$options": "i"}
    if class_name:
        query["className"] = class_name
    if section:
        query["section"] = section
    if subject:
        query["subject"] = subject
    if status_filter:
        query["status"] = status_filter

    if start_date and end_date:
        query["date"] = {"$gte": start_date, "$lte": end_date}
    elif start_date:
        query["date"] = {"$gte": start_date}
    elif end_date:
        query["date"] = {"$lte": end_date}

    cursor = db.attendance.find(query).sort([("date", -1), ("time", -1)])
    records = []
    async for doc in cursor:
        records.append({
            "id": str(doc["_id"]),
            "studentId": doc.get("studentId", ""),
            "studentName": doc.get("studentName", ""),
            "rollNumber": doc.get("rollNumber", ""),
            "className": doc.get("className", ""),
            "section": doc.get("section", ""),
            "subject": doc.get("subject", ""),
            "date": doc.get("date", ""),
            "time": doc.get("time", ""),
            "status": doc.get("status", "Present"),
            "confidence": doc.get("confidence", 90.0)
        })
    return records

@router.get("/attendance")
async def get_attendance_report(
    studentId: Optional[str] = Query(None),
    rollNumber: Optional[str] = Query(None),
    className: Optional[str] = Query(None),
    section: Optional[str] = Query(None),
    subject: Optional[str] = Query(None),
    startDate: Optional[str] = Query(None),
    endDate: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    records = await query_attendance_records(
        student_id=studentId,
        roll_number=rollNumber,
        class_name=className,
        section=section,
        subject=subject,
        start_date=startDate,
        end_date=endDate,
        status_filter=status
    )

    total = len(records)
    present = sum(1 for r in records if r["status"] == "Present")
    absent = total - present
    pct = round((present / max(1, total)) * 100, 1) if total > 0 else 100.0

    return {
        "totalRecords": total,
        "presentCount": present,
        "absentCount": absent,
        "percentage": pct,
        "records": records
    }

@router.get("/attendance/csv")
async def export_attendance_csv(
    studentId: Optional[str] = Query(None),
    rollNumber: Optional[str] = Query(None),
    className: Optional[str] = Query(None),
    section: Optional[str] = Query(None),
    subject: Optional[str] = Query(None),
    startDate: Optional[str] = Query(None),
    endDate: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    records = await query_attendance_records(
        student_id=studentId,
        roll_number=rollNumber,
        class_name=className,
        section=section,
        subject=subject,
        start_date=startDate,
        end_date=endDate,
        status_filter=status
    )

    csv_data = await attendance_service.export_csv(records)
    filename = f"attendance_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/attendance/pdf")
async def export_attendance_pdf(
    studentId: Optional[str] = Query(None),
    rollNumber: Optional[str] = Query(None),
    className: Optional[str] = Query(None),
    section: Optional[str] = Query(None),
    subject: Optional[str] = Query(None),
    startDate: Optional[str] = Query(None),
    endDate: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    records = await query_attendance_records(
        student_id=studentId,
        roll_number=rollNumber,
        class_name=className,
        section=section,
        subject=subject,
        start_date=startDate,
        end_date=endDate,
        status_filter=status
    )

    pdf_bytes = await attendance_service.export_pdf(records, title="Class Attendance Official Report")
    filename = f"attendance_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
