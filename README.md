# FaceAttend AI — Intelligent Attendance Management System with Face Recognition

[![Python 3.10+](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev)
[![OpenCV](https://img.shields.io/badge/OpenCV-YuNet%20%26%20SFace-5C3EE8?style=flat&logo=opencv&logoColor=white)](https://opencv.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?style=flat&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)

A complete, production-grade **AI-Powered Smart Attendance Management System** that automatically identifies registered students in real-time through camera feeds, generates deep 128-dimensional biometric embeddings, prevents duplicate markings, and provides institutional analytics with PDF and CSV reporting.

---

## 🌟 Key Highlights & System Architecture

```text
Admin/Teacher Login
        ↓
Student Registration (Roll No, Course, Branch, Sec)
        ↓
Face Capture (5-Angle Pose Guidance: Front, Left, Right, Up, Down)
        ↓
OpenCV DNN Face Detection (YuNet 2023Mar)
        ↓
Face Alignment & 128-D L2 Embedding Extraction (SFace 2021Dec)
        ↓
Store Normalized Embeddings in MongoDB
        ↓
Start Attendance Session (Class, Subject, Date, Time)
        ↓
Open Live Webcam Stream with Real-Time HUD Bounding Boxes
        ↓
Real-Time Face Match & Cosine Distance Evaluation
        ↓
Anti-Duplicate Verification (StudentId + SessionId + Cooldown)
        ↓
Instant Attendance Marking (Student, Roll No, Time, Date, Confidence %)
        ↓
Interactive Recharts Analytics & One-Click PDF/CSV Report Generation
```

---

## 👥 Three Role-Based Portals

### 1. 🛡️ Administrator Portal
* **Dashboard Command Center**: High-level KPIs (Total Students, Faculty, Classes, Today's Attendance, Average Attendance %).
* **Interactive Visualizations**: Daily attendance trend AreaChart, subject-wise BarChart, classroom attendance ratio PieChart.
* **Student Management**: Full CRUD, search & filter by course/section, trigger multi-angle face enrollment.
* **Biometric Privacy Compliance**: Authorized 1-click erasure of stored biometric face vectors for GDPR compliance.
* **Teacher Management**: Faculty directory, credentials, and departmental subject allocations.
* **Class & Subject Management**: Configure degree courses, branch divisions, academic years, sections, and subjects.
* **Institutional Reports**: Multi-criteria filtered search, downloadable CSV and official PDF dossiers.

### 2. 🎓 Faculty / Teacher Portal
* **Faculty Dashboard**: Assigned student counts, present/absent counters, Recharts trend graphs (Daily, Weekly, Monthly, Subject-wise, Student-wise distribution).
* **Session Launcher**: Create attendance sessions specifying Class, Subject, Section, Date, and Start Time.
* **Live Camera Interface**:
  - Real-time webcam feed with HUD laser scanline animation.
  - Live bounding boxes: Bright green with confidence % for recognized students, red for unrecognized faces.
  - Active recognition identity card displaying Student Name, Roll No, Confidence %, and Status badge.
  - Real-time audio chime + confetti celebration upon newly marked attendance.
  - Anti-duplicate notification ("Already Marked Today").
  - "Stop Attendance" button with session conclusion summary.
* **Roster Management**: Live list of present vs absent students with teacher manual override capability.

### 3. 👤 Student Portal
* **Personalized Dashboard**: Overall attendance percentage gauge (e.g., 87%), Classes Attended (52), Classes Missed (8), Total Classes (60).
* **Calendar-Style Visualization**: Month-by-month calendar with color-coded day markers (Green for Present, Red for Absent, Blue ring for Today).
* **Attendance History Table**: Searchable, timestamped list of verified scans with subject and match confidence.
* **Biometric Profile**: Student registration info, enrollment card, and camera re-capture face enrollment.

---

## 🧠 Computer Vision & Biometric Pipeline

* **Face Detection**: Official OpenCV DNN **YuNet** (`face_detection_yunet_2023mar.onnx`), providing ultra-fast multi-face detection and 5 facial landmarks (eyes, nose tip, mouth corners) at 100+ FPS with fallback to OpenCV Haar Cascades.
* **Face Alignment & Recognition**: Official OpenCV Zoo **SFace** (`face_recognition_sface_2021dec.onnx`), aligning the detected facial landmarks to extract a 128-dimensional normalized floating-point embedding vector.
* **Similarity & Confidence**: Cosine similarity matching normalized to an intuitive 0% - 99.5% confidence score with configurable threshold (`FACE_MATCH_THRESHOLD = 0.45`).
* **Anti-Duplicate Guarantee**:
  1. **Session-Level Database Lock**: MongoDB compound unique index `(studentId, sessionId)` ensures a student can never be credited twice in the same lecture.
  2. **Camera Frame Cooldown**: An in-memory cooldown cache (`RECOGNITION_COOLDOWN_SECONDS = 10`) stops repeated camera frames from hammering the database while a student stays in frame.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18+ or v22+
- **Python**: 3.10, 3.11, 3.12, 3.13, or 3.14
- **MongoDB**: Running locally at `mongodb://localhost:27017` (or MongoDB Atlas URI)

---

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server
uvicorn app.main:app --reload
```

* API Docs (Swagger UI): **`http://localhost:8000/docs`**
* Health Endpoint: **`http://localhost:8000/api/health`**

---

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install packages
npm install

# Start Vite React server
npm run dev
```

* Frontend Application: **`http://localhost:3000`**

---

## 🔑 Pre-Seeded Demo Accounts (1-Click Login)

The system automatically initializes default demo accounts on first launch. On the login page (`/login`), click the respective 1-click button to autofill credentials:

| Role | Email | Password | Access Level |
|---|---|---|---|
| **Admin** | `admin@faceattend.ai` | `admin123` | Full system control, faculty & student CRUD, biometric wipe |
| **Teacher** | `teacher@faceattend.ai` | `teacher123` | Session creator, camera attendance scanner, reports |
| **Student** | `student@faceattend.ai` | `student123` | Profile, calendar visualization, attendance history |

---

## 📂 Repository Structure

```text
AI-Attendance-System/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AttendanceCalendar.jsx    # Calendar month-view visualization
│   │   │   ├── CameraAttendanceView.jsx  # Live camera HUD & real-time bounding boxes
│   │   │   ├── FaceCaptureModal.jsx      # 5-angle face enrollment modal
│   │   │   ├── StatCard.jsx              # Glowing KPI cards
│   │   │   └── Toast.jsx                 # Notification system
│   │   ├── context/
│   │   │   └── AuthContext.jsx           # JWT state & role helpers
│   │   ├── layouts/
│   │   │   └── MainLayout.jsx            # Responsive sidebar & top navigation
│   │   ├── pages/
│   │   │   ├── Home.jsx                  # Public landing showcase
│   │   │   ├── Login.jsx                 # Sign in with 1-click quick-fill
│   │   │   ├── Register.jsx              # Account creation
│   │   │   ├── AdminDashboard.jsx        # Admin command center & analytics
│   │   │   ├── TeacherDashboard.jsx      # Teacher analytics & session launcher
│   │   │   ├── StudentDashboard.jsx      # Student summary, calendar & records
│   │   │   ├── StudentProfile.jsx        # Student profile & biometric manager
│   │   │   ├── ManageStudents.jsx        # Student CRUD & camera enrollment
│   │   │   ├── ManageTeachers.jsx        # Faculty directory & credentials
│   │   │   ├── ManageClasses.jsx         # Course, branch & section management
│   │   │   ├── StartAttendance.jsx       # Session configuration form
│   │   │   ├── AttendanceSession.jsx     # Live room with camera & roster
│   │   │   └── AttendanceReports.jsx     # Filters with CSV & PDF export
│   │   ├── services/
│   │   │   └── api.js                    # Axios instance with interceptors
│   │   ├── App.jsx                       # Protected route routes tree
│   │   ├── index.css                     # Tailwind v4, animations & glassmorphism
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── app/
│   │   ├── middleware/
│   │   │   └── auth.py                   # JWT validation & role checker
│   │   ├── models_weights/
│   │   │   ├── face_detection_yunet_2023mar.onnx
│   │   │   └── face_recognition_sface_2021dec.onnx
│   │   ├── routes/
│   │   │   ├── auth_routes.py            # /api/auth/*
│   │   │   ├── student_routes.py         # /api/students/*
│   │   │   ├── teacher_routes.py         # /api/teachers/*
│   │   │   ├── class_routes.py           # /api/classes/*
│   │   │   ├── face_routes.py            # /api/face/*
│   │   │   ├── attendance_routes.py      # /api/attendance/*
│   │   │   └── report_routes.py          # /api/reports/*
│   │   ├── schemas/                      # Pydantic request/response schemas
│   │   ├── services/
│   │   │   ├── face_service.py           # Computer vision & embedding engine
│   │   │   └── attendance_service.py     # Attendance, analytics, CSV & PDF
│   │   ├── utils/
│   │   │   ├── config.py                 # Environment settings
│   │   │   ├── database.py               # Motor MongoDB async client
│   │   │   └── security.py               # Bcrypt password hashing & JWT
│   │   └── main.py                       # FastAPI entrypoint
│   ├── requirements.txt
│   ├── test_system.py                    # Automated test suite
│   ├── .env
│   └── .env.example
│
├── README.md
└── .env.example
```

---

## 🔒 Security & Privacy Practices

1. **Biometric Storage**: Only 128-D mathematical feature vectors are persisted; raw camera images are discarded after embedding generation.
2. **Right to Erasure**: Authorized administrators can delete a student's biometric embeddings anytime via the `DELETE /api/students/:id/face` API.
3. **Password Security**: Passwords are encrypted with `bcrypt` (12 rounds) and never stored in plain text.
4. **JWT Expiration & Authorization**: Role-based access control enforces least privilege across Admin, Teacher, and Student routes.

---

## 🧪 Testing

To run the automated test suite covering auth, face embeddings, anti-duplicate protection, and PDF generation:

```bash
cd backend
python test_system.py
```

Output:
```text
=== STARTING AI ATTENDANCE SYSTEM TESTS ===
[PASS] Auth Security tests passed.
[PASS] Face embedding vector generated, dimensions: 128
[PASS] Face detection & recognition calculations passed.
[PASS] Anti-duplicate verification successfully blocked repeated attendance mark!
[PASS] CSV export generation verified.
[PASS] PDF export generation verified (valid PDF header).
=== ALL TEST SUITES PASSED SUCCESSFULLY (100%) ===
```

---

## 📜 License
This project is licensed under the MIT License — open for academic, institutional, and enterprise utilization.
