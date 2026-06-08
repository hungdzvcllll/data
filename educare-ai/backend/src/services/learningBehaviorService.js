import Student from '../models/Student.js';
import Class from '../models/Class.js';
import StudentFeature from '../models/StudentFeature.js';
import StudentLearningBehavior from '../models/StudentLearningBehavior.js';
import { AppError } from '../middlewares/errorHandler.js';
import { featureDocToMl } from '../utils/featureColumns.js';
import {
  computeFeaturesFromBehavior,
  getBehaviorSummary,
} from './behaviorFeatureService.js';

const NUMERIC_FIELDS = [
  'videoWatchMinutes',
  'assignmentWorkMinutes',
  'readingMinutes',
  'resourceViews',
  'resourceDownloads',
  'lectureMaterialViews',
  'completedModulesCount',
  'discussionPosts',
  'discussionReplies',
  'questionsAsked',
  'answersGiven',
  'submittedAssignments',
  'totalAssignments',
  'onTimeSubmissions',
  'totalSubmissions',
  'loginDaysPerWeek',
  'optionalLearningActivities',
  'completedExtraMaterials',
  'eduTechUsageCount',
  'audioListenMinutes',
  'practiceMinutes',
];

export async function assertLearningBehaviorAccess(user, studentId) {
  const student = await Student.findById(studentId);
  if (!student) throw new AppError('Không tìm thấy sinh viên', 404);

  if (user.role === 'STUDENT') {
    if (!student.userId || student.userId.toString() !== user._id.toString()) {
      throw new AppError('Forbidden', 403);
    }
    return student;
  }

  const cls = await Class.findById(student.classId);
  if (!cls) throw new AppError('Không tìm thấy lớp học', 404);
  if (user.role === 'TEACHER' && cls.teacherId.toString() !== user._id.toString()) {
    throw new AppError('Forbidden', 403);
  }

  return student;
}

function validateBehaviorPayload(body) {
  const errors = [];

  for (const field of NUMERIC_FIELDS) {
    if (body[field] === undefined || body[field] === null || body[field] === '') continue;
    const value = Number(body[field]);
    if (Number.isNaN(value) || value < 0) {
      errors.push(`${field} must be a non-negative number.`);
    }
  }

  if (body.completedOnlineCourses !== undefined && body.completedOnlineCourses !== null) {
    if (!Array.isArray(body.completedOnlineCourses) && Number.isNaN(Number(body.completedOnlineCourses))) {
      errors.push('completedOnlineCourses must be a number or an array.');
    }
    if (Array.isArray(body.completedOnlineCourses) && body.completedOnlineCourses.some((v) => Number(v) < 0)) {
      errors.push('completedOnlineCourses array must contain non-negative values.');
    }
  }

  return errors;
}

export async function upsertLearningBehavior(studentId, payload) {
  const errors = validateBehaviorPayload(payload);
  if (errors.length) {
    throw new AppError(errors.join(' '), 400);
  }

  const update = {};
  for (const field of NUMERIC_FIELDS) {
    if (payload[field] !== undefined && payload[field] !== null && payload[field] !== '') {
      update[field] = Number(payload[field]);
    }
  }
  if (payload.completedOnlineCourses !== undefined) {
    update.completedOnlineCourses = payload.completedOnlineCourses;
  }

  const behavior = await StudentLearningBehavior.findOneAndUpdate(
    { studentId },
    { $set: update, $setOnInsert: { studentId } },
    { new: true, upsert: true, runValidators: true }
  );

  return behavior;
}

export async function getLearningBehavior(studentId) {
  return StudentLearningBehavior.findOne({ studentId });
}

export async function getLatestEncodedFeatures(studentId) {
  const latestFeature = await StudentFeature.findOne({ studentId }).sort({ recordedAt: -1 });
  if (!latestFeature) return null;
  return featureDocToMl(latestFeature.toObject());
}

export async function getComputedFeaturesForStudent(studentId) {
  const latestFeature = await StudentFeature.findOne({ studentId }).sort({ recordedAt: -1 });
  if (!latestFeature) {
    throw new AppError('Chưa có dữ liệu features từ Excel. Vui lòng upload file trước.', 404);
  }

  const existingFeatures = featureDocToMl(latestFeature.toObject());
  const behavior = await getLearningBehavior(studentId);
  const { features, featureSource, computedFeatures } = computeFeaturesFromBehavior(
    behavior,
    existingFeatures,
    latestFeature.manualOverrideKeys || []
  );

  return {
    behavior,
    behaviorSummary: getBehaviorSummary(behavior, existingFeatures),
    existingFeatures,
    mergedFeatures: features,
    computedFeatures,
    featureSource,
  };
}

export async function resolveMergedFeaturesForStudent(studentId, featureDoc) {
  const docObj = featureDoc.toObject ? featureDoc.toObject() : featureDoc;
  const existingFeatures = featureDocToMl(docObj);
  const behavior = await getLearningBehavior(studentId);
  return computeFeaturesFromBehavior(
    behavior,
    existingFeatures,
    docObj.manualOverrideKeys || []
  );
}
