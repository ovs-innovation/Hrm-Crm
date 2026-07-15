import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { submitReport, getMyReports, getAllReports } from '../controllers/reportController.js';

const router = express.Router();

// Both admins and employees must be authenticated
router.use(protect);

router.post('/', submitReport);
router.get('/my', getMyReports);
router.get('/', getAllReports);

export default router;
