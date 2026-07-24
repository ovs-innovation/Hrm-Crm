import express from 'express';
import { createDeal, getDeals, updateDeal, deleteDeal } from '../controllers/dealController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/').get(protect, getDeals).post(protect, createDeal);
router.route('/:id').put(protect, updateDeal).delete(protect, deleteDeal);

export default router;
