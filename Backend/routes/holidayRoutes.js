import express from 'express';
import { getHolidays, createHoliday, updateHoliday, deleteHoliday } from '../controllers/holidayController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/roleMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getHolidays)
  .post(requireRole('founder', 'hr', 'manager'), createHoliday);

router.route('/:id')
  .put(requireRole('founder', 'hr', 'manager'), updateHoliday)
  .delete(requireRole('founder', 'hr', 'manager'), deleteHoliday);

export default router;
