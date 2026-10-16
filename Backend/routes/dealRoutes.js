import express from 'express';
import { createDeal, getDeals, updateDeal, deleteDeal } from '../controllers/dealController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { requireStaff } from '../middlewares/roleMiddleware.js';

const router = express.Router();

router.use(protect);
router.route('/').get(getDeals).post(requireStaff, createDeal);
router.route('/:id').put(requireStaff, updateDeal).delete(requireStaff, deleteDeal);

export default router;
