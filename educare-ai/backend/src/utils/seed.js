import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Class from '../models/Class.js';
import Student from '../models/Student.js';
import StudentFeature from '../models/StudentFeature.js';
import { createPredictionForStudent } from '../services/studentPredictionService.js';
import { analyzeRiskFactors } from '../services/riskAnalysisService.js';
import { getRiskLevel, getEstimatedFinalGrade } from '../utils/riskUtils.js';
import Prediction from '../models/Prediction.js';

dotenv.config();

/** Tài khoản hệ thống mặc định – 3 role, dùng cho dev và demo nội bộ. */
const SYSTEM_ACCOUNTS = [
  {
    fullName: 'Nguyễn Văn Hùng',
    email: 'hung.nv@educare.edu.vn',
    password: 'Admin@123',
    role: 'ADMIN',
  },
  {
    fullName: 'Trần Thị Mai',
    email: 'mai.tran@educare.edu.vn',
    password: 'Teacher@123',
    role: 'TEACHER',
  },
  {
    fullName: 'Lê Minh Tuấn',
    email: 'tuan.lm@student.educare.edu.vn',
    password: 'Student@123',
    role: 'STUDENT',
  },
];

async function upsertUser({ fullName, email, password, role }) {
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.findOneAndUpdate(
    { email },
    { fullName, email, passwordHash, role },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return user;
}

async function seedSampleData(teacher, studentUser) {
  let cls = await Class.findOne({ className: 'CS101-A', teacherId: teacher._id });
  if (!cls) {
    cls = await Class.create({
      className: 'CS101-A',
      courseName: 'Nhập môn Khoa học Dữ liệu',
      teacherId: teacher._id,
      semester: 'HK1',
      academicYear: '2025-2026',
    });
    console.log('Created class: CS101-A');
  }

  let student = await Student.findOne({ studentCode: 'SV001', classId: cls._id });
  if (!student) {
    student = await Student.create({
      studentCode: 'SV001',
      fullName: studentUser.fullName,
      classId: cls._id,
      gender: 0,
      age: 20,
      userId: studentUser._id,
    });
    console.log('Created student profile: SV001');
  } else {
    student.userId = studentUser._id;
    student.fullName = studentUser.fullName;
    await student.save();
  }

  const existingPrediction = await Prediction.findOne({ studentId: student._id });
  if (!existingPrediction) {
    const featureDoc = await StudentFeature.create({
      studentId: student._id,
      studyHours: 12,
      attendance: 65,
      assignmentCompletion: 58,
      onlineCourses: 5,
      discussions: 0,
      extracurricular: 1,
      resources: 1,
      internet: 1,
      eduTech: 1,
      learningStyle: 2,
      motivation: 1,
      stressLevel: 2,
      recordedAt: new Date(),
    });

    try {
      await createPredictionForStudent(student, featureDoc);
      console.log('Created sample prediction for SV001 (via ML model)');
    } catch (err) {
      console.warn('ML prediction skipped, using fallback score:', err.message);
      const mlFeatures = {
        StudyHours: 12,
        Attendance: 65,
        AssignmentCompletion: 58,
        OnlineCourses: 5,
        Discussions: 0,
        Extracurricular: 1,
        Resources: 1,
        Internet: 1,
        EduTech: 1,
        Gender: 0,
        Age: 20,
        LearningStyle: 2,
        Motivation: 1,
        StressLevel: 2,
      };
      const risk = analyzeRiskFactors(mlFeatures);
      await Prediction.create({
        studentId: student._id,
        featureRecordId: featureDoc._id,
        predictedScore: 62,
        riskLevel: getRiskLevel(62),
        estimatedFinalGrade: getEstimatedFinalGrade(62),
        ...risk,
        modelVersion: 'seed-fallback',
      });
    }
  }

  return { cls, student };
}

async function seed() {
  await connectDB();

  console.log('\n=== EduCare AI – Tài khoản hệ thống (3 role) ===\n');

  const created = {};
  for (const account of SYSTEM_ACCOUNTS) {
    created[account.role] = await upsertUser(account);
    console.log(`[${account.role}] ${account.email} / ${account.password}`);
  }

  await seedSampleData(created.TEACHER, created.STUDENT);

  console.log('\n=== Đăng nhập tại http://localhost:5173 ===');
  console.log('Admin:   hung.nv@educare.edu.vn / Admin@123');
  console.log('Teacher: mai.tran@educare.edu.vn / Teacher@123');
  console.log('Student: tuan.lm@student.educare.edu.vn / Student@123');
  console.log('\nSeed completed.\n');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
