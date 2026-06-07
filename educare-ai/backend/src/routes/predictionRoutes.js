import { Router } from 'express';
import * as predictionController from '../controllers/predictionController.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();

router.use(authenticate);

router.post('/single', authorize('ADMIN', 'TEACHER'), predictionController.predictSingle);
router.post('/batch', authorize('ADMIN', 'TEACHER'), predictionController.predictBatch);
router.get('/class/:classId', authorize('ADMIN', 'TEACHER'), predictionController.getClassPredictions);
router.get('/student/:studentId', authorize('ADMIN', 'TEACHER', 'STUDENT'), predictionController.getStudentPredictions);

export default router;
