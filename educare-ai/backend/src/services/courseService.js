import Course from '../models/Course.js';
import Lecture from '../models/Lecture.js';
import CourseResource from '../models/CourseResource.js';
import Assignment from '../models/Assignment.js';
import Submission from '../models/Submission.js';
import Student from '../models/Student.js';
import LectureProgress from '../models/LectureProgress.js';
import DiscussionPost from '../models/DiscussionPost.js';
import StudentLearningBehavior from '../models/StudentLearningBehavior.js';
import { AppError } from '../middlewares/errorHandler.js';
import { syncAssignmentBehavior } from './behaviorSyncService.js';
import { getLatestPrediction } from './studentPredictionService.js';
import { RISK_LABELS_VI } from '../utils/riskUtils.js';
import {
  assertQuizAssignment,
  normalizeQuizQuestions,
} from './quizAssignmentService.js';

function assertUploadedVideoUrl(videoUrl) {
  if (!videoUrl || typeof videoUrl !== 'string') {
    throw new AppError('Vui lòng upload file video.', 400);
  }
  if (!videoUrl.startsWith('/uploads/')) {
    throw new AppError('Chỉ chấp nhận video đã upload lên hệ thống (/uploads/).', 400);
  }
}

export async function createCourse(user, data) {
  return Course.create({
    title: data.title,
    description: data.description || '',
    classId: data.classId,
    teacherId: user._id,
    status: data.status || 'draft',
  });
}

export async function listCoursesForTeacher(user) {
  const filter = user.role === 'ADMIN' ? {} : { teacherId: user._id };
  return Course.find(filter).populate('classId', 'className courseName').sort({ updatedAt: -1 });
}

export async function getCourseById(courseId) {
  const course = await Course.findById(courseId).populate('classId', 'className courseName');
  if (!course) throw new AppError('Không tìm thấy khóa học', 404);
  return course;
}

export async function updateCourse(course, data) {
  if (data.title !== undefined) course.title = data.title;
  if (data.description !== undefined) course.description = data.description;
  if (data.classId !== undefined) course.classId = data.classId;
  if (data.status !== undefined) course.status = data.status;
  await course.save();
  return course;
}

export async function deleteCourse(course) {
  const courseId = course._id;
  await Promise.all([
    Lecture.deleteMany({ courseId }),
    CourseResource.deleteMany({ courseId }),
    Assignment.deleteMany({ courseId }),
    DiscussionPost.deleteMany({ courseId }),
  ]);
  await course.deleteOne();
}

export async function publishCourse(course) {
  course.status = 'published';
  await course.save();
  return course;
}

export async function getCourseDetailForTeacher(courseId) {
  const course = await getCourseById(courseId);
  const [lectures, resources, assignments, students] = await Promise.all([
    Lecture.find({ courseId }).sort({ order: 1 }),
    CourseResource.find({ courseId }).sort({ order: 1 }),
    Assignment.find({ courseId }).sort({ createdAt: -1 }),
    Student.find({ classId: course.classId }),
  ]);
  return { course, lectures, resources, assignments, students };
}

export async function createLecture(courseId, data) {
  assertUploadedVideoUrl(data.videoUrl);
  return Lecture.create({
    courseId,
    title: data.title,
    description: data.description || '',
    type: 'video',
    videoUrl: data.videoUrl,
    durationSeconds: Number(data.durationSeconds) || 0,
    order: Number(data.order) || 0,
  });
}

export async function listLectures(courseId) {
  return Lecture.find({ courseId }).sort({ order: 1 });
}

export async function updateLecture(lecture, data) {
  if (data.videoUrl !== undefined) {
    assertUploadedVideoUrl(data.videoUrl);
  }
  Object.assign(lecture, {
    ...(data.title !== undefined && { title: data.title }),
    ...(data.description !== undefined && { description: data.description }),
    ...(data.videoUrl !== undefined && { videoUrl: data.videoUrl }),
    ...(data.durationSeconds !== undefined && { durationSeconds: Number(data.durationSeconds) }),
    ...(data.order !== undefined && { order: Number(data.order) }),
  });
  await lecture.save();
  return lecture;
}

export async function createResource(courseId, data) {
  return CourseResource.create({
    courseId,
    title: data.title,
    description: data.description || '',
    fileUrl: data.fileUrl,
    fileType: data.fileType || 'pdf',
    order: Number(data.order) || 0,
  });
}

export async function listResources(courseId) {
  return CourseResource.find({ courseId }).sort({ order: 1 });
}

export async function updateResource(resource, data) {
  Object.assign(resource, data);
  await resource.save();
  return resource;
}

export async function createAssignment(course, user, data) {
  const assignmentType = data.assignmentType || (data.questions?.length ? 'quiz' : 'text');

  if (assignmentType === 'quiz') {
    assertQuizAssignment({ ...data, assignmentType: 'quiz' });
  }

  const assignment = await Assignment.create({
    courseId: course._id,
    classId: course.classId,
    teacherId: user._id,
    title: data.title,
    description: data.description || '',
    dueDate: data.dueDate ? new Date(data.dueDate) : null,
    maxScore: Number(data.maxScore) || 100,
    assignmentType,
    questions: assignmentType === 'quiz'
      ? normalizeQuizQuestions(data.questions)
      : [],
    status: data.status || 'draft',
  });

  if (assignment.status === 'published') {
    const students = await Student.find({ classId: course.classId });
    await Promise.all(students.map((s) => syncAssignmentBehavior(s._id)));
  }

  return assignment;
}

export async function listAssignments(courseId) {
  return Assignment.find({ courseId }).sort({ createdAt: -1 });
}

export async function publishAssignment(assignment) {
  assignment.status = 'published';
  await assignment.save();

  const students = await Student.find({ classId: assignment.classId });
  await Promise.all(students.map((s) => syncAssignmentBehavior(s._id)));

  return assignment;
}

export async function gradeSubmission(submission, data) {
  submission.score = data.score;
  submission.feedback = data.feedback || '';
  submission.status = 'graded';
  await submission.save();
  return submission;
}

export async function listSubmissions(assignmentId) {
  return Submission.find({ assignmentId }).populate('studentId', 'studentCode fullName');
}

export async function listStudentSubmissions(studentId) {
  return Submission.find({ studentId }).populate('assignmentId', 'title dueDate maxScore');
}

export async function listPublishedCoursesForStudent(student) {
  return Course.find({ classId: student.classId, status: 'published' })
    .populate('classId', 'className courseName')
    .sort({ updatedAt: -1 });
}

export async function getPortalCourseDetail(student, courseId) {
  const course = await Course.findOne({
    _id: courseId,
    classId: student.classId,
    status: 'published',
  });
  if (!course) throw new AppError('Không tìm thấy khóa học', 404);

  const [lectures, resources, assignments, discussions, progress] = await Promise.all([
    Lecture.find({ courseId }).sort({ order: 1 }),
    CourseResource.find({ courseId }).sort({ order: 1 }),
    Assignment.find({ courseId, status: 'published' }).sort({ dueDate: 1 }),
    DiscussionPost.find({ courseId, parentId: null }).populate('studentId', 'fullName studentCode').sort({ createdAt: -1 }),
    LectureProgress.find({ studentId: student._id, lectureId: { $in: (await Lecture.find({ courseId })).map((l) => l._id) } }),
  ]);

  const submissions = await Submission.find({
    studentId: student._id,
    assignmentId: { $in: assignments.map((a) => a._id) },
  });

  const completedLectures = progress.filter((p) => p.completed).length;
  const totalItems = lectures.length + assignments.length;
  const progressPercent = totalItems
    ? Math.round(((completedLectures + submissions.length) / totalItems) * 100)
    : 0;

  return {
    course,
    lectures,
    resources,
    assignments,
    discussions,
    lectureProgress: progress,
    submissions,
    progressPercent,
  };
}

export async function getStudentProgress(student) {
  const behavior = await StudentLearningBehavior.findOne({ studentId: student._id });
  const prediction = await getLatestPrediction(student._id);
  const courses = await listPublishedCoursesForStudent(student);

  return {
    behavior,
    prediction,
    riskLabelVi: prediction ? RISK_LABELS_VI[prediction.riskLevel] : null,
    coursesCount: courses.length,
  };
}

export async function getLearningMonitorRows(user, filters = {}) {
  let classIds = [];
  if (filters.classId) {
    classIds = [filters.classId];
  } else if (user.role === 'TEACHER') {
    const Class = (await import('../models/Class.js')).default;
    classIds = (await Class.find({ teacherId: user._id })).map((c) => c._id);
  }

  const studentFilter = classIds.length ? { classId: { $in: classIds } } : {};
  const students = await Student.find(studentFilter).populate('classId', 'className');

  const rows = [];
  for (const student of students) {
    const [behavior, prediction] = await Promise.all([
      StudentLearningBehavior.findOne({ studentId: student._id }),
      getLatestPrediction(student._id),
    ]);

    if (filters.riskLevel && prediction?.riskLevel !== filters.riskLevel) continue;

    const totalMinutes = (behavior?.videoWatchMinutes || 0)
      + (behavior?.assignmentWorkMinutes || 0)
      + (behavior?.readingMinutes || 0);
    const studyHours = totalMinutes / 60;

    if (filters.lowStudyHours && studyHours >= 5) continue;

    if (filters.lowAssignmentCompletion) {
      const completion = behavior?.totalAssignments
        ? ((behavior.submittedAssignments || 0) / behavior.totalAssignments) * 100
        : 100;
      if (completion >= 50) continue;
    }

    if (filters.noActivity) {
      if (!behavior?.lastActivityAt) {
        // no activity ever — keep
      } else {
        const days = (Date.now() - new Date(behavior.lastActivityAt).getTime()) / 86400000;
        if (days < 7) continue;
      }
    }

    rows.push({
      studentId: student._id,
      studentCode: student.studentCode,
      fullName: student.fullName,
      className: student.classId?.className,
      studyHours: Math.round((totalMinutes / 60) * 10) / 10,
      videoWatchMinutes: behavior?.videoWatchMinutes || 0,
      assignmentCompletion: behavior?.totalAssignments
        ? Math.round(((behavior.submittedAssignments || 0) / behavior.totalAssignments) * 100)
        : null,
      resourceViews: behavior?.resourceViews || 0,
      discussionActivity: (behavior?.discussionPosts || 0) + (behavior?.discussionReplies || 0),
      onlineCourses: behavior?.completedOnlineCourses || behavior?.completedModulesCount || 0,
      eduTechUsage: behavior?.eduTechUsageCount || 0,
      predictedScore: prediction?.predictedScore ?? null,
      riskLevel: prediction?.riskLevel ?? null,
      lastActivity: behavior?.lastActivityAt || null,
    });
  }

  return rows;
}
