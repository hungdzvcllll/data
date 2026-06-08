import { Router } from 'express';
import * as portalController from '../controllers/portalController.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();

router.use(authenticate, authorize('STUDENT'));

router.get('/courses', portalController.getPortalCourses);
router.get('/courses/:courseId', portalController.getPortalCourseDetail);
router.get('/lectures/:lectureId', portalController.getPortalLecture);
router.get('/resources/:resourceId', portalController.getPortalResource);
router.get('/assignments', portalController.getPortalAssignments);
router.get('/assignments/:assignmentId', portalController.getPortalAssignment);
router.get('/progress', portalController.getPortalProgress);
router.post('/repredict', portalController.portalRepredict);
router.post('/courses/:courseId/discussions', portalController.postDiscussion);
router.get('/courses/:courseId/discussions', portalController.getPortalDiscussions);

export default router;
