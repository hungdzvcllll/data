import Student from '../models/Student.js';
import Class from '../models/Class.js';
import Prediction from '../models/Prediction.js';
import StudentFeature from '../models/StudentFeature.js';
import { AppError, asyncHandler } from '../middlewares/errorHandler.js';
import { getLatestPrediction, getPredictionHistory } from '../services/studentPredictionService.js';
import { RISK_LABELS_VI } from '../utils/riskUtils.js';
import {
  getComputedFeaturesForStudent,
  getLearningBehavior,
} from '../services/learningBehaviorService.js';
import { getBehaviorSummary } from '../services/behaviorFeatureService.js';
import { featureDocToMl } from '../utils/featureColumns.js';

async function assertClassAccess(user, classId) {
  const cls = await Class.findById(classId);
  if (!cls) throw new AppError('Không tìm thấy lớp học', 404);
  if (user.role === 'TEACHER' && cls.teacherId.toString() !== user._id.toString()) {
    throw new AppError('Forbidden', 403);
  }
  return cls;
}

async function assertStudentAccess(user, student) {
  if (user.role === 'STUDENT') {
    if (!student.userId || student.userId.toString() !== user._id.toString()) {
      throw new AppError('Forbidden', 403);
    }
    return;
  }
  await assertClassAccess(user, student.classId._id || student.classId);
}

export const listStudents = asyncHandler(async (req, res) => {
  let filter = {};
  if (req.query.classId) filter.classId = req.query.classId;
  if (req.user.role === 'TEACHER') {
    const classes = await Class.find({ teacherId: req.user._id });
    filter.classId = { $in: classes.map((c) => c._id) };
  }

  const students = await Student.find(filter).populate('classId', 'className courseName').sort({ studentCode: 1 });
  res.json({ students });
});

export const createStudent = asyncHandler(async (req, res) => {
  await assertClassAccess(req.user, req.body.classId);
  const student = await Student.create(req.body);
  res.status(201).json({ message: 'Thêm sinh viên thành công', student });
});

export const getStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id).populate('classId');
  if (!student) throw new AppError('Không tìm thấy sinh viên', 404);

  await assertStudentAccess(req.user, student);

  const latestPrediction = await getLatestPrediction(student._id);
  const history = await getPredictionHistory(student._id);
  const latestFeature = latestPrediction
    ? await StudentFeature.findById(latestPrediction.featureRecordId)
    : await StudentFeature.findOne({ studentId: student._id }).sort({ recordedAt: -1 });

  const learningBehavior = await getLearningBehavior(student._id);
  let computedFeaturePreview = null;
  try {
    if (latestFeature) {
      computedFeaturePreview = await getComputedFeaturesForStudent(student._id);
    }
  } catch {
    computedFeaturePreview = null;
  }

  const existingForSummary = latestFeature
    ? featureDocToMl(latestFeature.toObject())
    : null;

  res.json({
    student,
    latestPrediction,
    predictionHistory: history,
    latestFeature,
    learningBehavior,
    behaviorSummary: getBehaviorSummary(learningBehavior, existingForSummary),
    computedFeaturePreview,
  });
});

export const updateStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) throw new AppError('Không tìm thấy sinh viên', 404);
  await assertClassAccess(req.user, student.classId);

  Object.assign(student, req.body);
  await student.save();
  res.json({ message: 'Cập nhật sinh viên thành công', student });
});

export const deleteStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) throw new AppError('Không tìm thấy sinh viên', 404);
  await assertClassAccess(req.user, student.classId);
  await student.deleteOne();
  res.json({ message: 'Xóa sinh viên thành công' });
});

export const listRiskStudents = asyncHandler(async (req, res) => {
  let classIds = [];
  if (req.query.classId) {
    classIds = [req.query.classId];
  } else if (req.user.role === 'TEACHER') {
    classIds = (await Class.find({ teacherId: req.user._id })).map((c) => c._id);
  } else {
    classIds = (await Class.find({})).map((c) => c._id);
  }

  const students = await Student.find({ classId: { $in: classIds } })
    .populate('classId', 'className courseName');

  const enriched = [];
  for (const student of students) {
    const prediction = await getLatestPrediction(student._id);
    if (!prediction) continue;

    const feature = await StudentFeature.findById(prediction.featureRecordId);
    enriched.push({
      studentId: student._id,
      studentCode: student.studentCode,
      fullName: student.fullName,
      className: student.classId?.className,
      classId: student.classId?._id,
      predictedScore: prediction.predictedScore,
      riskLevel: prediction.riskLevel,
      riskLabelVi: RISK_LABELS_VI[prediction.riskLevel],
      mainRiskFactors: prediction.riskFactors.slice(0, 2),
      attendance: feature?.attendance,
      stressLevel: feature?.stressLevel,
      motivation: feature?.motivation,
      assignmentCompletion: feature?.assignmentCompletion,
      lastUpdated: prediction.createdAt,
    });
  }

  let filtered = enriched;
  const { risk, search, filter } = req.query;

  if (risk && risk !== 'All') {
    filtered = filtered.filter((s) => s.riskLevel === risk);
  }
  if (filter === 'Low Attendance') filtered = filtered.filter((s) => s.attendance < 70);
  if (filter === 'High Stress') filtered = filtered.filter((s) => s.stressLevel >= 2);
  if (filter === 'Low Motivation') filtered = filtered.filter((s) => s.motivation <= 0);
  if (filter === 'Low AssignmentCompletion') filtered = filtered.filter((s) => s.assignmentCompletion < 70);

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (s) => s.studentCode.toLowerCase().includes(q)
        || s.fullName.toLowerCase().includes(q)
        || (s.className || '').toLowerCase().includes(q)
    );
  }

  res.json({ students: filtered, total: filtered.length });
});

export const getMyProfile = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ userId: req.user._id }).populate('classId');
  if (!student) {
    throw new AppError('Tài khoản chưa được liên kết với hồ sơ sinh viên. Liên hệ cố vấn học tập.', 404);
  }

  const latestPrediction = await getLatestPrediction(student._id);
  const history = await getPredictionHistory(student._id);
  const latestFeature = latestPrediction
    ? await StudentFeature.findById(latestPrediction.featureRecordId)
    : null;

  res.json({
    student,
    latestPrediction,
    predictionHistory: history,
    latestFeature,
  });
});

export const getClassPredictions = asyncHandler(async (req, res) => {
  const students = await Student.find({ classId: req.params.classId });
  const ids = students.map((s) => s._id);

  const predictions = await Prediction.aggregate([
    { $match: { studentId: { $in: ids } } },
    { $sort: { createdAt: -1 } },
    { $group: { _id: '$studentId', doc: { $first: '$$ROOT' } } },
  ]);

  res.json({ predictions: predictions.map((p) => p.doc) });
});
