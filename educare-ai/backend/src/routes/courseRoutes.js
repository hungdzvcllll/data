import { Router } from 'express';
import * as courseController from '../controllers/courseController.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { mediaUpload } from '../middlewares/mediaUpload.js';

const router = Router();

router.use(authenticate, authorize('ADMIN', 'TEACHER'));

router.post('/upload/media', mediaUpload.single('file'), courseController.uploadLectureMedia);

router.get('/', courseController.listCourses);
router.post('/', courseController.createCourse);
router.get('/:courseId', courseController.getCourse);
router.patch('/:courseId', courseController.updateCourse);
router.delete('/:courseId', courseController.deleteCourse);
router.post('/:courseId/publish', courseController.publishCourse);

router.get('/:courseId/lectures', courseController.listLectures);
router.post('/:courseId/lectures', courseController.createLecture);

router.get('/:courseId/resources', courseController.listResources);
router.post('/:courseId/resources', courseController.createResource);

router.get('/:courseId/assignments', courseController.listAssignments);
router.post('/:courseId/assignments', courseController.createAssignment);

export default router;
