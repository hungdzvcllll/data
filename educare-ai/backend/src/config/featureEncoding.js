/**
 * Official categorical → numeric mapping for EduCare AI.
 *
 * Source: student_performance.csv used in data/model.py
 * - Training used pre-encoded int64 columns (no LabelEncoder / OrdinalEncoder saved).
 * - Unique values in dataset:
 *   Gender, Extracurricular, Internet, EduTech, Discussions: 0, 1
 *   Resources, Motivation, StressLevel: 0, 1, 2
 *   LearningStyle: 0, 1, 2, 3
 *
 * Text labels below follow conventional interpretation aligned with the user spec
 * and Kaggle dataset documentation. If retraining with explicit encoders, replace
 * this file from encoders.joblib or feature_mapping.json exported at train time.
 */
const featureEncoding = {
  Gender: {
    Male: 0,
    Female: 1,
  },
  Extracurricular: {
    No: 0,
    Yes: 1,
  },
  Internet: {
    No: 0,
    Yes: 1,
  },
  EduTech: {
    No: 0,
    Yes: 1,
  },
  Resources: {
    Low: 0,
    Medium: 1,
    High: 2,
  },
  LearningStyle: {
    Visual: 0,
    Auditory: 1,
    'Reading/Writing': 2,
    Kinesthetic: 3,
  },
  Motivation: {
    Low: 0,
    Medium: 1,
    High: 2,
  },
  StressLevel: {
    Low: 0,
    Medium: 1,
    High: 2,
  },
};

/** Fields that use featureEncoding (human-readable labels in Excel). */
export const CATEGORICAL_FIELDS = Object.keys(featureEncoding);

/** Ordered list of valid labels per field (for validation messages). */
export function getValidLabels(field) {
  return Object.keys(featureEncoding[field] || {});
}

export default featureEncoding;
