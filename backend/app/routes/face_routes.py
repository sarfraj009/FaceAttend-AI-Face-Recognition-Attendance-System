from fastapi import APIRouter, HTTPException, status, Depends
from bson import ObjectId
from typing import List, Dict, Any, Optional
from datetime import datetime
from app.schemas.student import FaceRegisterRequest, FaceRecognizeRequest
from app.utils.database import get_database
from app.utils.config import settings
from app.services.face_service import face_service
from app.services.attendance_service import attendance_service
from app.middleware.auth import get_current_user, require_teacher

router = APIRouter(prefix="/face", tags=["Face Recognition"])

@router.post("/register")
async def register_student_face(
    payload: FaceRegisterRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Capture and extract face embeddings for a student from multi-angle images or single frame.
    Teachers and Admins can enroll any student; students can enroll their own profile.
    """
    db = get_database()
    try:
        oid = ObjectId(payload.studentId)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid student ID.")

    student = await db.students.find_one({"_id": oid})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")

    # Permissions check: students can only update their own biometric data
    if current_user.get("role") == "student":
        user_matches = (
            student.get("userId") == current_user.get("id") or
            student.get("email", "").lower() == current_user.get("email", "").lower()
        )
        if not user_matches:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Students can only register biometrics for their own profile."
            )

    if not payload.images or len(payload.images) == 0:
        raise HTTPException(status_code=400, detail="No face images provided.")

    extracted_embeddings = []
    first_valid_image = None
    processed_count = 0
    failed_angles = []

    for idx, img_b64 in enumerate(payload.images):
        img = face_service.decode_base64_image(img_b64)
        if img is None:
            failed_angles.append(f"Image #{idx+1} could not be decoded")
            continue

        faces = face_service.detect_faces(img)
        if not faces:
            failed_angles.append(f"Image #{idx+1}: No face detected")
            continue

        # Take largest detected face
        best_face = max(faces, key=lambda f: f["bbox"][2] * f["bbox"][3])
        embedding = face_service.extract_embedding(img, best_face["raw_face"])
        if embedding is not None and len(embedding) > 0:
            extracted_embeddings.append(embedding)
            processed_count += 1
            if first_valid_image is None:
                first_valid_image = img_b64

    if not extracted_embeddings:
        raise HTTPException(
            status_code=400,
            detail=f"Face registration failed: No clear faces could be detected in the provided images. {', '.join(failed_angles)}"
        )

    # Retrieve existing embeddings and append (up to 15 diverse angles max)
    existing_embeddings = student.get("faceEmbeddings", [])
    updated_embeddings = existing_embeddings + extracted_embeddings
    if len(updated_embeddings) > 15:
        updated_embeddings = updated_embeddings[-15:]

    update_doc = {"faceEmbeddings": updated_embeddings}
    if not student.get("profileImage") and first_valid_image:
        update_doc["profileImage"] = first_valid_image

    await db.students.update_one({"_id": oid}, {"$set": update_doc})

    return {
        "success": True,
        "message": f"Successfully registered {processed_count} face angle sample(s) for {student.get('name')}.",
        "totalSamples": len(updated_embeddings),
        "failedCount": len(failed_angles),
        "warnings": failed_angles if failed_angles else None
    }

@router.post("/recognize")
async def recognize_face(
    payload: FaceRecognizeRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Real-time face recognition endpoint.
    Processes camera frame, detects faces, aligns, extracts embeddings, compares with registered students,
    and automatically marks attendance (with anti-duplicate check & cooldown) if sessionId is provided.
    """
    img = face_service.decode_base64_image(payload.image)
    if img is None:
        raise HTTPException(status_code=400, detail="Invalid image payload.")

    detected_faces = face_service.detect_faces(img)
    if not detected_faces:
        return {
            "facesDetected": 0,
            "results": [],
            "message": "No face detected in camera view."
        }

    db = get_database()
    # Fetch all students with face data
    registered_cursor = db.students.find({"faceEmbeddings.0": {"$exists": True}})
    registered_students = []
    async for s in registered_cursor:
        registered_students.append({
            "id": str(s["_id"]),
            "name": s.get("name", ""),
            "rollNumber": s.get("rollNumber", ""),
            "course": s.get("course", ""),
            "section": s.get("section", ""),
            "embeddings": s.get("faceEmbeddings", [])
        })

    recognition_results = []

    for face_info in detected_faces:
        bbox = face_info["bbox"]
        embedding = face_service.extract_embedding(img, face_info["raw_face"])
        
        best_student = None
        best_similarity = -1.0

        if embedding is not None and registered_students:
            for student in registered_students:
                for stored_emb in student["embeddings"]:
                    sim = face_service.compute_similarity(embedding, stored_emb)
                    if sim > best_similarity:
                        best_similarity = sim
                        best_student = student

        threshold = settings.FACE_MATCH_THRESHOLD

        if best_student and best_similarity >= threshold:
            confidence = face_service.similarity_to_confidence_percentage(best_similarity, threshold)
            
            res_item = {
                "recognized": True,
                "bbox": bbox,
                "studentId": best_student["id"],
                "studentName": best_student["name"],
                "rollNumber": best_student["rollNumber"],
                "course": best_student["course"],
                "section": best_student["section"],
                "confidence": confidence,
                "similarityScore": round(best_similarity, 3),
                "attendanceStatus": "Present",
                "message": f"Recognized: {best_student['name']} ({best_student['rollNumber']})"
            }

            # Handle automatic attendance marking if sessionId is active
            if payload.sessionId and payload.autoMark:
                # Anti-duplicate & cooldown handling
                student_id = best_student["id"]
                if face_service.is_in_cooldown(student_id, settings.RECOGNITION_COOLDOWN_SECONDS):
                    res_item["attendanceAction"] = "COOLDOWN"
                    res_item["alreadyMarked"] = True
                    res_item["attendanceNote"] = "Student recently scanned (cooldown active)."
                else:
                    mark_res = await attendance_service.mark_attendance(
                        student_id=student_id,
                        session_id=payload.sessionId,
                        confidence=confidence,
                        status="Present"
                    )
                    face_service.set_cooldown(student_id)
                    res_item["attendanceAction"] = "MARKED" if mark_res.get("marked") else "ALREADY_PRESENT"
                    res_item["alreadyMarked"] = mark_res.get("alreadyMarked", False)
                    res_item["markedNow"] = mark_res.get("marked", False)
                    res_item["attendanceMessage"] = mark_res.get("message")
                    res_item["record"] = mark_res.get("record")
            
            recognition_results.append(res_item)
        else:
            # Below threshold or unknown
            unreg_confidence = face_service.similarity_to_confidence_percentage(max(0.0, best_similarity), threshold)
            recognition_results.append({
                "recognized": False,
                "bbox": bbox,
                "studentId": None,
                "studentName": "Unknown Face",
                "rollNumber": "N/A",
                "confidence": unreg_confidence,
                "similarityScore": round(max(0.0, best_similarity), 3),
                "attendanceStatus": "Unknown",
                "message": "Face not recognized. Student not registered in system."
            })

    return {
        "facesDetected": len(detected_faces),
        "results": recognition_results
    }

@router.post("/verify")
async def verify_student(
    studentId: str,
    image: str,
    current_user: dict = Depends(get_current_user)
):
    """1-to-1 face verification."""
    db = get_database()
    try:
        oid = ObjectId(studentId)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid student ID.")

    student = await db.students.find_one({"_id": oid})
    if not student or not student.get("faceEmbeddings"):
        raise HTTPException(status_code=404, detail="Student has no registered face data.")

    img = face_service.decode_base64_image(image)
    if img is None:
        raise HTTPException(status_code=400, detail="Invalid image data.")

    faces = face_service.detect_faces(img)
    if not faces:
        return {"matched": False, "confidence": 0, "message": "No face detected in test image."}

    best_face = max(faces, key=lambda f: f["bbox"][2] * f["bbox"][3])
    query_emb = face_service.extract_embedding(img, best_face["raw_face"])
    if not query_emb:
        return {"matched": False, "confidence": 0, "message": "Could not extract face embedding."}

    highest_sim = max(face_service.compute_similarity(query_emb, e) for e in student["faceEmbeddings"])
    matched = highest_sim >= settings.FACE_MATCH_THRESHOLD
    conf = face_service.similarity_to_confidence_percentage(highest_sim, settings.FACE_MATCH_THRESHOLD)

    return {
        "matched": matched,
        "studentName": student.get("name"),
        "rollNumber": student.get("rollNumber"),
        "confidence": conf,
        "similarity": round(highest_sim, 3),
        "message": f"Verification {'Passed' if matched else 'Failed'}: {conf}% confidence."
    }
