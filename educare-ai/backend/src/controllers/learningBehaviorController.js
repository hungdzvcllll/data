import { asyncHandler } from '../middlewares/errorHandler.js';
import {
  assertLearningBehaviorAccess,
  getComputedFeaturesForStudent,
  getLearningBehavior,
  upsertLearningBehavior,
} from '../services/learningBehaviorService.js';
import { repredictStudentWithBehavior } from '../services/studentPredictionService.js';
import { formatRiskLevel } from '../utils/riskUtils.js';

export const recordLearningBehavior = asyncHandler(async (req, res) => {
  await assertLearningBehaviorAccess(req.user, req.params.studentId);
  const behavior = await upsertLearningBehavior(req.params.studentId, req.body);

  res.status(201).json({
    success: true,
    message: 'Đã lưu hành vi học tập',
    behavior,
  });
});

export const getStudentLearningBehavior = asyncHandler(async (req, res) => {
  await assertLearningBehaviorAccess(req.user, req.params.studentId);
  const behavior = await getLearningBehavior(req.params.studentId);

  if (!behavior) {
    return res.json({ success: true, behavior: null, message: 'Chưa có dữ liệu hành vi học tập' });
  }

  res.json({ success: true, behavior });
});

export const getStudentComputedFeatures = asyncHandler(async (req, res) => {
  await assertLearningBehaviorAccess(req.user, req.params.studentId);
  const result = await getComputedFeaturesForStudent(req.params.studentId);

  res.json({
    success: true,
    ...result,
  });
});

export const repredictWithBehavior = asyncHandler(async (req, res) => {
  await assertLearningBehaviorAccess(req.user, req.params.studentId);
  const result = await repredictStudentWithBehavior(req.params.studentId, req.body);
  const risk = formatRiskLevel(result.prediction.riskLevel);

  res.status(201).json({
    success: true,
    message: 'Dự đoán lại thành công với features từ hành vi học tập',
    predictedScore: result.prediction.predictedScore,
    riskLevel: result.prediction.riskLevel,
    riskLabelVi: risk.labelVi,
    estimatedFinalGrade: result.prediction.estimatedFinalGrade,
    riskFactors: result.prediction.riskFactors,
    recommendedActions: result.prediction.recommendedActions,
    computedFeatures: result.prediction.computedFeatures,
    featureSource: result.prediction.featureSource,
    prediction: result.prediction,
  });
});
