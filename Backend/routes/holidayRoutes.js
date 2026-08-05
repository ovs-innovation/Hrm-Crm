import express from 'express';
import { getHolidays, createHoliday, updateHoliday, deleteHoliday } from '../controllers/holidayController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { requireAdmin } from '../middlewares/roleMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getHolidays)
  .post(requireAdmin, createHoliday);

router.route('/:id')
  .put(requireAdmin, updateHoliday)
  .delete(requireAdmin, deleteHoliday);

export default router;
