import mongoose from 'mongoose';

const courseResourceSchema = new mongoose.Schema(
  {
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    fileUrl: { type: String, required: true },
    fileType: { type: String, default: 'pdf' },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model('CourseResource', courseResourceSchema);
