import express from 'express';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import {
  registerEmployee,
  loginEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  uploadMyPhoto,
  setEmployeePassword,
  logoutEmployee,
  deleteEmployee,
} from '../controllers/employeeController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { requireAdmin } from '../middlewares/roleMiddleware.js';

const avatarDir = path.join(path.resolve(), 'uploads', 'avatars');
if (!fs.existsSync(avatarDir)) fs.mkdirSync(avatarDir, { recursive: true });

const avatarUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, avatarDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
      cb(null, `avatar-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    },
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPG, PNG, or WEBP images are allowed'));
  },
});

const router = express.Router();

router.post('/register', protect, requireAdmin, registerEmployee);
router.post('/login', loginEmployee);
router.post('/logout', logoutEmployee);
// Public set-password removed — use invite token flow or admin PATCH /:id/password
router.post('/me/photo', protect, (req, res, next) => {
  avatarUpload.single('photo')(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message });
    next();
  });
}, uploadMyPhoto);
router.get('/', protect, getEmployees);
router.get('/:id', protect, getEmployeeById);
router.put('/:id', protect, requireAdmin, updateEmployee);
router.patch('/:id/password', protect, requireAdmin, setEmployeePassword);
router.delete('/:id', protect, requireAdmin, deleteEmployee);

export default router;
