import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { requireAdmin } from '../middlewares/roleMiddleware.js';
import { createCheckoutSession, handleStripeWebhook, updateTenantPlugins } from '../controllers/billingController.js';

const router = express.Router();

router.post('/checkout', protect, requireAdmin, createCheckoutSession);
router.post('/webhook', handleStripeWebhook);
router.put('/plugins', protect, requireAdmin, updateTenantPlugins);

export default router;
