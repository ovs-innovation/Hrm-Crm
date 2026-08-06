import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import {
  getInboxMessages,
  createInboxMessage,
  sendReply,
  convertToLead,
  convertToTicket,
  assignMessage
} from '../controllers/aiInboxController.js';

const router = express.Router();

router.get('/', protect, getInboxMessages);
router.post('/simulate', protect, createInboxMessage);
router.post('/:id/reply', protect, sendReply);
router.post('/:id/convert-lead', protect, convertToLead);
router.post('/:id/convert-ticket', protect, convertToTicket);
router.post('/:id/assign', protect, assignMessage);

export default router;
