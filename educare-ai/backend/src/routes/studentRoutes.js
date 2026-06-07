import { Router } from 'express';
import * as studentController from '../controllers/studentController.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();

router.use(authenticate);

router.get('/me/profile', authorize('STUDENT'), studentController.getMyProfile);
router.get('/risk-list', authorize('ADMIN', 'TEACHER'), studentController.listRiskStudents);
router.get('/', authorize('ADMIN', 'TEACHER', 'STUDENT'), studentController.listStudents);
router.post('/', authorize('ADMIN', 'TEACHER'), studentController.createStudent);
router.get('/:id', authorize('ADMIN', 'TEACHER', 'STUDENT'), studentController.getStudent);
router.put('/:id', authorize('ADMIN', 'TEACHER'), studentController.updateStudent);
router.delete('/:id', authorize('ADMIN', 'TEACHER'), studentController.deleteStudent);

export default router;
