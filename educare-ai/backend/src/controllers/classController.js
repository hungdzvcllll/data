import Class from '../models/Class.js';
import Student from '../models/Student.js';
import { AppError, asyncHandler } from '../middlewares/errorHandler.js';

export const listClasses = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'ADMIN' ? {} : { teacherId: req.user._id };
  const classes = await Class.find(filter)
    .populate('teacherId', 'fullName email')
    .sort({ createdAt: -1 });
  res.json({ classes });
});

export const createClass = asyncHandler(async (req, res) => {
  const teacherId = req.user.role === 'ADMIN' && req.body.teacherId
    ? req.body.teacherId
    : req.user._id;

  const cls = await Class.create({ ...req.body, teacherId });
  res.status(201).json({ message: 'Tạo lớp thành công', class: cls });
});

export const getClass = asyncHandler(async (req, res) => {
  const cls = await Class.findById(req.params.id).populate('teacherId', 'fullName email');
  if (!cls) throw new AppError('Không tìm thấy lớp học', 404);

  if (req.user.role === 'TEACHER' && cls.teacherId._id.toString() !== req.user._id.toString()) {
    throw new AppError('Forbidden', 403);
  }

  const students = await Student.find({ classId: cls._id });
  res.json({ class: cls, studentCount: students.length });
});

export const updateClass = asyncHandler(async (req, res) => {
  const cls = await Class.findById(req.params.id);
  if (!cls) throw new AppError('Không tìm thấy lớp học', 404);

  if (req.user.role === 'TEACHER' && cls.teacherId.toString() !== req.user._id.toString()) {
    throw new AppError('Forbidden', 403);
  }

  Object.assign(cls, req.body);
  await cls.save();
  res.json({ message: 'Cập nhật lớp thành công', class: cls });
});

export const deleteClass = asyncHandler(async (req, res) => {
  const cls = await Class.findById(req.params.id);
  if (!cls) throw new AppError('Không tìm thấy lớp học', 404);

  if (req.user.role === 'TEACHER' && cls.teacherId.toString() !== req.user._id.toString()) {
    throw new AppError('Forbidden', 403);
  }

  await cls.deleteOne();
  res.json({ message: 'Xóa lớp thành công' });
});

export const getClassStudents = asyncHandler(async (req, res) => {
  const students = await Student.find({ classId: req.params.classId }).sort({ studentCode: 1 });
  res.json({ students });
});
