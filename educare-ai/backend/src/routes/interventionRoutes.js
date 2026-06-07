import { Router } from 'express';
import * as interventionController from '../controllers/interventionController.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize('ADMIN', 'TEACHER'), interventionController.listAll);
router.get('/student/:studentId', authorize('ADMIN', 'TEACHER'), interventionController.listByStudent);
router.post('/', authorize('ADMIN', 'TEACHER'), interventionController.createIntervention);
router.get('/:id', authorize('ADMIN', 'TEACHER'), interventionController.getIntervention);
router.put('/:id', authorize('ADMIN', 'TEACHER'), interventionController.updateIntervention);
router.delete('/:id', authorize('ADMIN', 'TEACHER'), interventionController.deleteIntervention);

export default router;
