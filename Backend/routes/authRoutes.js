import express from 'express';
import {
  adminSignup,
  adminLogin,
  adminLogout,
  refreshAccessToken,
  logoutAllDevices,
  listSessions,
} from '../controllers/authController.js';
import { validateInviteToken, setPasswordWithToken } from '../controllers/inviteController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/admin/signup', adminSignup);
router.post('/admin/login', adminLogin);
router.post('/admin/logout', adminLogout);
router.post('/refresh', refreshAccessToken);
router.post('/logout-all', protect, logoutAllDevices);
router.get('/sessions', protect, listSessions);
router.get('/invite/validate', validateInviteToken);
router.post('/invite/set-password', setPasswordWithToken);

export default router;
