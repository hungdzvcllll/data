/** Display labels for encoded numeric values (mirrors backend featureEncoding.js). */
const GENDER = { 0: 'Male', 1: 'Female' };
const YES_NO = { 0: 'No', 1: 'Yes' };
const LEVEL = { 0: 'Low', 1: 'Medium', 2: 'High' };
const LEARNING_STYLE = {
  0: 'Visual',
  1: 'Auditory',
  2: 'Reading/Writing',
  3: 'Kinesthetic',
};

const NUMERIC_DECODE = {
  gender: GENDER,
  extracurricular: YES_NO,
  internet: YES_NO,
  eduTech: YES_NO,
  resources: LEVEL,
  motivation: LEVEL,
  stressLevel: LEVEL,
  learningStyle: LEARNING_STYLE,
};

const RAW_KEY_MAP = {
  Gender: 'gender',
  Extracurricular: 'extracurricular',
  Resources: 'resources',
  Internet: 'internet',
  EduTech: 'eduTech',
  LearningStyle: 'learningStyle',
  Motivation: 'motivation',
  StressLevel: 'stressLevel',
  StudyHours: 'studyHours',
  Attendance: 'attendance',
  AssignmentCompletion: 'assignmentCompletion',
  OnlineCourses: 'onlineCourses',
  Discussions: 'discussions',
  Age: 'age',
};

export const ML_FEATURE_KEYS = [
  'StudyHours',
  'Attendance',
  'Resources',
  'Extracurricular',
  'Motivation',
  'Internet',
  'Gender',
  'Age',
  'LearningStyle',
  'OnlineCourses',
  'Discussions',
  'AssignmentCompletion',
  'EduTech',
  'StressLevel',
];

const ENCODED_DECODE = {
  Gender: GENDER,
  Extracurricular: YES_NO,
  Internet: YES_NO,
  EduTech: YES_NO,
  Resources: LEVEL,
  Motivation: LEVEL,
  StressLevel: LEVEL,
  LearningStyle: LEARNING_STYLE,
  Discussions: YES_NO,
};

function decodeEncodedValue(key, value) {
  if (value === undefined || value === null || value === '') return '—';
  const decoder = ENCODED_DECODE[key];
  if (decoder && decoder[value] !== undefined) return decoder[value];
  return value;
}

/**
 * Value shown in "Nguồn dữ liệu từng feature" — Excel uses upload labels, behavior uses merged numeric values.
 */
export function displayFeatureSourceValue(
  key,
  { featureSource, mergedFeatures, computedFeatures, latestFeature, student }
) {
  if (featureSource?.[key] === 'behavior' || featureSource?.[key] === 'manual+behavior') {
    const val = mergedFeatures?.[key] ?? computedFeatures?.[key];
    return decodeEncodedValue(key, val);
  }
  return displayFeatureValue(key, latestFeature, student);
}

export const FEATURE_EDIT_META = {
  StudyHours: { type: 'number', min: 0, step: 0.1 },
  Attendance: { type: 'number', min: 0, max: 100, step: 1 },
  Resources: { type: 'select', options: ['Low', 'Medium', 'High'] },
  Extracurricular: { type: 'select', options: ['No', 'Yes'] },
  Motivation: { type: 'select', options: ['Low', 'Medium', 'High'] },
  Internet: { type: 'select', options: ['No', 'Yes'] },
  Gender: { type: 'select', options: ['Male', 'Female'] },
  Age: { type: 'number', min: 15, max: 80, step: 1 },
  LearningStyle: { type: 'select', options: ['Visual', 'Auditory', 'Reading/Writing', 'Kinesthetic'] },
  OnlineCourses: { type: 'number', min: 0, step: 1 },
  Discussions: { type: 'select', options: ['No', 'Yes'] },
  AssignmentCompletion: { type: 'number', min: 0, max: 100, step: 1 },
  EduTech: { type: 'select', options: ['No', 'Yes'] },
  StressLevel: { type: 'select', options: ['Low', 'Medium', 'High'] },
};

export function buildFeatureEditForm(ctx) {
  const form = {};
  for (const key of ML_FEATURE_KEYS) {
    const displayed = displayFeatureSourceValue(key, ctx);
    form[key] = displayed === '—' || displayed === '-' ? '' : String(displayed);
  }
  return form;
}

export function formValuesToFeatureRow(form) {
  const row = {};
  for (const key of ML_FEATURE_KEYS) {
    const meta = FEATURE_EDIT_META[key];
    let value = form[key];
    if (meta?.type === 'number') {
      value = value === '' ? '' : Number(value);
    }
    row[key] = value;
  }
  return row;
}

/**
 * Show human-readable feature value for teachers (never show internal 0/1/2 codes).
 */
export function displayFeatureValue(label, latestFeature, student) {
  const rawKey = RAW_KEY_MAP[label];
  const raw = latestFeature?.rawFeatures?.[rawKey];

  if (raw !== undefined && raw !== null && raw !== '') {
    return raw;
  }

  if (label === 'Gender') {
    return GENDER[student?.gender] ?? student?.gender ?? '-';
  }
  if (label === 'Age') {
    return student?.age ?? '-';
  }

  const flatKey = rawKey;
  const numVal = latestFeature?.[flatKey];
  if (numVal === undefined || numVal === null) return '-';

  const decoder = NUMERIC_DECODE[flatKey];
  if (decoder) return decoder[numVal] ?? numVal;

  return numVal;
}

/** Columns for upload preview table (human-readable). */
export const PREVIEW_COLUMNS = [
  'StudentID',
  'Name',
  'Class',
  'StudyHours',
  'Attendance',
  'AssignmentCompletion',
  'Gender',
  'Resources',
  'LearningStyle',
  'Motivation',
  'StressLevel',
];
