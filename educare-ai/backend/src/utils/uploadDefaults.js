/** Default values for behavior-driven fields until LMS collects real activity. */
export const BEHAVIOR_FIELD_DEFAULTS = {
  StudyHours: 0,
  AssignmentCompletion: 0,
  OnlineCourses: 0,
  Discussions: 0,
  Resources: 'Low',
  EduTech: 'No',
  LearningStyle: 'Visual',
  Motivation: 'Medium',
};

/** Default external profile when roster import has no survey data yet. */
export const EXTERNAL_FIELD_DEFAULTS = {
  Gender: 'Male',
  Age: 20,
  Attendance: 0,
  Internet: 'Yes',
  Extracurricular: 'No',
  StressLevel: 'Medium',
};

export function applyUploadDefaults(row, mode = 'full') {
  const merged = { ...row };

  if (mode === 'full') return merged;

  if (mode === 'roster') {
    for (const [field, value] of Object.entries(BEHAVIOR_FIELD_DEFAULTS)) {
      if (merged[field] === '' || merged[field] === null || merged[field] === undefined) {
        merged[field] = value;
      }
    }
    for (const [field, value] of Object.entries(EXTERNAL_FIELD_DEFAULTS)) {
      if (merged[field] === '' || merged[field] === null || merged[field] === undefined) {
        merged[field] = value;
      }
    }
  }

  return merged;
}
