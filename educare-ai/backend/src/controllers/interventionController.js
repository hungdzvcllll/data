import * as interventionService from '../services/interventionService.js';
import Student from '../models/Student.js';
import Class from '../models/Class.js';
import { AppError, asyncHandler } from '../middlewares/errorHandler.js';

async function assertStudentAccess(user, studentId) {
  const student = await Student.findById(studentId);
  if (!student) throw new AppError('Không tìm thấy sinh viên', 404);
  const cls = await Class.findById(student.classId);
  if (user.role === 'TEACHER' && cls.teacherId.toString() !== user._id.toString()) {
    throw new AppError('Forbidden', 403);
  }
  return student;
}

export const listByStudent = asyncHandler(async (req, res) => {
  await assertStudentAccess(req.user, req.params.studentId);
  const interventions = await interventionService.listByStudent(req.params.studentId);
  res.json({ interventions });
});

export const getIntervention = asyncHandler(async (req, res) => {
  const item = await interventionService.getById(req.params.id);
  if (!item) throw new AppError('Không tìm thấy intervention', 404);
  await assertStudentAccess(req.user, item.studentId._id || item.studentId);
  res.json({ intervention: item });
});

export const createIntervention = asyncHandler(async (req, res) => {
  await assertStudentAccess(req.user, req.body.studentId);
  const intervention = await interventionService.create({
    ...req.body,
    advisorId: req.user._id,
  });
  res.status(201).json({ message: 'Tạo ghi chú can thiệp thành công', intervention });
});

export const updateIntervention = asyncHandler(async (req, res) => {
  const existing = await interventionService.getById(req.params.id);
  if (!existing) throw new AppError('Không tìm thấy intervention', 404);
  await assertStudentAccess(req.user, existing.studentId._id || existing.studentId);

  const intervention = await interventionService.update(req.params.id, req.body);
  res.json({ message: 'Cập nhật intervention thành công', intervention });
});

export const deleteIntervention = asyncHandler(async (req, res) => {
  const existing = await interventionService.getById(req.params.id);
  if (!existing) throw new AppError('Không tìm thấy intervention', 404);
  await assertStudentAccess(req.user, existing.studentId._id || existing.studentId);
  await interventionService.remove(req.params.id);
  res.json({ message: 'Xóa intervention thành công' });
});

export const listAll = asyncHandler(async (req, res) => {
  const Intervention = (await import('../models/Intervention.js')).default;
  let studentIds = [];

  if (req.user.role === 'TEACHER') {
    const classes = await Class.find({ teacherId: req.user._id });
    const students = await Student.find({ classId: { $in: classes.map((c) => c._id) } });
    studentIds = students.map((s) => s._id);
  }

  const filter = req.user.role === 'ADMIN' ? {} : { studentId: { $in: studentIds } };
  const interventions = await Intervention.find(filter)
    .populate('studentId', 'studentCode fullName')
    .populate('advisorId', 'fullName')
    .sort({ createdAt: -1 });

  res.json({ interventions });
});
