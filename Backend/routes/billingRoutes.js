import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { createCheckoutSession, handleStripeWebhook, updateTenantPlugins } from '../controllers/billingController.js';

const router = express.Router();

router.post('/checkout', protect, createCheckoutSession);
router.post('/webhook', handleStripeWebhook);
router.put('/plugins', protect, updateTenantPlugins);

export default router;
