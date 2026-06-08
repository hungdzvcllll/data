import LearningEvent from '../models/LearningEvent.js';
import Lecture from '../models/Lecture.js';
import CourseResource from '../models/CourseResource.js';
import Assignment from '../models/Assignment.js';
import LectureProgress from '../models/LectureProgress.js';
import DiscussionPost from '../models/DiscussionPost.js';
import {
  getOrCreateBehavior,
  incrementBehavior,
  syncAssignmentBehavior,
  syncModuleProgress,
} from './behaviorSyncService.js';
import { assertStudentCourseAccess, getStudentForUser } from './lmsAccessService.js';
import { AppError } from '../middlewares/errorHandler.js';
import {
  gradeQuizSubmission,
  validateStudentQuizAnswers,
} from './quizAssignmentService.js';
import Submission from '../models/Submission.js';

async function logEvent(payload) {
  return LearningEvent.create(payload);
}

export async function trackVideoProgress(user, body) {
  const student = await getStudentForUser(user);
  const lecture = await Lecture.findById(body.lectureId);
  if (!lecture) throw new AppError('Không tìm thấy bài giảng', 404);

  await assertStudentCourseAccess(user, lecture.courseId);

  const watchedSeconds = Math.max(0, Math.min(Number(body.watchedSeconds) || 0, 120));
  const currentTime = Math.max(0, Number(body.currentTime) || 0);

  let progress = await LectureProgress.findOne({
    studentId: student._id,
    lectureId: lecture._id,
  });

  if (!progress) {
    progress = new LectureProgress({
      studentId: student._id,
      lectureId: lecture._id,
      watchedSeconds: 0,
      currentTime: 0,
      completed: false,
    });
  }

  const cap = lecture.durationSeconds > 0 ? lecture.durationSeconds : progress.watchedSeconds + watchedSeconds;
  const newWatched = Math.min(progress.watchedSeconds + watchedSeconds, cap);
  const addedSeconds = newWatched - progress.watchedSeconds;

  progress.watchedSeconds = newWatched;
  progress.currentTime = currentTime;

  const threshold = lecture.durationSeconds > 0 ? lecture.durationSeconds * 0.8 : newWatched;
  if (!progress.completed && newWatched >= threshold) {
    progress.completed = true;
  }

  await progress.save();

  if (addedSeconds > 0) {
    await incrementBehavior(student._id, {
      videoWatchMinutes: addedSeconds / 60,
    });
  }

  if (progress.completed) {
    await syncModuleProgress(student._id);
  }

  await logEvent({
    studentId: student._id,
    courseId: lecture.courseId,
    targetType: 'video',
    targetId: lecture._id,
    eventType: 'video_progress',
    value: addedSeconds,
    metadata: { currentTime, completed: progress.completed },
  });

  return { progress, addedSeconds };
}

export async function trackResourceView(user, body) {
  const student = await getStudentForUser(user);
  const resource = await CourseResource.findById(body.resourceId);
  if (!resource) throw new AppError('Không tìm thấy tài liệu', 404);

  await assertStudentCourseAccess(user, resource.courseId);

  await incrementBehavior(student._id, {
    resourceViews: 1,
    eduTechUsageCount: 1,
    readingMinutes: 1,
  });

  await logEvent({
    studentId: student._id,
    courseId: resource.courseId,
    targetType: 'resource',
    targetId: resource._id,
    eventType: 'resource_view',
    value: 1,
  });

  return { success: true };
}

export async function trackCourseOpen(user, courseId) {
  const { student, course } = await assertStudentCourseAccess(user, courseId);
  const behavior = await getOrCreateBehavior(student._id);
  behavior.eduTechUsageCount += 1;
  behavior.optionalLearningActivities += 1;
  behavior.loginDaysPerWeek = Math.min(7, Math.max(behavior.loginDaysPerWeek, 1));
  behavior.lastActivityAt = new Date();
  await behavior.save();

  await logEvent({
    studentId: student._id,
    courseId: course._id,
    targetType: 'course',
    targetId: course._id,
    eventType: 'course_open',
    value: 1,
  });

  return { success: true };
}

export async function trackAssignmentStart(user, assignmentId) {
  const student = await getStudentForUser(user);
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) throw new AppError('Không tìm thấy bài tập', 404);
  if (assignment.status !== 'published') throw new AppError('Bài tập chưa được công bố', 403);
  await assertStudentCourseAccess(user, assignment.courseId);

  await incrementBehavior(student._id, { eduTechUsageCount: 1 });

  await logEvent({
    studentId: student._id,
    courseId: assignment.courseId,
    targetType: 'assignment',
    targetId: assignment._id,
    eventType: 'assignment_start',
    value: 1,
  });

  return { success: true };
}

export async function submitAssignment(user, assignmentId, payload) {
  const student = await getStudentForUser(user);
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) throw new AppError('Không tìm thấy bài tập', 404);
  if (assignment.status !== 'published') throw new AppError('Bài tập chưa được công bố', 403);
  await assertStudentCourseAccess(user, assignment.courseId);

  const timeSpentMinutes = Math.max(0, Number(payload.timeSpentMinutes) || 0);
  const now = new Date();
  const isLate = assignment.dueDate && now > new Date(assignment.dueDate);
  const submissionStatus = isLate ? 'late' : 'submitted';

  let submissionPayload;

  if (assignment.assignmentType === 'quiz') {
    const answerErrors = validateStudentQuizAnswers(assignment, payload.answers || []);
    if (answerErrors.length) {
      throw new AppError(answerErrors.join(' '), 400);
    }

    const { correctAnswers, totalQuestions, score } = gradeQuizSubmission(
      assignment,
      payload.answers
    );

    submissionPayload = {
      answers: payload.answers.map((a) => ({
        questionIndex: Number(a.questionIndex),
        selectedOptionIndex: Number(a.selectedOptionIndex),
      })),
      correctAnswers,
      totalQuestions,
      score,
      content: '',
      fileUrl: '',
      submittedAt: now,
      status: submissionStatus,
      timeSpentMinutes,
    };
  } else {
    submissionPayload = {
      content: payload.content || '',
      fileUrl: payload.fileUrl || '',
      submittedAt: now,
      status: submissionStatus,
      timeSpentMinutes,
    };
  }

  const submission = await Submission.findOneAndUpdate(
    { assignmentId: assignment._id, studentId: student._id },
    submissionPayload,
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await syncAssignmentBehavior(student._id);
  await incrementBehavior(student._id, {
    eduTechUsageCount: 1,
    practiceMinutes: timeSpentMinutes,
  });

  await logEvent({
    studentId: student._id,
    courseId: assignment.courseId,
    targetType: 'assignment',
    targetId: assignment._id,
    eventType: 'assignment_submit',
    value: timeSpentMinutes,
    metadata: {
      late: isLate,
      assignmentType: assignment.assignmentType,
      score: submission.score ?? null,
    },
  });

  return submission;
}

export async function trackDiscussionPost(user, courseId, content, parentId = null) {
  const { student, course } = await assertStudentCourseAccess(user, courseId);

  const post = await DiscussionPost.create({
    courseId: course._id,
    studentId: student._id,
    content,
    parentId: parentId || null,
  });

  if (parentId) {
    await incrementBehavior(student._id, { discussionReplies: 1, eduTechUsageCount: 1 });
    await logEvent({
      studentId: student._id,
      courseId: course._id,
      targetType: 'discussion',
      targetId: post._id,
      eventType: 'discussion_reply',
      value: 1,
    });
  } else {
    await incrementBehavior(student._id, { discussionPosts: 1, eduTechUsageCount: 1 });
    await logEvent({
      studentId: student._id,
      courseId: course._id,
      targetType: 'discussion',
      targetId: post._id,
      eventType: 'discussion_post',
      value: 1,
    });
  }

  return post;
}
