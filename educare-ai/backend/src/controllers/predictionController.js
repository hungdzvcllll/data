import { asyncHandler, AppError } from '../middlewares/errorHandler.js';
import { predictFromRawFeatures } from '../services/studentPredictionService.js';
import Student from '../models/Student.js';
import Class from '../models/Class.js';
import Prediction from '../models/Prediction.js';
import StudentFeature from '../models/StudentFeature.js';
import { importStudentsAndPredict } from '../services/studentPredictionService.js';

export const predictSingle = asyncHandler(async (req, res) => {
  const { studentId, features } = req.body;
  if (!studentId || !features) throw new AppError('studentId và features là bắt buộc');

  const prediction = await predictFromRawFeatures(studentId, features);
  res.status(201).json({ message: 'Dự đoán thành công', prediction });
});

export const predictBatch = asyncHandler(async (req, res) => {
  const { classId, rows } = req.body;
  if (!classId || !rows?.length) throw new AppError('classId và rows là bắt buộc');

  const results = await importStudentsAndPredict(classId, rows);
  res.status(201).json({
    message: `Dự đoán batch thành công cho ${results.length} sinh viên`,
    count: results.length,
    predictions: results.map((r) => r.prediction),
  });
});

export const getClassPredictions = asyncHandler(async (req, res) => {
  const students = await Student.find({ classId: req.params.classId });
  const ids = students.map((s) => s._id);

  const predictions = await Prediction.aggregate([
    { $match: { studentId: { $in: ids } } },
    { $sort: { createdAt: -1 } },
    { $group: { _id: '$studentId', doc: { $first: '$$ROOT' } } },
  ]);

  res.json({ predictions: predictions.map((p) => p.doc) });
});

export const getStudentPredictions = asyncHandler(async (req, res) => {
  const predictions = await Prediction.find({ studentId: req.params.studentId })
    .sort({ createdAt: -1 })
    .populate('featureRecordId');
  res.json({ predictions });
});
