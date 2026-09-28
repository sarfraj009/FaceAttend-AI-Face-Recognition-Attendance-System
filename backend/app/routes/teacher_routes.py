from fastapi import APIRouter, HTTPException, status, Depends
from bson import ObjectId
from datetime import datetime
from typing import List
from app.schemas.teacher import TeacherCreate, TeacherUpdate, TeacherResponse
from app.utils.database import get_database
from app.utils.security import hash_password
from app.middleware.auth import require_admin, get_current_user

router = APIRouter(prefix="/teachers", tags=["Teachers"])

def teacher_doc_to_response(doc: dict) -> TeacherResponse:
    created_at = doc.get("createdAt")
    created_str = created_at.strftime("%Y-%m-%d %H:%M") if isinstance(created_at, datetime) else str(created_at) if created_at else None
    return TeacherResponse(
        id=str(doc["_id"]),
        name=doc.get("name", ""),
        email=doc.get("email", ""),
        subject=doc.get("subject", ""),
        department=doc.get("department", ""),
        createdAt=created_str
    )

@router.get("", response_model=List[TeacherResponse])
async def get_teachers(current_user: dict = Depends(get_current_user)):
    db = get_database()
    cursor = db.teachers.find().sort("name", 1)
    teachers = []
    async for doc in cursor:
        teachers.append(teacher_doc_to_response(doc))
    return teachers

@router.post("", response_model=TeacherResponse)
async def create_teacher(payload: TeacherCreate, current_user: dict = Depends(require_admin)):
    db = get_database()
    existing = await db.teachers.find_one({"email": payload.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Teacher with this email already exists.")

    hashed = hash_password(payload.password)
    # Create user account for login
    user_res = await db.users.insert_one({
        "name": payload.name,
        "email": payload.email.lower(),
        "password": hashed,
        "role": "teacher",
        "createdAt": datetime.now()
    })

    teacher_doc = {
        "userId": str(user_res.inserted_id),
        "name": payload.name,
        "email": payload.email.lower(),
        "subject": payload.subject,
        "department": payload.department,
        "createdAt": datetime.now()
    }
    t_res = await db.teachers.insert_one(teacher_doc)
    teacher_id = str(t_res.inserted_id)

    await db.users.update_one({"_id": user_res.inserted_id}, {"$set": {"teacherId": teacher_id}})
    teacher_doc["_id"] = t_res.inserted_id
    return teacher_doc_to_response(teacher_doc)

@router.put("/{teacher_id}", response_model=TeacherResponse)
async def update_teacher(
    teacher_id: str,
    payload: TeacherUpdate,
    current_user: dict = Depends(require_admin)
):
    db = get_database()
    try:
        oid = ObjectId(teacher_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid teacher ID.")

    teacher = await db.teachers.find_one({"_id": oid})
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found.")

    update_fields = {}
    if payload.name: update_fields["name"] = payload.name
    if payload.subject: update_fields["subject"] = payload.subject
    if payload.department: update_fields["department"] = payload.department
    if payload.email: update_fields["email"] = payload.email.lower()

    if update_fields:
        await db.teachers.update_one({"_id": oid}, {"$set": update_fields})
        user_id = teacher.get("userId")
        if user_id:
            user_update = {k: v for k, v in update_fields.items() if k in ["name", "email"]}
            if payload.password:
                user_update["password"] = hash_password(payload.password)
            if user_update:
                await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": user_update})

    updated = await db.teachers.find_one({"_id": oid})
    return teacher_doc_to_response(updated)

@router.delete("/{teacher_id}")
async def delete_teacher(teacher_id: str, current_user: dict = Depends(require_admin)):
    db = get_database()
    try:
        oid = ObjectId(teacher_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid teacher ID.")

    teacher = await db.teachers.find_one({"_id": oid})
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found.")

    user_id = teacher.get("userId")
    if user_id:
        await db.users.delete_one({"_id": ObjectId(user_id)})

    await db.teachers.delete_one({"_id": oid})
    return {"success": True, "message": "Teacher removed successfully."}
