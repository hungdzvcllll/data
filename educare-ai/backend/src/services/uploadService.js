import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import XLSX from 'xlsx';
import { validateUploadRows } from './uploadValidationService.js';
import { mapValidatedRow } from '../utils/featureMapper.js';

const STUDENT_DATA_SHEET = 'StudentData';

export function parseUploadFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.csv') {
    const content = fs.readFileSync(filePath, 'utf-8');
    return parse(content, { columns: true, skip_empty_lines: true, trim: true });
  }

  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames.includes(STUDENT_DATA_SHEET)
    ? STUDENT_DATA_SHEET
    : workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(sheet, { defval: '' });
}

export function validateAndMapUploadRows(rows) {
  const result = validateUploadRows(rows, mapValidatedRow);
  if (!result.valid) {
    result.validRows = [];
  }
  return result;
}

/** @deprecated Use validateAndMapUploadRows */
export function validateUploadRowsLegacy(rows) {
  return validateAndMapUploadRows(rows);
}

export function rowToFeatureDoc(row, studentId) {
  const raw = row.rawFeatures || row.features;
  const encoded = row.encodedFeatures || row.mlFeatures;

  return {
    studentId,
    studyHours: encoded.StudyHours,
    attendance: encoded.Attendance,
    assignmentCompletion: encoded.AssignmentCompletion,
    onlineCourses: encoded.OnlineCourses,
    discussions: encoded.Discussions,
    extracurricular: encoded.Extracurricular,
    resources: encoded.Resources,
    internet: encoded.Internet,
    eduTech: encoded.EduTech,
    learningStyle: encoded.LearningStyle,
    motivation: encoded.Motivation,
    stressLevel: encoded.StressLevel,
    rawFeatures: raw,
    encodedFeatures: encoded,
    recordedAt: new Date(),
  };
}
