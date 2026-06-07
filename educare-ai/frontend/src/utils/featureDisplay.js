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
