import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema(
  {
    questionIndex: { type: Number, required: true, min: 0 },
    selectedOptionIndex: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const submissionSchema = new mongoose.Schema(
  {
    assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    content: { type: String, default: '' },
    fileUrl: { type: String, default: '' },
    answers: { type: [answerSchema], default: [] },
    correctAnswers: { type: Number, min: 0 },
    totalQuestions: { type: Number, min: 0 },
    submittedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['submitted', 'late', 'graded'], default: 'submitted' },
    score: { type: Number },
    feedback: { type: String, default: '' },
    timeSpentMinutes: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

submissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });

export default mongoose.model('Submission', submissionSchema);
