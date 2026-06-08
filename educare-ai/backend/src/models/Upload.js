import mongoose from 'mongoose';

const uploadSchema = new mongoose.Schema(
  {
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fileName: { type: String, required: true },
    uploadMode: {
      type: String,
      enum: ['full', 'roster', 'external'],
      default: 'full',
    },
    status: {
      type: String,
      enum: ['PENDING', 'VALIDATED', 'IMPORTED', 'FAILED'],
      default: 'PENDING',
    },
    previewRows: [{ type: mongoose.Schema.Types.Mixed }],
    parsedRows: [{ type: mongoose.Schema.Types.Mixed }],
    validationErrors: [{ type: mongoose.Schema.Types.Mixed }],
    totalRows: { type: Number, default: 0 },
    validRows: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model('Upload', uploadSchema);
