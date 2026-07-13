import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { protect } from '../middlewares/authMiddleware.js';
import { getMessages, sendMessage, uploadFile, markAsSeen } from '../controllers/messageController.js';

const router = express.Router();

// Ensure uploads directory exists
const uploadDir = path.join(path.resolve(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

router.get('/:id', protect, getMessages);
router.post('/send/:id', protect, sendMessage);
router.post('/upload', protect, upload.single('file'), uploadFile);
router.post('/seen/:id', protect, markAsSeen);

export default router;
