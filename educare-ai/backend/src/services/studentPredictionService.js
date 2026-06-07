import Student from '../models/Student.js';
import StudentFeature from '../models/StudentFeature.js';
import Prediction from '../models/Prediction.js';
import { predictBatch, predictSingle } from './predictionService.js';
import { analyzeRiskFactors } from './riskAnalysisService.js';
import { getRiskLevel, getEstimatedFinalGrade } from '../utils/riskUtils.js';
import { featureDocToMl, rowToMlFeatures } from '../utils/featureColumns.js';
import { rowToFeatureDoc } from './uploadService.js';
import { ensureStudentAccount } from './studentAccountService.js';

const MODEL_VERSION = 'student_examscore_model.joblib';

export async function createPredictionForStudent(student, featureDoc) {
  const docObj = featureDoc.toObject();
  const mlFeatures = featureDocToMl(docObj);
  const predictedScore = await predictSingle(mlFeatures);
  const riskInput = { ...mlFeatures, rawFeatures: docObj.rawFeatures };
  const riskAnalysis = analyzeRiskFactors(riskInput);

  return Prediction.create({
    studentId: student._id,
    featureRecordId: featureDoc._id,
    predictedScore,
    riskLevel: getRiskLevel(predictedScore),
    estimatedFinalGrade: getEstimatedFinalGrade(predictedScore),
    riskFactors: riskAnalysis.riskFactors,
    explanations: riskAnalysis.explanations,
    recommendedActions: riskAnalysis.recommendedActions,
    modelVersion: MODEL_VERSION,
  });
}

export async function runBatchPredictions(studentsWithFeatures) {
  const batchInput = studentsWithFeatures.map(({ student, featureDoc }) => ({
    student,
    studentId: student._id,
    studentCode: student.studentCode,
    featureDoc,
  }));

  const scores = await predictBatch(batchInput);
  const predictions = [];

  for (const item of scores) {
    const match = studentsWithFeatures.find(
      (s) => s.student.studentCode === item.studentCode
        || s.student._id.toString() === item.studentId
    );
    if (!match) continue;

    const mlFeatures = featureDocToMl(match.featureDoc.toObject());
    const riskInput = {
      ...mlFeatures,
      rawFeatures: match.featureDoc.rawFeatures,
    };
    const riskAnalysis = analyzeRiskFactors(riskInput);

    predictions.push(await Prediction.create({
      studentId: match.student._id,
      featureRecordId: match.featureDoc._id,
      predictedScore: item.predictedScore,
      riskLevel: getRiskLevel(item.predictedScore),
      estimatedFinalGrade: getEstimatedFinalGrade(item.predictedScore),
      riskFactors: riskAnalysis.riskFactors,
      explanations: riskAnalysis.explanations,
      recommendedActions: riskAnalysis.recommendedActions,
      modelVersion: MODEL_VERSION,
    }));
  }

  return predictions;
}

export async function importStudentsAndPredict(classId, validRows) {
  const results = [];

  for (const row of validRows) {
    let student = await Student.findOne({ studentCode: row.studentCode, classId });
    if (!student) {
      student = await Student.create({
        studentCode: row.studentCode,
        fullName: row.fullName,
        classId,
        gender: row.gender,
        age: row.age,
      });
    } else {
      student.fullName = row.fullName;
      student.gender = row.gender;
      student.age = row.age;
      await student.save();
    }

    const featureDoc = await StudentFeature.create(rowToFeatureDoc(row, student._id));
    const prediction = await createPredictionForStudent(student, featureDoc);

    let account = null;
    try {
      account = await ensureStudentAccount({
        student,
        email: row.email || undefined,
      });
    } catch (err) {
      account = {
        studentCode: student.studentCode,
        fullName: student.fullName,
        email: null,
        password: null,
        isNewAccount: false,
        error: err.message,
      };
    }

    results.push({ student, featureDoc, prediction, account });
  }

  return results;
}

export async function predictFromRawFeatures(studentId, rawFeatures) {
  const student = await Student.findById(studentId);
  if (!student) throw new Error('Student not found');

  const ml = rowToMlFeatures({
    ...rawFeatures,
    Gender: rawFeatures.Gender ?? student.gender,
    Age: rawFeatures.Age ?? student.age,
  });

  const featureDoc = await StudentFeature.create({
    studentId: student._id,
    studyHours: ml.StudyHours,
    attendance: ml.Attendance,
    assignmentCompletion: ml.AssignmentCompletion,
    onlineCourses: ml.OnlineCourses,
    discussions: ml.Discussions,
    extracurricular: ml.Extracurricular,
    resources: ml.Resources,
    internet: ml.Internet,
    eduTech: ml.EduTech,
    learningStyle: ml.LearningStyle,
    motivation: ml.Motivation,
    stressLevel: ml.StressLevel,
    recordedAt: new Date(),
  });

  return createPredictionForStudent(student, featureDoc);
}

export async function getLatestPrediction(studentId) {
  return Prediction.findOne({ studentId }).sort({ createdAt: -1 });
}

export async function getPredictionHistory(studentId) {
  return Prediction.find({ studentId }).sort({ createdAt: -1 }).populate('featureRecordId');
}
