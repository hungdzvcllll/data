import Class from '../models/Class.js';
import Course from '../models/Course.js';
import Student from '../models/Student.js';
import { AppError } from '../middlewares/errorHandler.js';

export async function assertTeacherCourseAccess(user, courseId) {
  const course = await Course.findById(courseId);
  if (!course) throw new AppError('Không tìm thấy khóa học', 404);

  if (user.role === 'ADMIN') return course;

  if (user.role === 'TEACHER' && course.teacherId.toString() === user._id.toString()) {
    return course;
  }

  throw new AppError('Forbidden', 403);
}

export async function assertClassTeacherAccess(user, classId) {
  const cls = await Class.findById(classId);
  if (!cls) throw new AppError('Không tìm thấy lớp học', 404);
  if (user.role === 'ADMIN') return cls;
  if (user.role === 'TEACHER' && cls.teacherId.toString() === user._id.toString()) return cls;
  throw new AppError('Forbidden', 403);
}

export async function getStudentForUser(user) {
  const student = await Student.findOne({ userId: user._id });
  if (!student) throw new AppError('Tài khoản chưa liên kết hồ sơ sinh viên', 404);
  return student;
}

export async function assertStudentCourseAccess(user, courseId) {
  const student = await getStudentForUser(user);
  const course = await Course.findById(courseId);
  if (!course) throw new AppError('Không tìm thấy khóa học', 404);
  if (course.status !== 'published') throw new AppError('Khóa học chưa được công bố', 403);
  if (course.classId.toString() !== student.classId.toString()) {
    throw new AppError('Forbidden', 403);
  }
  return { student, course };
}

export async function assertStudentSelf(user, studentId) {
  if (user.role === 'STUDENT') {
    const student = await getStudentForUser(user);
    if (student._id.toString() !== studentId.toString()) {
      throw new AppError('Forbidden', 403);
    }
    return student;
  }
  const student = await Student.findById(studentId);
  if (!student) throw new AppError('Không tìm thấy sinh viên', 404);
  return student;
}
