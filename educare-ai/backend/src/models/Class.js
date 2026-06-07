import mongoose from 'mongoose';

const classSchema = new mongoose.Schema(
  {
    className: { type: String, required: true, trim: true },
    courseName: { type: String, required: true, trim: true },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    semester: { type: String, required: true, trim: true },
    academicYear: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model('Class', classSchema);
