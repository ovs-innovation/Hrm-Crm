import express from 'express';
import { getDashboardStats, getHrmStats, getEmployeeStats, getReportsAnalytics, getSalesReportDetail } from '../controllers/dashboardController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();
router.get('/stats', protect, getDashboardStats);
router.get('/reports', getReportsAnalytics);
router.get('/sales-detail', getSalesReportDetail);
router.get('/hrm-stats', getHrmStats);
router.get('/employee-stats', getEmployeeStats);

export default router;
