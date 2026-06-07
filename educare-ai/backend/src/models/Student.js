import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema(
  {
    studentCode: { type: String, required: true, trim: true },
    fullName: { type: String, required: true, trim: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    gender: { type: Number, min: 0, max: 1, default: 0 },
    age: { type: Number, min: 18, max: 30 },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

studentSchema.index({ studentCode: 1, classId: 1 }, { unique: true });

export default mongoose.model('Student', studentSchema);
