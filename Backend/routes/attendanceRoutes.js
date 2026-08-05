import express from 'express';
import { getAttendance, checkIn, checkOut } from '../controllers/attendanceController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getAttendance);

router.route('/checkin')
  .post(checkIn);

router.route('/checkout')
  .post(checkOut);

export default router;
