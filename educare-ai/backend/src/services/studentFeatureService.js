import Student from '../models/Student.js';
import StudentFeature from '../models/StudentFeature.js';
import { ML_FEATURE_KEYS } from '../utils/featureColumns.js';
import { buildRawFeatures, mapRowToEncodedFeatures } from '../utils/featureMapper.js';
import { CATEGORICAL_FIELDS, getValidLabels } from '../config/featureEncoding.js';
import { normalizeCategorical } from '../utils/featureMapper.js';
import { AppError } from '../middlewares/errorHandler.js';
import { rowToFeatureDoc } from './uploadService.js';
import { applyTeacherFeatureBaselines } from './teacherBaselineService.js';

const NUMERIC_RULES = {
  StudyHours: { min: 0, max: null },
  Attendance: { min: 0, max: 100 },
  AssignmentCompletion: { min: 0, max: 100 },
  OnlineCourses: { min: 0, max: null },
  Discussions: { min: 0, max: 1 },
  Age: { min: 15, max: 80 },
};

function validateTeacherFeatureRow(features) {
  const errors = [];

  for (const [field, rule] of Object.entries(NUMERIC_RULES)) {
    const raw = features[field];
    if (raw === '' || raw === null || raw === undefined) {
      errors.push(`${field} is required.`);
      continue;
    }
    const num = Number(raw);
    if (Number.isNaN(num)) {
      errors.push(`${field} must be a number.`);
      continue;
    }
    if (rule.min !== null && num < rule.min) errors.push(`${field} must be >= ${rule.min}.`);
    if (rule.max !== null && num > rule.max) errors.push(`${field} must be <= ${rule.max}.`);
  }

  for (const field of CATEGORICAL_FIELDS) {
    const raw = features[field];
    if (raw === '' || raw === null || raw === undefined) {
      errors.push(`${field} is required.`);
      continue;
    }
    if (normalizeCategorical(field, raw) === null) {
      errors.push(`${field} must be one of: ${getValidLabels(field).join(', ')}.`);
    }
  }

  return errors;
}

function normalizeFeatureRow(features) {
  const row = {};
  for (const key of ML_FEATURE_KEYS) {
    row[key] = features[key];
  }

  if (typeof row.Discussions === 'string') {
    const d = row.Discussions.trim().toLowerCase();
    if (d === 'yes') row.Discussions = 1;
    if (d === 'no') row.Discussions = 0;
  }

  for (const field of CATEGORICAL_FIELDS) {
    row[field] = normalizeCategorical(field, row[field]);
  }

  return row;
}

export async function saveTeacherFeatureUpdate(studentId, features, overrideKeys = ML_FEATURE_KEYS) {
  const student = await Student.findById(studentId);
  if (!student) throw new AppError('Không tìm thấy sinh viên', 404);

  const normalized = normalizeFeatureRow(features);
  const errors = validateTeacherFeatureRow(normalized);
  if (errors.length) {
    throw new AppError(errors.join(' '), 400);
  }

  const encodedFeatures = mapRowToEncodedFeatures(normalized);
  const rawFeatures = buildRawFeatures(normalized);

  student.gender = encodedFeatures.Gender;
  student.age = encodedFeatures.Age;
  await student.save();

  const previous = await StudentFeature.findOne({ studentId }).sort({ recordedAt: -1 });
  const mergedOverrideKeys = new Set([
    ...(previous?.manualOverrideKeys || []),
    ...((overrideKeys && overrideKeys.length) ? overrideKeys : ML_FEATURE_KEYS),
  ]);

  const doc = await StudentFeature.create({
    ...rowToFeatureDoc({ rawFeatures, encodedFeatures }, studentId),
    manualOverrideKeys: [...mergedOverrideKeys].filter((key) => ML_FEATURE_KEYS.includes(key)),
  });

  await applyTeacherFeatureBaselines(studentId, encodedFeatures);

  return doc;
}
