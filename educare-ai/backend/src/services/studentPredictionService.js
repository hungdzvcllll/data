import Student from '../models/Student.js';
import StudentFeature from '../models/StudentFeature.js';
import Prediction from '../models/Prediction.js';
import { predictBatch, predictSingle } from './predictionService.js';
import { analyzeRiskFactors } from './riskAnalysisService.js';
import { getRiskLevel, getEstimatedFinalGrade } from '../utils/riskUtils.js';
import { featureDocToMl, rowToMlFeatures } from '../utils/featureColumns.js';
import { rowToFeatureDoc } from './uploadService.js';
import { ensureStudentAccount } from './studentAccountService.js';
import { resolveMergedFeaturesForStudent } from './learningBehaviorService.js';
import { saveTeacherFeatureUpdate } from './studentFeatureService.js';
import { mapRowToEncodedFeatures, buildRawFeatures } from '../utils/featureMapper.js';
import { applyUploadDefaults, EXTERNAL_FIELD_DEFAULTS, BEHAVIOR_FIELD_DEFAULTS } from '../utils/uploadDefaults.js';
import { AppError } from '../middlewares/errorHandler.js';

const MODEL_VERSION = 'student_examscore_model.joblib';

async function buildPredictionPayload(student, featureDoc) {
  const docObj = featureDoc.toObject();
  const { features, featureSource, computedFeatures } = await resolveMergedFeaturesForStudent(
    student._id,
    featureDoc
  );

  const predictedScore = await predictSingle(features);
  const riskInput = { ...features, rawFeatures: docObj.rawFeatures };
  const riskAnalysis = analyzeRiskFactors(riskInput);

  return {
    predictedScore,
    riskAnalysis,
    featureSource,
    computedFeatures,
    mlFeatures: features,
  };
}

export async function createPredictionForStudent(student, featureDoc) {
  const payload = await buildPredictionPayload(student, featureDoc);

  return Prediction.create({
    studentId: student._id,
    featureRecordId: featureDoc._id,
    predictedScore: payload.predictedScore,
    riskLevel: getRiskLevel(payload.predictedScore),
    estimatedFinalGrade: getEstimatedFinalGrade(payload.predictedScore),
    riskFactors: payload.riskAnalysis.riskFactors,
    explanations: payload.riskAnalysis.explanations,
    recommendedActions: payload.riskAnalysis.recommendedActions,
    modelVersion: MODEL_VERSION,
    computedFeatures: payload.computedFeatures,
    featureSource: payload.featureSource,
  });
}

export async function repredictStudentWithBehavior(studentId, payload) {
  const student = await Student.findById(studentId);
  if (!student) throw new Error('Student not found');

  const teacherFeatures = payload?.features;
  const overrideKeys = payload?.overrideKeys;

  let featureDoc;
  if (teacherFeatures && Object.keys(teacherFeatures).length) {
    featureDoc = await saveTeacherFeatureUpdate(studentId, teacherFeatures, overrideKeys);
  } else {
    featureDoc = await StudentFeature.findOne({ studentId }).sort({ recordedAt: -1 });
    if (!featureDoc) throw new Error('Chưa có dữ liệu features từ Excel');
  }

  const prediction = await createPredictionForStudent(student, featureDoc);
  return { student, featureDoc, prediction };
}

export async function runBatchPredictions(studentsWithFeatures) {
  const batch = [];

  for (const item of studentsWithFeatures) {
    const { features, featureSource, computedFeatures } = await resolveMergedFeaturesForStudent(
      item.student._id,
      item.featureDoc
    );
    batch.push({
      student: item.student,
      studentId: item.student._id,
      studentCode: item.student.studentCode,
      featureDoc: item.featureDoc,
      mlFeatures: features,
      featureSource,
      computedFeatures,
    });
  }

  const scores = await predictBatch(batch.map((item) => ({
    student: item.student,
    studentId: item.studentId,
    studentCode: item.studentCode,
    features: item.mlFeatures,
  })));

  const predictions = [];

  for (const item of scores) {
    const match = batch.find(
      (s) => s.student.studentCode === item.studentCode
        || s.student._id.toString() === item.studentId
    );
    if (!match) continue;

    const mlFeatures = match.mlFeatures;
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
      computedFeatures: match.computedFeatures,
      featureSource: match.featureSource,
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

/** Update external (non-LMS) profile fields and re-predict. */
export async function importExternalProfiles(classId, validRows) {
  const results = [];

  for (const row of validRows) {
    const student = await Student.findOne({ studentCode: row.studentCode, classId });
    if (!student) {
      throw new AppError(`Không tìm thấy sinh viên ${row.studentCode} trong lớp này. Import danh sách trước.`, 400);
    }

    const latest = await StudentFeature.findOne({ studentId: student._id }).sort({ recordedAt: -1 });
    const baseRow = { StudentID: row.studentCode, Name: student.fullName, Class: '' };

    if (latest?.rawFeatures) {
      const rf = latest.rawFeatures;
      Object.assign(baseRow, {
        StudyHours: latest.encodedFeatures?.StudyHours ?? 0,
        Attendance: row.external.Attendance,
        AssignmentCompletion: rf.assignmentCompletion ?? 0,
        OnlineCourses: rf.onlineCourses ?? 0,
        Discussions: rf.discussions ?? 0,
        Extracurricular: row.external.Extracurricular,
        Resources: rf.resources ?? 'Low',
        Internet: row.external.Internet,
        EduTech: rf.eduTech ?? 'No',
        Gender: row.external.Gender,
        Age: row.external.Age,
        LearningStyle: rf.learningStyle ?? 'Visual',
        Motivation: rf.motivation ?? 'Medium',
        StressLevel: row.external.StressLevel,
      });
    } else {
      Object.assign(baseRow, applyUploadDefaults({
        ...BEHAVIOR_FIELD_DEFAULTS,
        ...EXTERNAL_FIELD_DEFAULTS,
        ...row.external,
        Gender: row.external.Gender,
        Age: row.external.Age,
        Attendance: row.external.Attendance,
        Internet: row.external.Internet,
        Extracurricular: row.external.Extracurricular,
        StressLevel: row.external.StressLevel,
      }, 'roster'));
    }

    const encodedFeatures = mapRowToEncodedFeatures({
      ...baseRow,
      Gender: row.external.Gender,
      Age: row.external.Age,
      Attendance: row.external.Attendance,
      Internet: row.external.Internet,
      Extracurricular: row.external.Extracurricular,
      StressLevel: row.external.StressLevel,
    });

    const mapped = {
      studentCode: row.studentCode,
      fullName: student.fullName,
      classLabel: '',
      gender: encodedFeatures.Gender,
      age: encodedFeatures.Age,
      email: null,
      rawFeatures: buildRawFeatures({
        ...baseRow,
        Gender: row.external.Gender,
        Age: row.external.Age,
        Attendance: row.external.Attendance,
        Internet: row.external.Internet,
        Extracurricular: row.external.Extracurricular,
        StressLevel: row.external.StressLevel,
      }),
      encodedFeatures,
      mlFeatures: encodedFeatures,
      uploadMode: 'external',
      profileComplete: true,
    };

    student.gender = mapped.gender;
    student.age = mapped.age;
    await student.save();

    const featureDoc = await StudentFeature.create(rowToFeatureDoc(mapped, student._id));
    const prediction = await createPredictionForStudent(student, featureDoc);

    results.push({ student, featureDoc, prediction, account: null });
  }

  return results;
}

export async function importStudentsRoster(classId, validRows) {
  return importStudentsAndPredict(classId, validRows);
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
    encodedFeatures: ml,
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
