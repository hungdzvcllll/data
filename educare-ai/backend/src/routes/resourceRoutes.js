import { Router } from 'express';
import * as courseController from '../controllers/courseController.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();

router.use(authenticate, authorize('ADMIN', 'TEACHER'));

router.get('/:resourceId', courseController.getResource);
router.patch('/:resourceId', courseController.updateResource);
router.delete('/:resourceId', courseController.deleteResource);

export default router;
