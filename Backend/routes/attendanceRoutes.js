import express from 'express';
import { getAttendance, checkIn, checkOut } from '../controllers/attendanceController.js';

const router = express.Router();

router.route('/')
  .get(getAttendance);

router.route('/checkin')
  .post(checkIn);

router.route('/checkout')
  .post(checkOut);

export default router;
