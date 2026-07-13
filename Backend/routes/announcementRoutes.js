import express from 'express';
import { getAnnouncements, createAnnouncement, deleteAnnouncement } from '../controllers/announcementController.js';

const router = express.Router();

router.route('/').get(getAnnouncements).post(createAnnouncement);
router.route('/:id').delete(deleteAnnouncement);

export default router;
