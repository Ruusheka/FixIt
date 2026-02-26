import express from 'express';
import { getOperationsData } from '../controllers/operations';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

router.get('/data', requireAuth, getOperationsData);

export default router;
