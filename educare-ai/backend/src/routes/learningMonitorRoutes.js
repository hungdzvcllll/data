import { Router } from 'express';
import * as courseController from '../controllers/courseController.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();

router.use(authenticate, authorize('ADMIN', 'TEACHER'));

router.get('/', courseController.getLearningMonitor);

export default router;
