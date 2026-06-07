/** Required columns for student data upload (Email optional). */
export const UPLOAD_COLUMNS = [
  'StudentID',
  'Name',
  'Class',
  'StudyHours',
  'Attendance',
  'AssignmentCompletion',
  'OnlineCourses',
  'Discussions',
  'Extracurricular',
  'Resources',
  'Internet',
  'EduTech',
  'Gender',
  'Age',
  'LearningStyle',
  'Motivation',
  'StressLevel',
];

/**
 * 14 ML model features in exact training order (data/model.py X columns).
 * Must match backend/ml/preprocessing.py FEATURE_COLUMNS.
 */
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

export function rowToMlFeatures(row) {
  const encoded = row.encodedFeatures || row.mlFeatures;
  if (encoded) {
    const ordered = {};
    for (const key of ML_FEATURE_KEYS) {
      ordered[key] = Number(encoded[key]);
    }
    return ordered;
  }

  return {
    StudyHours: Number(row.StudyHours ?? row.studyHours),
    Attendance: Number(row.Attendance ?? row.attendance),
    Resources: Number(row.Resources ?? row.resources),
    Extracurricular: Number(row.Extracurricular ?? row.extracurricular),
    Motivation: Number(row.Motivation ?? row.motivation),
    Internet: Number(row.Internet ?? row.internet),
    Gender: Number(row.Gender ?? row.gender),
    Age: Number(row.Age ?? row.age),
    LearningStyle: Number(row.LearningStyle ?? row.learningStyle),
    OnlineCourses: Number(row.OnlineCourses ?? row.onlineCourses),
    Discussions: Number(row.Discussions ?? row.discussions),
    AssignmentCompletion: Number(row.AssignmentCompletion ?? row.assignmentCompletion),
    EduTech: Number(row.EduTech ?? row.eduTech),
    StressLevel: Number(row.StressLevel ?? row.stressLevel),
  };
}

export function featureDocToMl(doc) {
  if (doc.encodedFeatures) {
    const ordered = {};
    for (const key of ML_FEATURE_KEYS) {
      ordered[key] = Number(doc.encodedFeatures[key]);
    }
    return ordered;
  }

  return {
    StudyHours: doc.studyHours,
    Attendance: doc.attendance,
    Resources: doc.resources,
    Extracurricular: doc.extracurricular,
    Motivation: doc.motivation,
    Internet: doc.internet,
    Gender: doc.gender ?? 0,
    Age: doc.age ?? 20,
    LearningStyle: doc.learningStyle,
    OnlineCourses: doc.onlineCourses,
    Discussions: doc.discussions,
    AssignmentCompletion: doc.assignmentCompletion,
    EduTech: doc.eduTech,
    StressLevel: doc.stressLevel,
  };
}
