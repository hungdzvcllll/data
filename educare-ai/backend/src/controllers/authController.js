import * as authService from '../services/authService.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

export const register = asyncHandler(async (req, res) => {
  const user = await authService.register(req.body);
  res.status(201).json({ message: 'Đăng ký thành công', user });
});

export const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  res.json({ message: 'Đăng nhập thành công', ...result });
});

export const logout = asyncHandler(async (_req, res) => {
  res.json({ message: 'Đăng xuất thành công' });
});

export const me = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.user._id);
  res.json({ user });
});
