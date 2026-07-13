import express from 'express';
import { getHolidays, createHoliday, deleteHoliday } from '../controllers/holidayController.js';

const router = express.Router();

router.route('/')
  .get(getHolidays)
  .post(createHoliday);

router.route('/:id')
  .delete(deleteHoliday);

export default router;
