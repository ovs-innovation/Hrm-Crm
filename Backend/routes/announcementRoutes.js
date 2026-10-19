import express from 'express';
import { getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } from '../controllers/announcementController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/roleMiddleware.js';

const router = express.Router();
const canPublish = requireRole('founder', 'hr', 'manager');

router.use(protect);

router.route('/').get(getAnnouncements).post(canPublish, createAnnouncement);
router.route('/:id').put(canPublish, updateAnnouncement).delete(canPublish, deleteAnnouncement);

export default router;
