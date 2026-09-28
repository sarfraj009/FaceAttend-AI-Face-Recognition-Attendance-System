from fastapi import APIRouter, HTTPException, status, Depends
from bson import ObjectId
from datetime import datetime
from app.schemas.auth import UserLogin, UserRegister, UserResponse, TokenResponse, PasswordChangeRequest
from app.utils.database import get_database
from app.utils.security import verify_password, hash_password, create_access_token
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse)
async def register(payload: UserRegister):
    db = get_database()
    
    # Check if user already exists
    existing = await db.users.find_one({"email": payload.email.lower()})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists."
        )

    hashed_pw = hash_password(payload.password)
    user_doc = {
        "name": payload.name,
        "email": payload.email.lower(),
        "password": hashed_pw,
        "role": payload.role,
        "createdAt": datetime.now()
    }
    
    res = await db.users.insert_one(user_doc)
    user_id = str(res.inserted_id)

    # If registered as teacher or student, also link empty profile
    teacher_id = None
    student_id = None
    if payload.role == "teacher":
        t_res = await db.teachers.insert_one({
            "userId": user_id,
            "name": payload.name,
            "email": payload.email.lower(),
            "subject": "General",
            "department": "Computer Science",
            "createdAt": datetime.now()
        })
        teacher_id = str(t_res.inserted_id)
        await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"teacherId": teacher_id}})
    elif payload.role == "student":
        s_res = await db.students.insert_one({
            "userId": user_id,
            "name": payload.name,
            "rollNumber": f"STU{datetime.now().strftime('%m%d%H%M')}",
            "enrollmentNumber": f"EN{datetime.now().strftime('%y%m%d%H%M')}",
            "email": payload.email.lower(),
            "phone": "",
            "course": "B.Tech CSE",
            "branch": "Computer Science",
            "year": "1st Year",
            "section": "CSE-A",
            "profileImage": "",
            "faceEmbeddings": [],
            "createdAt": datetime.now()
        })
        student_id = str(s_res.inserted_id)
        await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"studentId": student_id}})

    # Generate token
    token = create_access_token({"sub": user_id, "role": payload.role})
    
    user_resp = UserResponse(
        id=user_id,
        name=payload.name,
        email=payload.email.lower(),
        role=payload.role,
        studentId=student_id,
        teacherId=teacher_id
    )
    
    return TokenResponse(access_token=token, user=user_resp)

@router.post("/login", response_model=TokenResponse)
async def login(payload: UserLogin):
    db = get_database()
    user = await db.users.find_one({"email": payload.email.lower()})
    
    if not user or not verify_password(payload.password, user.get("password", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    user_id = str(user["_id"])
    role = user.get("role", "student")
    
    # Check if studentId or teacherId is present or need to lookup
    student_id = user.get("studentId")
    teacher_id = user.get("teacherId")
    
    if role == "student" and not student_id:
        st = await db.students.find_one({"$or": [{"userId": user_id}, {"email": user["email"]}]})
        if st:
            student_id = str(st["_id"])
    elif role == "teacher" and not teacher_id:
        tc = await db.teachers.find_one({"$or": [{"userId": user_id}, {"email": user["email"]}]})
        if tc:
            teacher_id = str(tc["_id"])

    token = create_access_token({"sub": user_id, "role": role})

    user_resp = UserResponse(
        id=user_id,
        name=user.get("name", ""),
        email=user.get("email", ""),
        role=role,
        studentId=student_id,
        teacherId=teacher_id
    )

    return TokenResponse(access_token=token, user=user_resp)

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    db = get_database()
    student_id = current_user.get("studentId")
    teacher_id = current_user.get("teacherId")
    
    if current_user.get("role") == "student" and not student_id:
        st = await db.students.find_one({"$or": [{"userId": current_user["id"]}, {"email": current_user["email"]}]})
        if st:
            student_id = str(st["_id"])
    elif current_user.get("role") == "teacher" and not teacher_id:
        tc = await db.teachers.find_one({"$or": [{"userId": current_user["id"]}, {"email": current_user["email"]}]})
        if tc:
            teacher_id = str(tc["_id"])
            
    return UserResponse(
        id=current_user["id"],
        name=current_user["name"],
        email=current_user["email"],
        role=current_user["role"],
        studentId=student_id,
        teacherId=teacher_id
    )

@router.post("/change-password")
async def change_password(
    payload: PasswordChangeRequest,
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    user = await db.users.find_one({"_id": ObjectId(current_user["id"])})

    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    if not verify_password(payload.currentPassword, user.get("password", "")):
        raise HTTPException(status_code=400, detail="Current password is incorrect.")

    if len(payload.newPassword.strip()) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters long.")

    await db.users.update_one(
        {"_id": ObjectId(current_user["id"])},
        {"$set": {"password": hash_password(payload.newPassword)}}
    )

    return {"success": True, "message": "Password changed successfully."}
