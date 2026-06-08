import Upload from '../models/Upload.js';
import Class from '../models/Class.js';
import { AppError, asyncHandler } from '../middlewares/errorHandler.js';
import { parseUploadFile, validateAndMapUploadRows } from '../services/uploadService.js';
import {
  generateUploadTemplateBuffer,
  generateRosterTemplateBuffer,
} from '../services/templateService.js';
import {
  importStudentsAndPredict,
  importExternalProfiles,
} from '../services/studentPredictionService.js';

function sendTemplate(res, buffer, filename) {
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(Buffer.from(buffer));
}

export const downloadUploadTemplate = asyncHandler(async (req, res) => {
  const buffer = await generateUploadTemplateBuffer();
  sendTemplate(res, buffer, 'educare_student_upload_template.xlsx');
});

export const downloadRosterTemplate = asyncHandler(async (req, res) => {
  const buffer = await generateRosterTemplateBuffer();
  sendTemplate(res, buffer, 'educare_student_roster_template.xlsx');
});

export const downloadExternalProfileTemplate = asyncHandler(async (req, res) => {
  const buffer = await generateRosterTemplateBuffer();
  sendTemplate(res, buffer, 'educare_student_roster_template.xlsx');
});

async function executeUploadImport(upload) {
  const cls = await Class.findById(upload.classId);
  const mode = upload.uploadMode || 'full';
  const results = mode === 'external'
    ? await importExternalProfiles(upload.classId, upload.parsedRows)
    : await importStudentsAndPredict(upload.classId, upload.parsedRows);

  upload.status = 'IMPORTED';
  await upload.save();

  const actionLabel = mode === 'external'
    ? 'cập nhật hồ sơ và dự đoán lại'
    : 'import, tạo tài khoản và dự đoán';

  return {
    success: true,
    message: `Đã ${actionLabel} cho ${results.length} sinh viên`,
    imported: true,
    uploadMode: mode,
    count: results.length,
    classId: upload.classId,
    predictions: results.map((r) => ({
      studentCode: r.student.studentCode,
      fullName: r.student.fullName,
      predictedScore: r.prediction.predictedScore,
      riskLevel: r.prediction.riskLevel,
    })),
    studentAccounts: results.map((r) => r.account).filter(Boolean),
    passwordRule: process.env.STUDENT_DEFAULT_PASSWORD_PATTERN || '{StudentID}@Educare',
    emailRule: `Nếu không có cột Email → {studentid}@${process.env.STUDENT_EMAIL_DOMAIN || 'student.educare.edu.vn'}`,
  };
}

export const uploadClassData = asyncHandler(async (req, res) => {
  const { classId, uploadMode = 'full' } = req.body;
  const mode = ['full', 'roster', 'external'].includes(uploadMode) ? uploadMode : 'full';

  if (!classId) throw new AppError('classId là bắt buộc');
  if (!req.file) throw new AppError('Vui lòng chọn file CSV hoặc Excel');

  const cls = await Class.findById(classId);
  if (!cls) throw new AppError('Không tìm thấy lớp học', 404);

  if (req.user.role === 'TEACHER' && cls.teacherId.toString() !== req.user._id.toString()) {
    throw new AppError('Forbidden', 403);
  }

  const rows = parseUploadFile(req.file.path);
  const validation = validateAndMapUploadRows(rows, mode, cls.className);

  const upload = await Upload.create({
    classId,
    uploadedBy: req.user._id,
    fileName: req.file.originalname,
    uploadMode: mode,
    status: validation.valid ? 'VALIDATED' : 'FAILED',
    previewRows: validation.preview || [],
    parsedRows: validation.validRows,
    validationErrors: validation.errors,
    totalRows: rows.length,
    validRows: validation.validRows?.length || 0,
  });

  if (!validation.valid) {
    return res.status(400).json({
      success: false,
      message: validation.errors[0]?.message || 'Dữ liệu không hợp lệ',
      errors: validation.errors,
      uploadId: upload._id,
      uploadMode: mode,
    });
  }

  const modeLabels = {
    full: 'Upload đầy đủ',
    roster: 'Import sinh viên',
    external: 'Cập nhật hồ sơ',
  };

  // Tab Import sinh viên: validate + import + predict trong một bước
  if (mode === 'roster') {
    upload.parsedRows = validation.validRows;
    upload.validRows = validation.validRows.length;
    await upload.save();
    const importResult = await executeUploadImport(upload);
    return res.status(201).json({
      ...importResult,
      uploadId: upload._id,
      preview: validation.preview,
      totalRows: rows.length,
    });
  }

  res.status(201).json({
    success: true,
    message: `${modeLabels[mode]} — validate thành công`,
    uploadId: upload._id,
    uploadMode: mode,
    preview: validation.preview,
    totalRows: rows.length,
    validRows: validation.validRows.length,
  });
});

export const getUploadPreview = asyncHandler(async (req, res) => {
  const upload = await Upload.findById(req.params.uploadId);
  if (!upload) throw new AppError('Không tìm thấy upload', 404);

  res.json({
    uploadId: upload._id,
    fileName: upload.fileName,
    uploadMode: upload.uploadMode,
    status: upload.status,
    preview: upload.previewRows,
    validationErrors: upload.validationErrors,
    totalRows: upload.totalRows,
    validRows: upload.validRows,
  });
});

export const runUploadPrediction = asyncHandler(async (req, res) => {
  const upload = await Upload.findById(req.params.uploadId);
  if (!upload) throw new AppError('Không tìm thấy upload', 404);
  if (upload.status === 'FAILED') throw new AppError('Upload không hợp lệ, không thể chạy dự đoán');
  if (upload.status === 'IMPORTED') throw new AppError('Upload này đã được import rồi', 400);

  const cls = await Class.findById(upload.classId);
  if (req.user.role === 'TEACHER' && cls.teacherId.toString() !== req.user._id.toString()) {
    throw new AppError('Forbidden', 403);
  }

  const result = await executeUploadImport(upload);
  res.json(result);
});
