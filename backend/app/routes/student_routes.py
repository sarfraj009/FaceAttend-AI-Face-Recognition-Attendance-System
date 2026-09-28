from fastapi import APIRouter, HTTPException, status, Depends, Query
from bson import ObjectId
from datetime import datetime
from typing import List, Optional
from app.schemas.student import StudentCreate, StudentUpdate, StudentResponse
from app.utils.database import get_database
from app.middleware.auth import get_current_user, require_teacher, require_admin

router = APIRouter(prefix="/students", tags=["Students"])

def student_doc_to_response(doc: dict) -> StudentResponse:
    face_embeddings = doc.get("faceEmbeddings", [])
    created_at = doc.get("createdAt")
    created_str = created_at.strftime("%Y-%m-%d %H:%M") if isinstance(created_at, datetime) else str(created_at) if created_at else None
    
    return StudentResponse(
        id=str(doc["_id"]),
        name=doc.get("name", ""),
        rollNumber=doc.get("rollNumber", ""),
        enrollmentNumber=doc.get("enrollmentNumber", ""),
        email=doc.get("email", ""),
        phone=doc.get("phone", ""),
        course=doc.get("course", ""),
        branch=doc.get("branch", ""),
        year=doc.get("year", ""),
        section=doc.get("section", ""),
        profileImage=doc.get("profileImage", ""),
        hasFaceData=len(face_embeddings) > 0,
        faceSamplesCount=len(face_embeddings),
        createdAt=created_str
    )

@router.get("", response_model=List[StudentResponse])
async def get_students(
    search: Optional[str] = Query(None),
    course: Optional[str] = Query(None),
    section: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    query = {}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"rollNumber": {"$regex": search, "$options": "i"}},
            {"enrollmentNumber": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
        ]
    if course:
        query["course"] = course
    if section:
        query["section"] = section

    cursor = db.students.find(query).sort("rollNumber", 1)
    students = []
    async for doc in cursor:
        students.append(student_doc_to_response(doc))
    return students

@router.get("/{student_id}", response_model=StudentResponse)
async def get_student(student_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    try:
        doc = await db.students.find_one({"_id": ObjectId(student_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid student ID format.")
        
    if not doc:
        raise HTTPException(status_code=404, detail="Student not found.")
        
    return student_doc_to_response(doc)

@router.post("", response_model=StudentResponse)
async def create_student(
    payload: StudentCreate,
    current_user: dict = Depends(require_teacher)
):
    db = get_database()
    # Check duplicate roll number
    existing_roll = await db.students.find_one({"rollNumber": payload.rollNumber})
    if existing_roll:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Student with Roll Number '{payload.rollNumber}' already exists."
        )

    doc = payload.model_dump()
    doc["faceEmbeddings"] = []
    doc["createdAt"] = datetime.now()

    res = await db.students.insert_one(doc)
    doc["_id"] = res.inserted_id
    return student_doc_to_response(doc)

@router.put("/{student_id}", response_model=StudentResponse)
async def update_student(
    student_id: str,
    payload: StudentUpdate,
    current_user: dict = Depends(require_teacher)
):
    db = get_database()
    try:
        oid = ObjectId(student_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid student ID.")

    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update.")

    # Check roll number uniqueness if changed
    if "rollNumber" in update_data:
        conflict = await db.students.find_one({"rollNumber": update_data["rollNumber"], "_id": {"$ne": oid}})
        if conflict:
            raise HTTPException(status_code=400, detail="Roll number already assigned to another student.")

    await db.students.update_one({"_id": oid}, {"$set": update_data})
    updated = await db.students.find_one({"_id": oid})
    return student_doc_to_response(updated)

@router.delete("/{student_id}")
async def delete_student(
    student_id: str,
    current_user: dict = Depends(require_admin)
):
    db = get_database()
    try:
        oid = ObjectId(student_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid student ID.")

    # Delete student and associated attendance
    res = await db.students.delete_one({"_id": oid})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Student not found.")
        
    await db.attendance.delete_many({"studentId": student_id})
    return {"success": True, "message": "Student and attendance records deleted successfully."}

@router.delete("/{student_id}/face")
async def delete_student_biometrics(
    student_id: str,
    current_user: dict = Depends(require_admin)
):
    """Delete face biometric data for privacy & GDPR compliance."""
    db = get_database()
    try:
        oid = ObjectId(student_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid student ID.")

    await db.students.update_one({"_id": oid}, {"$set": {"faceEmbeddings": []}})
    return {"success": True, "message": "Biometric face embeddings erased safely."}
