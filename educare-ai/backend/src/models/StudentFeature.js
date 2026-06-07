import mongoose from 'mongoose';

const rawFeaturesSchema = new mongoose.Schema(
  {
    studyHours: Number,
    attendance: Number,
    assignmentCompletion: Number,
    onlineCourses: Number,
    discussions: Number,
    extracurricular: String,
    resources: String,
    internet: String,
    eduTech: String,
    gender: String,
    age: Number,
    learningStyle: String,
    motivation: String,
    stressLevel: String,
  },
  { _id: false }
);

const encodedFeaturesSchema = new mongoose.Schema(
  {
    StudyHours: Number,
    Attendance: Number,
    Resources: Number,
    Extracurricular: Number,
    Motivation: Number,
    Internet: Number,
    Gender: Number,
    Age: Number,
    LearningStyle: Number,
    OnlineCourses: Number,
    Discussions: Number,
    AssignmentCompletion: Number,
    EduTech: Number,
    StressLevel: Number,
  },
  { _id: false }
);

const studentFeatureSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    studyHours: { type: Number, required: true },
    attendance: { type: Number, required: true },
    assignmentCompletion: { type: Number, required: true },
    onlineCourses: { type: Number, required: true },
    discussions: { type: Number, required: true },
    extracurricular: { type: Number, required: true },
    resources: { type: Number, required: true },
    internet: { type: Number, required: true },
    eduTech: { type: Number, required: true },
    learningStyle: { type: Number, required: true },
    motivation: { type: Number, required: true },
    stressLevel: { type: Number, required: true },
    rawFeatures: rawFeaturesSchema,
    encodedFeatures: encodedFeaturesSchema,
    recordedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model('StudentFeature', studentFeatureSchema);
