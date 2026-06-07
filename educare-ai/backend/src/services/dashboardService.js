import Prediction from '../models/Prediction.js';
import Student from '../models/Student.js';
import Class from '../models/Class.js';
import StudentFeature from '../models/StudentFeature.js';

async function getClassStudentIds(classId) {
  const students = await Student.find({ classId }).select('_id');
  return students.map((s) => s._id);
}

export async function getTeacherDashboard(user) {
  const classFilter = user.role === 'ADMIN' ? {} : { teacherId: user._id };
  const classes = await Class.find(classFilter);
  const classIds = classes.map((c) => c._id);

  const students = await Student.find({ classId: { $in: classIds } });
  const studentIds = students.map((s) => s._id);

  const predictions = await Prediction.aggregate([
    { $match: { studentId: { $in: studentIds } } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: '$studentId',
        doc: { $first: '$$ROOT' },
      },
    },
  ]);

  const latest = predictions.map((p) => p.doc);
  return buildDashboardStats(students, latest, classes);
}

export async function getClassDashboard(classId) {
  const students = await Student.find({ classId });
  const studentIds = students.map((s) => s._id);

  const predictions = await Prediction.aggregate([
    { $match: { studentId: { $in: studentIds } } },
    { $sort: { createdAt: -1 } },
    { $group: { _id: '$studentId', doc: { $first: '$$ROOT' } } },
  ]);

  const latest = predictions.map((p) => p.doc);
  const cls = await Class.findById(classId).populate('teacherId', 'fullName email');
  const stats = buildDashboardStats(students, latest, [cls]);
  return { ...stats, class: cls };
}

export async function getRiskSummary(user, classId) {
  let studentIds;
  if (classId) {
    studentIds = (await Student.find({ classId })).map((s) => s._id);
  } else {
    const classFilter = user.role === 'ADMIN' ? {} : { teacherId: user._id };
    const classIds = (await Class.find(classFilter)).map((c) => c._id);
    studentIds = (await Student.find({ classId: { $in: classIds } })).map((s) => s._id);
  }

  const latest = await Prediction.aggregate([
    { $match: { studentId: { $in: studentIds } } },
    { $sort: { createdAt: -1 } },
    { $group: { _id: '$studentId', doc: { $first: '$$ROOT' } } },
  ]);

  const byRisk = { EXCELLENT: 0, STABLE: 0, AT_RISK: 0, HIGH_RISK: 0 };
  latest.forEach(({ doc }) => {
    byRisk[doc.riskLevel] = (byRisk[doc.riskLevel] || 0) + 1;
  });

  return { byRisk, total: latest.length };
}

function buildDashboardStats(students, predictions, classes) {
  const byRisk = { EXCELLENT: 0, STABLE: 0, AT_RISK: 0, HIGH_RISK: 0 };
  let scoreSum = 0;

  predictions.forEach((p) => {
    byRisk[p.riskLevel] = (byRisk[p.riskLevel] || 0) + 1;
    scoreSum += p.predictedScore;
  });

  const chartData = predictions.map((p) => ({
    predictedScore: p.predictedScore,
    riskLevel: p.riskLevel,
    studentId: p.studentId,
  }));

  return {
    totalStudents: students.length,
    totalClasses: classes.length,
    averagePredictedScore: predictions.length ? scoreSum / predictions.length : 0,
    highRiskCount: byRisk.HIGH_RISK,
    atRiskCount: byRisk.AT_RISK,
    stableCount: byRisk.STABLE,
    excellentCount: byRisk.EXCELLENT,
    riskDistribution: byRisk,
    scoreDistribution: chartData,
    classes,
  };
}

export async function getScatterData(classId) {
  const students = await Student.find({ classId });
  const studentIds = students.map((s) => s._id);

  const rows = await Prediction.aggregate([
    { $match: { studentId: { $in: studentIds } } },
    { $sort: { createdAt: -1 } },
    { $group: { _id: '$studentId', prediction: { $first: '$$ROOT' } } },
    {
      $lookup: {
        from: 'studentfeatures',
        localField: 'prediction.featureRecordId',
        foreignField: '_id',
        as: 'feature',
      },
    },
    { $unwind: '$feature' },
  ]);

  return rows.map((r) => ({
    studentId: r._id,
    predictedScore: r.prediction.predictedScore,
    attendance: r.feature.attendance,
    assignmentCompletion: r.feature.assignmentCompletion,
    stressLevel: r.feature.stressLevel,
  }));
}
