import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { requireAdmin } from '../middlewares/roleMiddleware.js';
import { getSystemHealth, getSystemMetrics } from '../controllers/systemController.js';

const router = express.Router();

router.get('/health', getSystemHealth);
router.get('/metrics', protect, requireAdmin, getSystemMetrics);

export default router;
