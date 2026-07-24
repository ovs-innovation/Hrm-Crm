import express from 'express';
import { getActivities, createActivity, deleteActivity } from '../controllers/activityController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getActivities);
router.post('/', protect, createActivity);
router.delete('/:id', protect, deleteActivity);

export default router;
