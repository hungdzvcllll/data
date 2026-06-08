import { asyncHandler, AppError } from '../middlewares/errorHandler.js';
import * as courseService from '../services/courseService.js';
import {
  assertClassTeacherAccess,
  assertTeacherCourseAccess,
  getStudentForUser,
} from '../services/lmsAccessService.js';
import Course from '../models/Course.js';
import Lecture from '../models/Lecture.js';
import CourseResource from '../models/CourseResource.js';
import Assignment from '../models/Assignment.js';
import Submission from '../models/Submission.js';
import { buildMediaUrl } from '../middlewares/mediaUpload.js';

export const listCourses = asyncHandler(async (req, res) => {
  const courses = await courseService.listCoursesForTeacher(req.user);
  res.json({ success: true, courses });
});

export const createCourse = asyncHandler(async (req, res) => {
  await assertClassTeacherAccess(req.user, req.body.classId);
  const course = await courseService.createCourse(req.user, req.body);
  res.status(201).json({ success: true, course });
});

export const getCourse = asyncHandler(async (req, res) => {
  await assertTeacherCourseAccess(req.user, req.params.courseId);
  const detail = await courseService.getCourseDetailForTeacher(req.params.courseId);
  res.json({ success: true, ...detail });
});

export const updateCourse = asyncHandler(async (req, res) => {
  const course = await assertTeacherCourseAccess(req.user, req.params.courseId);
  const updated = await courseService.updateCourse(course, req.body);
  res.json({ success: true, course: updated });
});

export const deleteCourse = asyncHandler(async (req, res) => {
  const course = await assertTeacherCourseAccess(req.user, req.params.courseId);
  await courseService.deleteCourse(course);
  res.json({ success: true, message: 'Đã xóa khóa học' });
});

export const publishCourse = asyncHandler(async (req, res) => {
  const course = await assertTeacherCourseAccess(req.user, req.params.courseId);
  const published = await courseService.publishCourse(course);
  res.json({ success: true, course: published });
});

export const createLecture = asyncHandler(async (req, res) => {
  await assertTeacherCourseAccess(req.user, req.params.courseId);
  const lecture = await courseService.createLecture(req.params.courseId, req.body);
  res.status(201).json({ success: true, lecture });
});

export const listLectures = asyncHandler(async (req, res) => {
  await assertTeacherCourseAccess(req.user, req.params.courseId);
  const lectures = await courseService.listLectures(req.params.courseId);
  res.json({ success: true, lectures });
});

export const getLecture = asyncHandler(async (req, res) => {
  const lecture = await Lecture.findById(req.params.lectureId);
  if (!lecture) throw new AppError('Không tìm thấy bài giảng', 404);
  await assertTeacherCourseAccess(req.user, lecture.courseId);
  res.json({ success: true, lecture });
});

export const updateLecture = asyncHandler(async (req, res) => {
  const lecture = await Lecture.findById(req.params.lectureId);
  if (!lecture) throw new AppError('Không tìm thấy bài giảng', 404);
  await assertTeacherCourseAccess(req.user, lecture.courseId);
  const updated = await courseService.updateLecture(lecture, req.body);
  res.json({ success: true, lecture: updated });
});

export const deleteLecture = asyncHandler(async (req, res) => {
  const lecture = await Lecture.findById(req.params.lectureId);
  if (!lecture) throw new AppError('Không tìm thấy bài giảng', 404);
  await assertTeacherCourseAccess(req.user, lecture.courseId);
  await lecture.deleteOne();
  res.json({ success: true, message: 'Đã xóa bài giảng' });
});

export const uploadLectureMedia = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('Vui lòng chọn file video', 400);
  res.json({ success: true, url: buildMediaUrl(req.file.filename) });
});

export const createResource = asyncHandler(async (req, res) => {
  await assertTeacherCourseAccess(req.user, req.params.courseId);
  const resource = await courseService.createResource(req.params.courseId, req.body);
  res.status(201).json({ success: true, resource });
});

export const listResources = asyncHandler(async (req, res) => {
  await assertTeacherCourseAccess(req.user, req.params.courseId);
  const resources = await courseService.listResources(req.params.courseId);
  res.json({ success: true, resources });
});

export const getResource = asyncHandler(async (req, res) => {
  const resource = await CourseResource.findById(req.params.resourceId);
  if (!resource) throw new AppError('Không tìm thấy tài liệu', 404);
  await assertTeacherCourseAccess(req.user, resource.courseId);
  res.json({ success: true, resource });
});

export const updateResource = asyncHandler(async (req, res) => {
  const resource = await CourseResource.findById(req.params.resourceId);
  if (!resource) throw new AppError('Không tìm thấy tài liệu', 404);
  await assertTeacherCourseAccess(req.user, resource.courseId);
  const updated = await courseService.updateResource(resource, req.body);
  res.json({ success: true, resource: updated });
});

export const deleteResource = asyncHandler(async (req, res) => {
  const resource = await CourseResource.findById(req.params.resourceId);
  if (!resource) throw new AppError('Không tìm thấy tài liệu', 404);
  await assertTeacherCourseAccess(req.user, resource.courseId);
  await resource.deleteOne();
  res.json({ success: true, message: 'Đã xóa tài liệu' });
});

export const uploadResourceMedia = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('Vui lòng chọn file', 400);
  res.json({ success: true, url: buildMediaUrl(req.file.filename), fileType: req.file.originalname.split('.').pop() });
});

export const createAssignment = asyncHandler(async (req, res) => {
  const course = await assertTeacherCourseAccess(req.user, req.params.courseId);
  const assignment = await courseService.createAssignment(course, req.user, req.body);
  res.status(201).json({ success: true, assignment });
});

export const listAssignments = asyncHandler(async (req, res) => {
  await assertTeacherCourseAccess(req.user, req.params.courseId);
  const assignments = await courseService.listAssignments(req.params.courseId);
  res.json({ success: true, assignments });
});

export const getAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.assignmentId);
  if (!assignment) throw new AppError('Không tìm thấy bài tập', 404);
  await assertTeacherCourseAccess(req.user, assignment.courseId);
  res.json({ success: true, assignment });
});

export const updateAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.assignmentId);
  if (!assignment) throw new AppError('Không tìm thấy bài tập', 404);
  await assertTeacherCourseAccess(req.user, assignment.courseId);
  Object.assign(assignment, req.body);
  if (req.body.dueDate) assignment.dueDate = new Date(req.body.dueDate);
  await assignment.save();
  res.json({ success: true, assignment });
});

export const deleteAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.assignmentId);
  if (!assignment) throw new AppError('Không tìm thấy bài tập', 404);
  await assertTeacherCourseAccess(req.user, assignment.courseId);
  await Submission.deleteMany({ assignmentId: assignment._id });
  await assignment.deleteOne();
  res.json({ success: true, message: 'Đã xóa bài tập' });
});

export const publishAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.assignmentId);
  if (!assignment) throw new AppError('Không tìm thấy bài tập', 404);
  await assertTeacherCourseAccess(req.user, assignment.courseId);
  const published = await courseService.publishAssignment(assignment);
  res.json({ success: true, assignment: published });
});

export const listAssignmentSubmissions = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.assignmentId);
  if (!assignment) throw new AppError('Không tìm thấy bài tập', 404);
  await assertTeacherCourseAccess(req.user, assignment.courseId);
  const submissions = await courseService.listSubmissions(assignment._id);
  res.json({ success: true, submissions });
});

export const gradeSubmission = asyncHandler(async (req, res) => {
  const submission = await Submission.findById(req.params.submissionId).populate('assignmentId');
  if (!submission) throw new AppError('Không tìm thấy bài nộp', 404);
  await assertTeacherCourseAccess(req.user, submission.assignmentId.courseId);
  const graded = await courseService.gradeSubmission(submission, req.body);
  res.json({ success: true, submission: graded });
});

export const getLearningMonitor = asyncHandler(async (req, res) => {
  const rows = await courseService.getLearningMonitorRows(req.user, req.query);
  res.json({ success: true, students: rows });
});
