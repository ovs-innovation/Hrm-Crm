import express from 'express';
import { adminSignup, adminLogin, adminLogout } from '../controllers/authController.js';

const router = express.Router();

router.post('/admin/signup', adminSignup);
router.post('/admin/login', adminLogin);
router.post('/admin/logout', adminLogout);

export default router;
