import express from 'express';
import { reportIssue, getIssues, updateStatus, validateIssueImage, submitProof, verifyIssue } from '../controllers/issues';
import { requireAuth, optionalAuth } from '../middleware/auth';
import multer from 'multer';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Use optionalAuth to capture the citizen identity if logged in
router.post('/', optionalAuth, upload.single('image'), reportIssue);
router.post('/validate', upload.single('image'), validateIssueImage);
router.get('/', requireAuth, getIssues);
router.patch('/:id/status', requireAuth, updateStatus);

// New Workflow Routes
router.post('/:id/proof', requireAuth, upload.single('image'), submitProof);
router.post('/:id/verify', requireAuth, verifyIssue);

export default router;
