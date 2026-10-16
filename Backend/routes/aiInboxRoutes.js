import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { requireStaff } from '../middlewares/roleMiddleware.js';
import {
  getInboxMessages,
  createInboxMessage,
  sendReply,
  convertToLead,
  convertToTicket,
  assignMessage
} from '../controllers/aiInboxController.js';

const router = express.Router();

router.use(protect, requireStaff);
router.get('/', getInboxMessages);
router.post('/simulate', createInboxMessage);
router.post('/:id/reply', sendReply);
router.post('/:id/convert-lead', convertToLead);
router.post('/:id/convert-ticket', convertToTicket);
router.post('/:id/assign', assignMessage);

export default router;
