import { Router } from 'express';
import * as dashboardController from '../controllers/dashboardController.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();

router.use(authenticate, authorize('ADMIN', 'TEACHER'));

router.get('/teacher', dashboardController.teacherDashboard);
router.get('/class/:classId', dashboardController.classDashboard);
router.get('/risk-summary', dashboardController.riskSummary);

export default router;
