import express from 'express';
import { createBroadcast, getBroadcasts, markAsRead, updateBroadcast, deleteBroadcast, getBroadcastAnalytics } from '../controllers/broadcasts';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

router.get('/', requireAuth, getBroadcasts);
router.post('/', requireAuth, createBroadcast);
router.post('/:id/read', requireAuth, markAsRead);
router.patch('/:id', requireAuth, updateBroadcast);
router.delete('/:id', requireAuth, deleteBroadcast);
router.get('/:id/analytics', requireAuth, getBroadcastAnalytics);

export default router;
