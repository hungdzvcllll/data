import { CATEGORICAL_FIELDS, getValidLabels } from '../config/featureEncoding.js';
import {
  UPLOAD_COLUMNS,
  ROSTER_REQUIRED_COLUMNS,
  EXTERNAL_PROFILE_COLUMNS,
} from '../utils/featureColumns.js';
import { normalizeCategorical } from '../utils/featureMapper.js';

const NUMERIC_FIELDS = {
  StudyHours: { min: 0, max: null, label: 'StudyHours' },
  Attendance: { min: 0, max: 100, label: 'Attendance' },
  AssignmentCompletion: { min: 0, max: 100, label: 'AssignmentCompletion' },
  OnlineCourses: { min: 0, max: null, label: 'OnlineCourses' },
  Discussions: { min: 0, max: null, label: 'Discussions' },
  Age: { min: 15, max: 80, label: 'Age' },
};

const EXTERNAL_CATEGORICAL = ['Gender', 'Internet', 'Extracurricular', 'StressLevel'];

function addError(errors, row, field, message) {
  errors.push({ row, field, message });
}

function validateNumericField(errors, rowNum, field, rawValue, required = true) {
  const rule = NUMERIC_FIELDS[field];
  if (rawValue === '' || rawValue === null || rawValue === undefined) {
    if (required) addError(errors, rowNum, field, `${field} is required.`);
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

function validateCategoricalField(errors, rowNum, field, rawValue, required = true) {
  if (rawValue === '' || rawValue === null || rawValue === undefined) {
    if (required) addError(errors, rowNum, field, `${field} is required.`);
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

function validateIdentityFields(errors, row, rowNum) {
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
}

function buildPreview(validRows, mode) {
  if (mode === 'external') {
    return validRows.slice(0, 10).map((r) => ({
      StudentID: r.studentCode,
      Gender: r.external.Gender,
      Age: r.external.Age,
      Attendance: r.external.Attendance,
      Internet: r.external.Internet,
      Extracurricular: r.external.Extracurricular,
      StressLevel: r.external.StressLevel,
    }));
  }

  if (mode === 'roster') {
    return validRows.slice(0, 10).map((r) => ({
      StudentID: r.studentCode,
      Name: r.fullName,
      Email: r.email || '',
      Class: r.classLabel,
      Gender: r.rawFeatures.gender,
      Age: r.rawFeatures.age,
      Attendance: r.rawFeatures.attendance,
      Internet: r.rawFeatures.internet,
      Extracurricular: r.rawFeatures.extracurricular,
      StressLevel: r.rawFeatures.stressLevel,
    }));
  }

  return validRows.slice(0, 10).map((r) => ({
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
}

/**
 * Validate upload rows; mode: full | roster | external
 */
export function validateUploadRows(rows, normalizeRowFn, options = {}) {
  const mode = options.mode || 'full';

  if (!rows.length) {
    return {
      valid: false,
      errors: [{ row: 0, field: 'File', message: 'File has no data rows.' }],
      validRows: [],
      preview: [],
      mode,
    };
  }

  const headers = Object.keys(rows[0]).map((h) => h.trim());

  if (mode === 'full') {
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
        mode,
      };
    }
  }

  if (mode === 'roster') {
    const missing = ROSTER_REQUIRED_COLUMNS.filter((col) => !headers.includes(col));
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
        mode,
      };
    }
  }

  if (mode === 'external') {
    const missing = ['StudentID', ...EXTERNAL_PROFILE_COLUMNS].filter((col) => !headers.includes(col));
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
        mode,
      };
    }
  }

  const errors = [];
  const validRows = [];

  rows.forEach((row, index) => {
    const rowNum = index + 2;

    if (mode === 'external') {
      if (!row.StudentID?.toString().trim()) {
        addError(errors, rowNum, 'StudentID', 'StudentID is required.');
      }
      validateNumericField(errors, rowNum, 'Age', row.Age, true);
      validateNumericField(errors, rowNum, 'Attendance', row.Attendance, true);
      for (const field of EXTERNAL_CATEGORICAL) {
        validateCategoricalField(errors, rowNum, field, row[field], true);
      }
      return;
    }

    validateIdentityFields(errors, row, rowNum);

    if (mode === 'full') {
      for (const field of Object.keys(NUMERIC_FIELDS)) {
        validateNumericField(errors, rowNum, field, row[field], true);
      }
      for (const field of CATEGORICAL_FIELDS) {
        validateCategoricalField(errors, rowNum, field, row[field], true);
      }
    }

    if (mode === 'roster') {
      if (options.selectedClassName) {
        const excelClass = row.Class?.toString().trim();
        const expected = options.selectedClassName.trim();
        if (excelClass && excelClass.toLowerCase() !== expected.toLowerCase()) {
          addError(
            errors,
            rowNum,
            'Class',
            `Cột Class "${excelClass}" phải trùng lớp đã chọn trên form ("${expected}").`
          );
        }
      }
      for (const field of EXTERNAL_PROFILE_COLUMNS) {
        if (row[field] !== '' && row[field] != null && row[field] !== undefined) {
          if (field === 'Age' || field === 'Attendance') {
            validateNumericField(errors, rowNum, field, row[field], true);
          } else {
            validateCategoricalField(errors, rowNum, field, row[field], true);
          }
        }
      }
    }
  });

  if (errors.length === 0) {
    rows.forEach((row) => {
      validRows.push(normalizeRowFn(row));
    });
    if (mode !== 'external') {
      validateDuplicateEmails(validRows, errors);
    }
  }

  if (errors.length > 0) {
    validRows.length = 0;
  }

  return {
    valid: errors.length === 0,
    errors,
    validRows,
    preview: buildPreview(validRows, mode),
    mode,
  };
}
