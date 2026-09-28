from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from typing import List
from app.schemas.classes import ClassItem, ClassResponse
from app.utils.database import get_database
from app.middleware.auth import get_current_user, require_admin

router = APIRouter(prefix="/classes", tags=["Classes"])

@router.get("", response_model=List[ClassResponse])
async def get_classes(current_user: dict = Depends(get_current_user)):
    db = get_database()
    cursor = db.classes.find()
    res = []
    async for c in cursor:
        res.append(ClassResponse(
            id=str(c["_id"]),
            course=c.get("course", ""),
            branch=c.get("branch", ""),
            year=c.get("year", ""),
            section=c.get("section", ""),
            subject=c.get("subject", "")
        ))
    return res

@router.post("", response_model=ClassResponse)
async def create_class(payload: ClassItem, current_user: dict = Depends(require_admin)):
    db = get_database()
    doc = payload.model_dump()
    res = await db.classes.insert_one(doc)
    return ClassResponse(
        id=str(res.inserted_id),
        course=doc["course"],
        branch=doc["branch"],
        year=doc["year"],
        section=doc["section"],
        subject=doc["subject"]
    )

@router.delete("/{class_id}")
async def delete_class(class_id: str, current_user: dict = Depends(require_admin)):
    db = get_database()
    try:
        oid = ObjectId(class_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID.")
    res = await db.classes.delete_one({"_id": oid})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Class not found.")
    return {"success": True, "message": "Class deleted successfully."}
