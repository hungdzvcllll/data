import mongoose from 'mongoose';

const interventionSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    advisorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    predictionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Prediction' },
    interventionType: { type: String, required: true, trim: true },
    note: { type: String, required: true },
    actionPlan: { type: String, default: '' },
    status: {
      type: String,
      enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
      default: 'OPEN',
    },
    followUpDate: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model('Intervention', interventionSchema);
