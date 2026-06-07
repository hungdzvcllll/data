import mongoose from 'mongoose';

const predictionSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    featureRecordId: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentFeature', required: true },
    predictedScore: { type: Number, required: true },
    riskLevel: {
      type: String,
      enum: ['EXCELLENT', 'STABLE', 'AT_RISK', 'HIGH_RISK'],
      required: true,
    },
    estimatedFinalGrade: { type: Number, min: 0, max: 3 },
    riskFactors: [{ type: String }],
    explanations: [{ type: String }],
    recommendedActions: [{ type: String }],
    modelVersion: { type: String, default: 'student_examscore_model.joblib' },
  },
  { timestamps: true }
);

export default mongoose.model('Prediction', predictionSchema);
