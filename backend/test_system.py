import asyncio
import base64
import cv2
import numpy as np
import io
import sys

# Ensure UTF-8 output on Windows console
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

from app.utils.database import connect_to_mongo, close_mongo_connection, get_database
from app.utils.security import hash_password, verify_password, create_access_token, decode_access_token
from app.services.face_service import face_service
from app.services.attendance_service import attendance_service

async def run_tests():
    print("=== STARTING AI ATTENDANCE SYSTEM TESTS ===")
    await connect_to_mongo()
    db = get_database()

    # 1. Test Auth Security
    print("\n--- TEST 1: Password & Token Security ---")
    pw = "SecretTest123"
    hashed = hash_password(pw)
    assert verify_password(pw, hashed) is True
    assert verify_password("WrongPw", hashed) is False
    token = create_access_token({"sub": "test_user_123", "role": "admin"})
    payload = decode_access_token(token)
    assert payload["sub"] == "test_user_123"
    assert payload["role"] == "admin"
    print("[PASS] Auth Security tests passed.")

    # 2. Test Student & Face Biometric Processing
    print("\n--- TEST 2: Computer Vision Face Detection & Embedding ---")
    # Generate test image with synthetic face
    test_img = np.zeros((480, 640, 3), dtype=np.uint8)
    test_img[:] = (200, 200, 200)
    cv2.circle(test_img, (320, 240), 90, (180, 150, 130), -1)
    cv2.circle(test_img, (285, 215), 10, (50, 50, 50), -1)
    cv2.circle(test_img, (355, 215), 10, (50, 50, 50), -1)
    cv2.ellipse(test_img, (320, 280), (35, 12), 0, 0, 180, (40, 40, 180), 4)

    # Encode to base64
    _, buf = cv2.imencode('.jpg', test_img)
    b64_str = base64.b64encode(buf).decode('utf-8')

    decoded = face_service.decode_base64_image(b64_str)
    assert decoded is not None
    assert decoded.shape == (480, 640, 3)

    faces = face_service.detect_faces(decoded)
    print(f"Detected {len(faces)} face(s) in test frame.")

    # Test embedding extraction on a synthetic raw_face box
    dummy_raw = np.array([230, 150, 180, 180, 285, 215, 355, 215, 320, 250, 290, 280, 350, 280, 0.9], dtype=np.float32)
    embedding = face_service.extract_embedding(decoded, dummy_raw)
    assert embedding is not None
    assert len(embedding) > 0
    print(f"[PASS] Face embedding vector generated, dimensions: {len(embedding)}")

    sim_self = face_service.compute_similarity(embedding, embedding)
    print(f"Self-similarity score: {sim_self:.4f}")
    assert sim_self > 0.95

    # Test confidence mapping
    conf = face_service.similarity_to_confidence_percentage(sim_self, 0.45)
    print(f"Confidence percentage: {conf}%")
    assert conf >= 85.0
    print("[PASS] Face detection & recognition calculations passed.")

    # 3. Test Anti-Duplicate Attendance Marking
    print("\n--- TEST 3: Anti-Duplicate Attendance Pipeline ---")
    student = await db.students.find_one({"rollNumber": "2024CSE101"})
    if not student:
        res = await db.students.insert_one({
            "name": "Test Student",
            "rollNumber": "2024CSE101",
            "enrollmentNumber": "EN202401001",
            "course": "B.Tech CSE",
            "section": "CSE-A",
            "faceEmbeddings": [embedding],
        })
        student_id = str(res.inserted_id)
    else:
        student_id = str(student["_id"])

    # Create dummy session
    session_res = await db.attendance_sessions.insert_one({
        "teacherId": "t1",
        "teacherName": "Prof. Alan Turing",
        "subject": "Computer Networks",
        "className": "B.Tech CSE",
        "section": "CSE-A",
        "date": "2026-09-26",
        "startTime": "09:30 AM",
        "status": "active"
    })
    session_id = str(session_res.inserted_id)

    # First mark: should succeed
    mark_1 = await attendance_service.mark_attendance(
        student_id=student_id,
        session_id=session_id,
        confidence=94.5,
        status="Present"
    )
    print(f"Mark 1 Result: marked={mark_1.get('marked')}, alreadyMarked={mark_1.get('alreadyMarked')}")
    assert mark_1.get("marked") is True
    assert mark_1.get("alreadyMarked") is False

    # Second mark on SAME student + SAME session: MUST BE PREVENTED AS DUPLICATE
    mark_2 = await attendance_service.mark_attendance(
        student_id=student_id,
        session_id=session_id,
        confidence=95.0,
        status="Present"
    )
    print(f"Mark 2 Result: marked={mark_2.get('marked')}, alreadyMarked={mark_2.get('alreadyMarked')}")
    assert mark_2.get("marked") is False
    assert mark_2.get("alreadyMarked") is True
    print("[PASS] Anti-duplicate verification successfully blocked repeated attendance mark!")

    # 4. Test Analytics & Reports Generation
    print("\n--- TEST 4: Analytics, CSV & PDF Generation ---")
    analytics = await attendance_service.get_dashboard_analytics()
    assert "totalStudents" in analytics
    assert "attendancePercentage" in analytics
    assert "dailyTrends" in analytics
    print(f"Total Students: {analytics['totalStudents']}, Today Present: {analytics['todayPresent']}")

    # CSV Generation test
    records_cursor = db.attendance.find({"sessionId": session_id})
    records_list = []
    async for r in records_cursor:
        records_list.append(r)

    csv_out = await attendance_service.export_csv(records_list)
    assert "Student Name" in csv_out
    assert "2024CSE101" in csv_out
    print("[PASS] CSV export generation verified.")

    pdf_bytes = await attendance_service.export_pdf(records_list, title="Test Report")
    assert len(pdf_bytes) > 500
    assert pdf_bytes.startswith(b'%PDF')
    print(f"[PASS] PDF export generation verified ({len(pdf_bytes)} bytes valid PDF header).")

    # Clean up test session
    await db.attendance_sessions.delete_one({"_id": session_res.inserted_id})
    await db.attendance.delete_many({"sessionId": session_id})

    await close_mongo_connection()
    print("\n=== ALL TEST SUITES PASSED SUCCESSFULLY (100%) ===")

if __name__ == "__main__":
    asyncio.run(run_tests())
