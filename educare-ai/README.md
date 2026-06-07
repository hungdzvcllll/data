# EduCare AI – Student Learning Risk & Intervention System

Nền tảng **cảnh báo sớm nguy cơ học tập** và **hỗ trợ can thiệp** cho giảng viên/cố vấn học tập, tích hợp mô hình ML dự đoán `ExamScore` (XGBRegressor).

## Kiến trúc tổng quan

```
React (Vite + Tailwind)  ←→  Express API + MongoDB  ←→  Python predict.py + joblib model
```

| Layer | Công nghệ |
|-------|-----------|
| Frontend | React, Vite, Tailwind CSS, React Router, Axios, Recharts |
| Backend | Node.js, Express, MongoDB, Mongoose, JWT, Multer, bcrypt |
| ML | Python, pandas, joblib, XGBoost (model đã train) |

## Luồng chính

1. Teacher đăng nhập → tạo/chọn lớp
2. Upload CSV/Excel → validate → preview
3. Run Prediction → Node gọi `predict.py` qua `child_process`
4. Python load `student_examscore_model.joblib` → trả `predictedScore`
5. Node tính `riskLevel`, phân tích risk factors → lưu MongoDB
6. Dashboard & danh sách rủi ro → tạo intervention notes

## Risk Level Mapping

| Điểm dự đoán | Mã | Tiếng Việt |
|--------------|-----|------------|
| ≥ 85 | EXCELLENT | Rất tốt |
| 70 – 84 | STABLE | Ổn định |
| 55 – 69 | AT_RISK | Cần theo dõi |
| < 55 | HIGH_RISK | Nguy cơ cao |

## Yêu cầu hệ thống

- Node.js 18+
- MongoDB 6+
- Python 3.10+ với packages trong `backend/ml/requirements.txt`

## Cài đặt

### 1. MongoDB

Chạy MongoDB local tại `mongodb://127.0.0.1:27017`

### 2. Backend

```bash
cd educare-ai/backend
cp .env.example .env
npm install
pip install -r ml/requirements.txt
npm run seed
npm run dev
```

API: http://localhost:5000

**Tài khoản hệ thống (chạy `npm run seed`):**

| Vai trò | Email | Mật khẩu |
|---------|-------|----------|
| ADMIN | hung.nv@educare.edu.vn | Admin@123 |
| TEACHER | mai.tran@educare.edu.vn | Teacher@123 |
| STUDENT | tuan.lm@student.educare.edu.vn | Student@123 |

Seed cũng tạo lớp mẫu CS101-A, sinh viên SV001 (liên kết tài khoản Student) và một bản dự đoán ML.

### 3. Frontend

```bash
cd educare-ai/frontend
npm install
npm run dev
```

UI: http://localhost:5173

## Upload CSV mẫu

Dùng file `sample_data/student_upload_template.csv`. Cột **Email** là tuỳ chọn.

### Tự động tạo tài khoản sinh viên (sau Run Prediction)

| Trường | Quy tắc |
|--------|---------|
| **Email** | Cột `Email` trong CSV; nếu trống → `{studentid}@student.educare.edu.vn` |
| **Mật khẩu** | `{StudentID}@Educare` (vd. `SV002@Educare`) |
| **Cấu hình** | `.env`: `STUDENT_DEFAULT_PASSWORD_PATTERN`, `STUDENT_EMAIL_DOMAIN` |

Giáo viên xem bảng email/mật khẩu ngay sau **Run Prediction + Tạo tài khoản** trên trang Upload.
Sinh viên đăng nhập cùng trang Login → redirect `/portal`.

Cột bắt buộc (ngoài Email):

```
StudentID, Name, Class, StudyHours, Attendance, AssignmentCompletion,
OnlineCourses, Discussions, Extracurricular, Resources, Internet,
EduTech, Gender, Age, LearningStyle, Motivation, StressLevel
```

## Cấu trúc thư mục

```
educare-ai/
├── frontend/          # React UI
├── backend/
│   ├── src/           # Express API
│   └── ml/
│       ├── predict.py
│       ├── preprocessing.py
│       └── student_examscore_model.joblib
├── sample_data/
└── README.md
```

## REST API (tóm tắt)

| Nhóm | Endpoints |
|------|-----------|
| Auth | POST `/api/auth/login`, `/register`, GET `/api/auth/me` |
| Classes | CRUD `/api/classes` |
| Students | CRUD `/api/students`, GET `/api/students/risk-list` |
| Upload | POST `/api/uploads/class-data`, POST `/:uploadId/run-prediction` |
| Predictions | GET `/api/predictions/class/:classId`, `/student/:studentId` |
| Dashboard | GET `/api/dashboard/teacher`, `/class/:classId` |
| Interventions | CRUD `/api/interventions` |

## Dataset ML

Model huấn luyện từ [Student Performance and Learning Style (Kaggle)](https://www.kaggle.com/datasets/adilshamim8/student-performance-and-learning-style).

14 features đầu vào (không dùng ExamScore/FinalGrade):

`StudyHours, Attendance, Resources, Extracurricular, Motivation, Internet, Gender, Age, LearningStyle, OnlineCourses, Discussions, AssignmentCompletion, EduTech, StressLevel`

## Python prediction (stdin/stdout)

**Single:**
```json
{"features": {"StudyHours": 20, "Attendance": 85, ...}}
```

**Response:**
```json
{"predictedScore": 78.5}
```

**Batch:**
```json
{"batch": [{"studentCode": "SV001", "features": {...}}]}
```

## Ghi chú triển khai

- Node **không** load `.joblib` trực tiếp — luôn gọi `predict.py`.
- Trên Windows, set `PYTHON_PATH=python` trong `.env`.
- Trên Linux/Mac có thể dùng `python3`.

## License

Educational / demo project.
