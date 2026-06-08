import mongoose from 'mongoose';

const learningEventSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    targetType: {
      type: String,
      enum: ['video', 'resource', 'assignment', 'course', 'discussion'],
      required: true,
    },
    targetId: { type: mongoose.Schema.Types.ObjectId },
    eventType: {
      type: String,
      enum: [
        'video_progress',
        'resource_view',
        'assignment_start',
        'assignment_submit',
        'course_open',
        'discussion_post',
        'discussion_reply',
      ],
      required: true,
    },
    value: { type: Number, default: 0 },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export default mongoose.model('LearningEvent', learningEventSchema);
