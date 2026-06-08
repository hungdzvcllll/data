import { Router } from 'express';
import * as portalController from '../controllers/portalController.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();

router.use(authenticate, authorize('STUDENT'));

router.post('/video-progress', portalController.postVideoProgress);
router.post('/resource-view', portalController.postResourceView);
router.post('/course-open', portalController.postCourseOpen);
router.post('/assignment-start', portalController.postAssignmentStart);

export default router;
