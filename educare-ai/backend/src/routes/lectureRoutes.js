import { Router } from 'express';
import * as courseController from '../controllers/courseController.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();

router.use(authenticate, authorize('ADMIN', 'TEACHER'));

router.get('/:lectureId', courseController.getLecture);
router.patch('/:lectureId', courseController.updateLecture);
router.delete('/:lectureId', courseController.deleteLecture);

export default router;
