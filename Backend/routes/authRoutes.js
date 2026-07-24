import express from 'express';
import { adminSignup, adminLogin, adminLogout } from '../controllers/authController.js';
import { validateInviteToken, setPasswordWithToken } from '../controllers/inviteController.js';

const router = express.Router();

router.post('/admin/signup', adminSignup);
router.post('/admin/login', adminLogin);
router.post('/admin/logout', adminLogout);
router.get('/invite/validate', validateInviteToken);
router.post('/invite/set-password', setPasswordWithToken);

export default router;
