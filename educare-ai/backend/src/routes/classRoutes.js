import { Router } from 'express';
import * as classController from '../controllers/classController.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize('ADMIN', 'TEACHER'), classController.listClasses);
router.post('/', authorize('ADMIN', 'TEACHER'), classController.createClass);
router.get('/:classId/students', authorize('ADMIN', 'TEACHER'), classController.getClassStudents);
router.get('/:id', authorize('ADMIN', 'TEACHER'), classController.getClass);
router.put('/:id', authorize('ADMIN', 'TEACHER'), classController.updateClass);
router.delete('/:id', authorize('ADMIN', 'TEACHER'), classController.deleteClass);

export default router;
