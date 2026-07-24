import express from 'express';
import { getCompanySettings, updateCompanySettings } from '../controllers/settingsController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { requireAdmin } from '../middlewares/roleMiddleware.js';

const router = express.Router();

router.get('/company', protect, getCompanySettings);
router.put('/company', protect, requireAdmin, updateCompanySettings);

export default router;
