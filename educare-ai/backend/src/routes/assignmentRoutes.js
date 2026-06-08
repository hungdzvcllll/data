import { Router } from 'express';
import * as courseController from '../controllers/courseController.js';
import * as portalController from '../controllers/portalController.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();

router.use(authenticate);

router.post('/:assignmentId/submit', authorize('STUDENT'), portalController.postAssignmentSubmit);
router.get('/:assignmentId/submissions', authorize('ADMIN', 'TEACHER'), courseController.listAssignmentSubmissions);
router.post('/:assignmentId/publish', authorize('ADMIN', 'TEACHER'), courseController.publishAssignment);
router.get('/:assignmentId', authorize('ADMIN', 'TEACHER'), courseController.getAssignment);
router.patch('/:assignmentId', authorize('ADMIN', 'TEACHER'), courseController.updateAssignment);
router.delete('/:assignmentId', authorize('ADMIN', 'TEACHER'), courseController.deleteAssignment);

export default router;
