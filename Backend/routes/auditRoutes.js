import express from 'express';
import { getAuditLogs } from '../controllers/auditController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { requireAdmin } from '../middlewares/roleMiddleware.js';

const router = express.Router();

router.get('/', protect, requireAdmin, getAuditLogs);

export default router;
