import * as dashboardService from '../services/dashboardService.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

export const teacherDashboard = asyncHandler(async (req, res) => {
  const data = await dashboardService.getTeacherDashboard(req.user);
  res.json(data);
});

export const classDashboard = asyncHandler(async (req, res) => {
  const data = await dashboardService.getClassDashboard(req.params.classId);
  const scatter = await dashboardService.getScatterData(req.params.classId);
  res.json({ ...data, scatter });
});

export const riskSummary = asyncHandler(async (req, res) => {
  const data = await dashboardService.getRiskSummary(req.user, req.query.classId);
  res.json(data);
});
