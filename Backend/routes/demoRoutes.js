import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  getDemoWorkspaceStatus,
  ensureDemoWorkspace,
  exploreDemoWorkspace,
  wizardSetupWorkspace,
} from '../controllers/demoController.js';

const router = express.Router();

const demoLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many demo requests. Please try again later.' },
});

router.get('/workspace', demoLimiter, getDemoWorkspaceStatus);
router.post('/workspace/ensure', demoLimiter, ensureDemoWorkspace);
router.post('/workspace/explore', demoLimiter, exploreDemoWorkspace);
router.post('/workspace/wizard-setup', demoLimiter, wizardSetupWorkspace);

export default router;
