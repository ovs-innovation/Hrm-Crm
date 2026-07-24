import express from 'express';
import { importLeads, importEmployees, getImportTemplate } from '../controllers/importController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { requireAdmin } from '../middlewares/roleMiddleware.js';

const router = express.Router();

router.get('/template/:type', protect, requireAdmin, getImportTemplate);
router.post('/leads', protect, requireAdmin, importLeads);
router.post('/employees', protect, requireAdmin, importEmployees);

export default router;
