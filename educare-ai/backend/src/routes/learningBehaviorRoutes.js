import { Router } from 'express';
import * as learningBehaviorController from '../controllers/learningBehaviorController.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();

router.use(authenticate);

router.post(
  '/:studentId',
  authorize('ADMIN', 'TEACHER', 'STUDENT'),
  learningBehaviorController.recordLearningBehavior
);
router.get(
  '/:studentId',
  authorize('ADMIN', 'TEACHER', 'STUDENT'),
  learningBehaviorController.getStudentLearningBehavior
);
router.get(
  '/:studentId/computed-features',
  authorize('ADMIN', 'TEACHER', 'STUDENT'),
  learningBehaviorController.getStudentComputedFeatures
);
router.post(
  '/:studentId/repredict',
  authorize('ADMIN', 'TEACHER'),
  learningBehaviorController.repredictWithBehavior
);

export default router;
