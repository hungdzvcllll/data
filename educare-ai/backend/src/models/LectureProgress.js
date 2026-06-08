import mongoose from 'mongoose';

const lectureProgressSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    lectureId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lecture', required: true },
    watchedSeconds: { type: Number, default: 0, min: 0 },
    currentTime: { type: Number, default: 0, min: 0 },
    completed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

lectureProgressSchema.index({ studentId: 1, lectureId: 1 }, { unique: true });

export default mongoose.model('LectureProgress', lectureProgressSchema);
