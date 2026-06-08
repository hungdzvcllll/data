import featureEncoding, { CATEGORICAL_FIELDS } from '../config/featureEncoding.js';
import { ML_FEATURE_KEYS } from './featureColumns.js';
import { applyUploadDefaults } from './uploadDefaults.js';

/**
 * Normalize categorical text: trim whitespace, case-insensitive match to canonical label.
 * Returns canonical label or null if invalid.
 */
export function normalizeCategorical(field, rawValue) {
  if (rawValue === null || rawValue === undefined || String(rawValue).trim() === '') {
    return null;
  }

  const encoding = featureEncoding[field];
  if (!encoding) return String(rawValue).trim();

  const trimmed = String(rawValue).trim();
  if (Object.prototype.hasOwnProperty.call(encoding, trimmed)) {
    return trimmed;
  }

  const lower = trimmed.toLowerCase();
  for (const label of Object.keys(encoding)) {
    if (label.toLowerCase() === lower) {
      return label;
    }
  }

  return null;
}

/**
 * Build rawFeatures object (human-readable) from a validated upload row.
 */
export function buildRawFeatures(row) {
  return {
    studyHours: Number(row.StudyHours),
    attendance: Number(row.Attendance),
    assignmentCompletion: Number(row.AssignmentCompletion),
    onlineCourses: Number(row.OnlineCourses),
    discussions: Number(row.Discussions),
    extracurricular: normalizeCategorical('Extracurricular', row.Extracurricular),
    resources: normalizeCategorical('Resources', row.Resources),
    internet: normalizeCategorical('Internet', row.Internet),
    eduTech: normalizeCategorical('EduTech', row.EduTech),
    gender: normalizeCategorical('Gender', row.Gender),
    age: Number(row.Age),
    learningStyle: normalizeCategorical('LearningStyle', row.LearningStyle),
    motivation: normalizeCategorical('Motivation', row.Motivation),
    stressLevel: normalizeCategorical('StressLevel', row.StressLevel),
  };
}

/**
 * Map validated row to 14 numeric model features (training column names & order).
 */
export function mapRowToEncodedFeatures(row) {
  const encoded = {
    StudyHours: Number(row.StudyHours),
    Attendance: Number(row.Attendance),
    AssignmentCompletion: Number(row.AssignmentCompletion),
    OnlineCourses: Number(row.OnlineCourses),
    Discussions: Number(row.Discussions),
    Age: Number(row.Age),
  };

  for (const field of CATEGORICAL_FIELDS) {
    const label = normalizeCategorical(field, row[field]);
    encoded[field] = featureEncoding[field][label];
  }

  // Enforce training feature order
  const ordered = {};
  for (const key of ML_FEATURE_KEYS) {
    ordered[key] = encoded[key];
  }
  return ordered;
}

/**
 * Full normalized upload row for storage and prediction.
 */
export function mapValidatedRow(row, mode = 'full') {
  const normalized = applyUploadDefaults(row, mode);
  const rawFeatures = buildRawFeatures(normalized);
  const encodedFeatures = mapRowToEncodedFeatures(normalized);

  const emailRaw = normalized.Email ?? normalized.email;

  return {
    studentCode: String(normalized.StudentID).trim(),
    fullName: String(normalized.Name).trim(),
    classLabel: String(normalized.Class || '').trim(),
    gender: encodedFeatures.Gender,
    age: encodedFeatures.Age,
    email: emailRaw ? String(emailRaw).trim().toLowerCase() : null,
    rawFeatures,
    encodedFeatures,
    mlFeatures: encodedFeatures,
    uploadMode: mode,
    profileComplete: mode === 'full' || mode === 'external',
  };
}

/** Map external profile row — only updates survey/admin fields on existing students. */
export function mapExternalProfileRow(row) {
  return {
    studentCode: String(row.StudentID).trim(),
    external: {
      Gender: row.Gender,
      Age: row.Age,
      Attendance: row.Attendance,
      Internet: row.Internet,
      Extracurricular: row.Extracurricular,
      StressLevel: row.StressLevel,
    },
  };
}
