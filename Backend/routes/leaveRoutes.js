import express from 'express';
import { createLeave, getAllLeaves, updateLeaveStatus } from '../controllers/leaveController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/').post(protect, createLeave).get(protect, getAllLeaves);
router.route('/:id').patch(protect, updateLeaveStatus);

export default router;
