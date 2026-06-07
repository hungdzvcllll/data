import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { AppError } from '../middlewares/errorHandler.js';

export async function register({ fullName, email, password, role }) {
  const exists = await User.findOne({ email });
  if (exists) throw new AppError('Email đã được sử dụng', 409);

  const allowedRoles = ['ADMIN', 'TEACHER', 'STUDENT'];
  const userRole = allowedRoles.includes(role) ? role : 'TEACHER';

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ fullName, email, passwordHash, role: userRole });
  return sanitizeUser(user);
}

export async function login({ email, password }) {
  const user = await User.findOne({ email });
  if (!user) throw new AppError('Email hoặc mật khẩu không đúng', 401);

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new AppError('Email hoặc mật khẩu không đúng', 401);

  const token = signToken(user);
  return { user: sanitizeUser(user), token };
}

export function signToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function sanitizeUser(user) {
  return {
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
}

export async function getMe(userId) {
  const user = await User.findById(userId).select('-passwordHash');
  if (!user) throw new AppError('User not found', 404);
  return sanitizeUser(user);
}
