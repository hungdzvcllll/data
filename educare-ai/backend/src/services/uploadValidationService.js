import { CATEGORICAL_FIELDS, getValidLabels } from '../config/featureEncoding.js';
import { UPLOAD_COLUMNS } from '../utils/featureColumns.js';
import { normalizeCategorical } from '../utils/featureMapper.js';

const NUMERIC_FIELDS = {
  StudyHours: { min: 0, max: null, label: 'StudyHours' },
  Attendance: { min: 0, max: 100, label: 'Attendance' },
  AssignmentCompletion: { min: 0, max: 100, label: 'AssignmentCompletion' },
  OnlineCourses: { min: 0, max: null, label: 'OnlineCourses' },
  Discussions: { min: 0, max: null, label: 'Discussions' },
  Age: { min: 15, max: 80, label: 'Age' },
};

function addError(errors, row, field, message) {
  errors.push({ row, field, message });
}

function validateNumericField(errors, rowNum, field, rawValue) {
  const rule = NUMERIC_FIELDS[field];
  if (rawValue === '' || rawValue === null || rawValue === undefined) {
    addError(errors, rowNum, field, `${field} is required.`);
    return;
  }

  const num = Number(rawValue);
  if (Number.isNaN(num)) {
    addError(errors, rowNum, field, `${field} must be a number.`);
    return;
  }

  if (rule.min !== null && num < rule.min) {
    addError(
      errors,
      rowNum,
      field,
      rule.max !== null
        ? `${field} must be a number between ${rule.min} and ${rule.max}.`
        : `${field} must be a number >= ${rule.min}.`
    );
    return;
  }

  if (rule.max !== null && num > rule.max) {
    addError(errors, rowNum, field, `${field} must be a number between ${rule.min} and ${rule.max}.`);
  }
}

function validateCategoricalField(errors, rowNum, field, rawValue) {
  if (rawValue === '' || rawValue === null || rawValue === undefined) {
    addError(errors, rowNum, field, `${field} is required.`);
    return;
  }

  const normalized = normalizeCategorical(field, rawValue);
  if (normalized === null) {
    const labels = getValidLabels(field).join(', ');
    addError(errors, rowNum, field, `${field} must be ${labels.replace(/, ([^,]+)$/, ', or $1')}.`);
  }
}

function validateEmail(errors, rowNum, rawValue) {
  if (!rawValue || String(rawValue).trim() === '') return;

  const email = String(rawValue).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    addError(errors, rowNum, 'Email', 'Email must be a valid email address.');
  }
}

function validateDuplicateEmails(validRows, errors) {
  const domain = process.env.STUDENT_EMAIL_DOMAIN || 'student.educare.edu.vn';
  const seen = new Map();

  validRows.forEach((row, index) => {
    const email = row.email
      || `${String(row.studentCode).trim().toLowerCase().replace(/[^a-z0-9]/g, '')}@${domain}`;
    if (seen.has(email)) {
      addError(
        errors,
        index + 2,
        'Email',
        `Duplicate email (${email}); also used on row ${seen.get(email)}.`
      );
    } else {
      seen.set(email, index + 2);
    }
  });
}

/**
 * Validate upload rows; returns structured errors per row/field.
 */
export function validateUploadRows(rows, normalizeRowFn) {
  if (!rows.length) {
    return {
      valid: false,
      errors: [{ row: 0, field: 'File', message: 'File has no data rows.' }],
      validRows: [],
      preview: [],
    };
  }

  const headers = Object.keys(rows[0]).map((h) => h.trim());
  const missing = UPLOAD_COLUMNS.filter((col) => !headers.includes(col));

  if (missing.length) {
    return {
      valid: false,
      errors: missing.map((col) => ({
        row: 1,
        field: col,
        message: `Missing required column: ${col}.`,
      })),
      validRows: [],
      preview: [],
    };
  }

  const errors = [];
  const validRows = [];

  rows.forEach((row, index) => {
    const rowNum = index + 2; // header is row 1

    if (!row.StudentID?.toString().trim()) {
      addError(errors, rowNum, 'StudentID', 'StudentID is required.');
    }
    if (!row.Name?.toString().trim()) {
      addError(errors, rowNum, 'Name', 'Name is required.');
    }
    if (!row.Class?.toString().trim()) {
      addError(errors, rowNum, 'Class', 'Class is required.');
    }

    validateEmail(errors, rowNum, row.Email ?? row.email);

    for (const field of Object.keys(NUMERIC_FIELDS)) {
      validateNumericField(errors, rowNum, field, row[field]);
    }

    for (const field of CATEGORICAL_FIELDS) {
      validateCategoricalField(errors, rowNum, field, row[field]);
    }
  });

  if (errors.length === 0) {
    rows.forEach((row) => {
      validRows.push(normalizeRowFn(row));
    });
    validateDuplicateEmails(validRows, errors);
  }

  if (errors.length > 0) {
    validRows.length = 0;
  }

  const preview = validRows.slice(0, 10).map((r) => ({
    StudentID: r.studentCode,
    Name: r.fullName,
    Email: r.email || '',
    Class: r.classLabel,
    StudyHours: r.rawFeatures.studyHours,
    Attendance: r.rawFeatures.attendance,
    AssignmentCompletion: r.rawFeatures.assignmentCompletion,
    OnlineCourses: r.rawFeatures.onlineCourses,
    Discussions: r.rawFeatures.discussions,
    Extracurricular: r.rawFeatures.extracurricular,
    Resources: r.rawFeatures.resources,
    Internet: r.rawFeatures.internet,
    EduTech: r.rawFeatures.eduTech,
    Gender: r.rawFeatures.gender,
    Age: r.rawFeatures.age,
    LearningStyle: r.rawFeatures.learningStyle,
    Motivation: r.rawFeatures.motivation,
    StressLevel: r.rawFeatures.stressLevel,
  }));

  return {
    valid: errors.length === 0,
    errors,
    validRows,
    preview,
  };
}
