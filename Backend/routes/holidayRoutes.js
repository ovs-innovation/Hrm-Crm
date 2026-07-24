import express from 'express';
import { getHolidays, createHoliday, updateHoliday, deleteHoliday } from '../controllers/holidayController.js';

const router = express.Router();

router.route('/')
  .get(getHolidays)
  .post(createHoliday);

router.route('/:id')
  .put(updateHoliday)
  .delete(deleteHoliday);

export default router;
