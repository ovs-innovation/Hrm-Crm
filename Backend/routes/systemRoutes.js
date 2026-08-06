import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { getSystemHealth, getSystemMetrics } from '../controllers/systemController.js';

const router = express.Router();

router.get('/health', getSystemHealth);
router.get('/metrics', protect, getSystemMetrics);

export default router;
