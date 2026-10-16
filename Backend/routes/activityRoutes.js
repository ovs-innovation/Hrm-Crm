import express from 'express';
import { getActivities, createActivity, deleteActivity } from '../controllers/activityController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { requireStaff } from '../middlewares/roleMiddleware.js';

const router = express.Router();

router.get('/', protect, getActivities);
router.post('/', protect, createActivity);
router.delete('/:id', protect, requireStaff, deleteActivity);

export default router;
