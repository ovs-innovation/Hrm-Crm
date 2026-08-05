import express from 'express';
import { getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } from '../controllers/announcementController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { requireAdmin } from '../middlewares/roleMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/').get(getAnnouncements).post(requireAdmin, createAnnouncement);
router.route('/:id').put(requireAdmin, updateAnnouncement).delete(requireAdmin, deleteAnnouncement);

export default router;
