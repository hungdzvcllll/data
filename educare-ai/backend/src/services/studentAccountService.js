import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Student from '../models/Student.js';
import { AppError } from '../middlewares/errorHandler.js';

const EMAIL_DOMAIN = process.env.STUDENT_EMAIL_DOMAIN || 'student.educare.edu.vn';

/** Mật khẩu mặc định: {StudentID}@Educare (vd. SV001@Educare) */
export function generateDefaultPassword(studentCode) {
  const pattern = process.env.STUDENT_DEFAULT_PASSWORD_PATTERN || '{studentCode}@Educare';
  return pattern.replace('{studentCode}', String(studentCode).trim());
}

/** Email tự sinh nếu CSV không có cột Email */
export function generateStudentEmail(studentCode) {
  const code = String(studentCode).trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  return `${code}@${EMAIL_DOMAIN}`;
}

export function resolveStudentEmail(row) {
  const raw = row.email || row.Email;
  if (raw && String(raw).trim()) {
    return String(raw).trim().toLowerCase();
  }
  return generateStudentEmail(row.studentCode);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Tạo hoặc liên kết tài khoản STUDENT cho hồ sơ sinh viên.
 * Trả về thông tin đăng nhập (chỉ gửi plain password khi tài khoản mới tạo).
 */
export async function ensureStudentAccount({ student, email: emailOverride }) {
  const email = emailOverride
    ? String(emailOverride).trim().toLowerCase()
    : generateStudentEmail(student.studentCode);

  if (!isValidEmail(email)) {
    throw new AppError(`Email không hợp lệ cho sinh viên ${student.studentCode}: ${email}`);
  }

  // Đã liên kết user
  if (student.userId) {
    const linked = await User.findById(student.userId).select('-passwordHash');
    if (linked) {
      return {
        studentCode: student.studentCode,
        fullName: student.fullName,
        email: linked.email,
        password: null,
        isNewAccount: false,
        message: 'Đã có tài khoản liên kết',
      };
    }
  }

  let user = await User.findOne({ email });
  let isNewAccount = false;
  let plainPassword = null;

  if (user) {
    if (user.role !== 'STUDENT') {
      throw new AppError(`Email ${email} đã được dùng bởi tài khoản ${user.role}`);
    }
    // Cập nhật tên nếu cần
    user.fullName = student.fullName;
    await user.save();
  } else {
    plainPassword = generateDefaultPassword(student.studentCode);
    const passwordHash = await bcrypt.hash(plainPassword, 10);
    user = await User.create({
      fullName: student.fullName,
      email,
      passwordHash,
      role: 'STUDENT',
    });
    isNewAccount = true;
  }

  student.userId = user._id;
  await student.save();

  return {
    studentCode: student.studentCode,
    fullName: student.fullName,
    email: user.email,
    password: plainPassword,
    isNewAccount,
    message: isNewAccount ? 'Tài khoản mới đã tạo' : 'Liên kết tài khoản hiện có',
  };
}

/**
 * Tạo tài khoản cho danh sách sinh viên sau import.
 */
export async function provisionStudentAccounts(students) {
  const accounts = [];
  const errors = [];

  for (const student of students) {
    try {
      const account = await ensureStudentAccount({ student });
      accounts.push(account);
    } catch (err) {
      errors.push(`${student.studentCode}: ${err.message}`);
    }
  }

  return { accounts, errors };
}
