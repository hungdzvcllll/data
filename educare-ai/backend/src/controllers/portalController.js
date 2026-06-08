import { asyncHandler, AppError } from '../middlewares/errorHandler.js';
import * as courseService from '../services/courseService.js';
import { getStudentForUser, assertStudentCourseAccess } from '../services/lmsAccessService.js';
import { getComputedFeaturesForStudent } from '../services/learningBehaviorService.js';
import { getBehaviorSummary } from '../services/behaviorFeatureService.js';
import { repredictStudentWithBehavior } from '../services/studentPredictionService.js';
import { formatRiskLevel } from '../utils/riskUtils.js';
import {
  trackVideoProgress,
  trackResourceView,
  trackCourseOpen,
  trackAssignmentStart,
  submitAssignment,
  trackDiscussionPost,
} from '../services/learningEventService.js';
import Lecture from '../models/Lecture.js';
import CourseResource from '../models/CourseResource.js';
import Assignment from '../models/Assignment.js';
import Submission from '../models/Submission.js';
import DiscussionPost from '../models/DiscussionPost.js';
import LectureProgress from '../models/LectureProgress.js';
import { sanitizeAssignmentForStudent } from '../services/quizAssignmentService.js';

export const getPortalCourses = asyncHandler(async (req, res) => {
  const student = await getStudentForUser(req.user);
  const courses = await courseService.listPublishedCoursesForStudent(student);

  const enriched = await Promise.all(courses.map(async (course) => {
    const [lectures, resources, assignments] = await Promise.all([
      courseService.listLectures(course._id),
      courseService.listResources(course._id),
      courseService.listAssignments(course._id),
    ]);
    return {
      ...course.toObject(),
      lectureCount: lectures.length,
      resourceCount: resources.length,
      assignmentCount: assignments.filter((a) => a.status === 'published').length,
    };
  }));

  res.json({ success: true, courses: enriched });
});

export const getPortalCourseDetail = asyncHandler(async (req, res) => {
  const student = await getStudentForUser(req.user);
  const detail = await courseService.getPortalCourseDetail(student, req.params.courseId);
  res.json({ success: true, ...detail });
});

export const getPortalLecture = asyncHandler(async (req, res) => {
  const student = await getStudentForUser(req.user);
  const lecture = await Lecture.findById(req.params.lectureId);
  if (!lecture) throw new AppError('Không tìm thấy bài giảng', 404);
  await assertStudentCourseAccess(req.user, lecture.courseId);

  const progress = await LectureProgress.findOne({
    studentId: student._id,
    lectureId: lecture._id,
  });

  res.json({ success: true, lecture, progress });
});

export const getPortalResource = asyncHandler(async (req, res) => {
  const resource = await CourseResource.findById(req.params.resourceId);
  if (!resource) throw new AppError('Không tìm thấy tài liệu', 404);
  await assertStudentCourseAccess(req.user, resource.courseId);
  res.json({ success: true, resource });
});

export const getPortalAssignments = asyncHandler(async (req, res) => {
  const student = await getStudentForUser(req.user);
  const assignments = await Assignment.find({
    classId: student.classId,
    status: 'published',
  }).populate('courseId', 'title').sort({ dueDate: 1 });

  const submissions = await courseService.listStudentSubmissions(student._id);
  res.json({ success: true, assignments, submissions });
});

export const getPortalAssignment = asyncHandler(async (req, res) => {
  const student = await getStudentForUser(req.user);
  const assignment = await Assignment.findById(req.params.assignmentId);
  if (!assignment) throw new AppError('Không tìm thấy bài tập', 404);
  await assertStudentCourseAccess(req.user, assignment.courseId);

  const submission = await Submission.findOne({
    assignmentId: assignment._id,
    studentId: student._id,
  });

  res.json({
    success: true,
    assignment: sanitizeAssignmentForStudent(assignment),
    submission,
  });
});

export const getPortalProgress = asyncHandler(async (req, res) => {
  const student = await getStudentForUser(req.user);
  const progress = await courseService.getStudentProgress(student);
  let computedFeaturePreview = null;
  try {
    computedFeaturePreview = await getComputedFeaturesForStudent(student._id);
  } catch {
    computedFeaturePreview = null;
  }

  res.json({
    success: true,
    ...progress,
    behaviorSummary: getBehaviorSummary(progress.behavior),
    computedFeaturePreview,
  });
});

export const portalRepredict = asyncHandler(async (req, res) => {
  const student = await getStudentForUser(req.user);
  const result = await repredictStudentWithBehavior(student._id);
  const risk = formatRiskLevel(result.prediction.riskLevel);
  res.status(201).json({
    success: true,
    predictedScore: result.prediction.predictedScore,
    riskLevel: result.prediction.riskLevel,
    riskLabelVi: risk.labelVi,
    computedFeatures: result.prediction.computedFeatures,
    featureSource: result.prediction.featureSource,
    prediction: result.prediction,
  });
});

export const postVideoProgress = asyncHandler(async (req, res) => {
  const result = await trackVideoProgress(req.user, req.body);
  res.json({ success: true, ...result });
});

export const postResourceView = asyncHandler(async (req, res) => {
  await trackResourceView(req.user, req.body);
  res.json({ success: true, message: 'Đã ghi nhận lượt xem tài liệu' });
});

export const postCourseOpen = asyncHandler(async (req, res) => {
  await trackCourseOpen(req.user, req.body.courseId);
  res.json({ success: true });
});

export const postAssignmentStart = asyncHandler(async (req, res) => {
  await trackAssignmentStart(req.user, req.body.assignmentId);
  res.json({ success: true });
});

export const postAssignmentSubmit = asyncHandler(async (req, res) => {
  const submission = await submitAssignment(req.user, req.params.assignmentId, req.body);
  res.status(201).json({ success: true, submission });
});

export const postDiscussion = asyncHandler(async (req, res) => {
  const post = await trackDiscussionPost(
    req.user,
    req.params.courseId,
    req.body.content,
    req.body.parentId
  );
  res.status(201).json({ success: true, post });
});

export const getPortalDiscussions = asyncHandler(async (req, res) => {
  await assertStudentCourseAccess(req.user, req.params.courseId);
  const posts = await DiscussionPost.find({ courseId: req.params.courseId, parentId: null })
    .populate('studentId', 'fullName studentCode')
    .sort({ createdAt: -1 });
  res.json({ success: true, posts });
});
