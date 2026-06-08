import mongoose from 'mongoose';

const studentLearningBehaviorSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      unique: true,
    },
    videoWatchMinutes: { type: Number, default: 0, min: 0 },
    assignmentWorkMinutes: { type: Number, default: 0, min: 0 },
    readingMinutes: { type: Number, default: 0, min: 0 },
    resourceViews: { type: Number, default: 0, min: 0 },
    resourceDownloads: { type: Number, default: 0, min: 0 },
    lectureMaterialViews: { type: Number, default: 0, min: 0 },
    completedOnlineCourses: { type: mongoose.Schema.Types.Mixed, default: 0 },
    completedModulesCount: { type: Number, default: 0, min: 0 },
    discussionPosts: { type: Number, default: 0, min: 0 },
    discussionReplies: { type: Number, default: 0, min: 0 },
    questionsAsked: { type: Number, default: 0, min: 0 },
    answersGiven: { type: Number, default: 0, min: 0 },
    submittedAssignments: { type: Number, default: 0, min: 0 },
    totalAssignments: { type: Number, default: 0, min: 0 },
    onTimeSubmissions: { type: Number, default: 0, min: 0 },
    totalSubmissions: { type: Number, default: 0, min: 0 },
    loginDaysPerWeek: { type: Number, default: 0, min: 0 },
    optionalLearningActivities: { type: Number, default: 0, min: 0 },
    completedExtraMaterials: { type: Number, default: 0, min: 0 },
    eduTechUsageCount: { type: Number, default: 0, min: 0 },
    audioListenMinutes: { type: Number, default: 0, min: 0 },
    practiceMinutes: { type: Number, default: 0, min: 0 },
    /** Feature values set by teacher — LMS activity adds on top of these baselines. */
    teacherFeatureBaselines: { type: mongoose.Schema.Types.Mixed },
    /** Raw LMS counters at the moment teacher saved baselines (for delta calculation). */
    behaviorSnapshotAtBaseline: { type: mongoose.Schema.Types.Mixed },
    teacherBaselineAt: { type: Date },
    lastActivityAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model('StudentLearningBehavior', studentLearningBehaviorSchema);
