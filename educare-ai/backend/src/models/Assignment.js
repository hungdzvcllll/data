import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema(
  {
    questionText: { type: String, required: true, trim: true },
    options: { type: [String], required: true },
    correctOptionIndex: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const assignmentSchema = new mongoose.Schema(
  {
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    dueDate: { type: Date },
    maxScore: { type: Number, default: 100 },
    assignmentType: { type: String, enum: ['text', 'quiz'], default: 'text' },
    questions: { type: [questionSchema], default: [] },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  },
  { timestamps: true }
);

export default mongoose.model('Assignment', assignmentSchema);
