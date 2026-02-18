import express from 'express';
import { reportIssue, getIssues, updateStatus } from '../controllers/issues';
import { requireAuth } from '../middleware/auth';
import multer from 'multer';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Make reporting public (anonymous allowed)
router.post('/', upload.single('image'), reportIssue);
router.get('/', requireAuth, getIssues);
router.patch('/:id/status', requireAuth, updateStatus);

export default router;
