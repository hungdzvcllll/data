import { Router } from 'express';
import * as uploadController from '../controllers/uploadController.js';
import { upload } from '../middlewares/upload.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();

router.use(authenticate, authorize('ADMIN', 'TEACHER'));

router.get('/template', uploadController.downloadUploadTemplate);
router.get('/template/roster', uploadController.downloadRosterTemplate);
router.get('/template/external-profile', uploadController.downloadExternalProfileTemplate);
router.post('/class-data', upload.single('file'), uploadController.uploadClassData);
router.get('/:uploadId/preview', uploadController.getUploadPreview);
router.post('/:uploadId/run-prediction', uploadController.runUploadPrediction);

export default router;
