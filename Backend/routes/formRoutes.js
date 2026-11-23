import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import rateLimit from 'express-rate-limit';
import { protect } from '../middlewares/authMiddleware.js';
import { requireStaff, requireAdmin } from '../middlewares/roleMiddleware.js';
import { safeUploadFilename, MIME_TO_EXT } from '../utils/uploadSafe.js';
import {
  submitForm,
  saveFormStep,
  uploadFormFile,
  getFormSubmissions,
  getFormSubmissionById,
  updateFormSubmissionStatus,
  deleteFormSubmission,
} from '../controllers/formController.js';

const router = express.Router();

// Ensure uploads/forms directory exists
const formsUploadDir = path.join(path.resolve(), 'uploads', 'forms');
try {
  if (!fs.existsSync(formsUploadDir)) {
    fs.mkdirSync(formsUploadDir, { recursive: true });
  }
} catch (err) {
  console.warn('[Storage] Could not create formsUploadDir:', err.message);
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, formsUploadDir);
  },
  filename: (_req, file, cb) => {
    cb(null, safeUploadFilename('form', file.mimetype));
  },
});

// Allowed file types: Images & Documents
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/svg+xml',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]);

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max file size
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype) || MIME_TO_EXT[file.mimetype]) {
      return cb(null, true);
    }
    const err = new Error(
      `Unsupported file type: "${file.mimetype}". Allowed types: JPG, PNG, WEBP, SVG, PDF, DOC, DOCX, TXT.`
    );
    err.code = 'INVALID_FILE_TYPE';
    cb(err);
  },
});

// Wrapper to handle Multer upload errors gracefully
const handleMulterUpload = (uploadMiddleware) => (req, res, next) => {
  uploadMiddleware(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File size exceeds maximum allowed limit of 10MB.',
        });
      }
      if (err.code === 'INVALID_FILE_TYPE') {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload failed.',
      });
    }
    next();
  });
};

// Rate limiter for public form submissions (prevents automated bot abuse & spam)
const publicFormLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 submissions per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many submissions received from your IP address. Please try again after 15 minutes.',
  },
});

// ─── Public Endpoints (for ApnaDigital Website) ─────────────────────────────
router.post('/step', publicFormLimiter, handleMulterUpload(upload.any()), saveFormStep);
router.post('/submit', publicFormLimiter, handleMulterUpload(upload.any()), submitForm);
router.post('/', publicFormLimiter, handleMulterUpload(upload.any()), submitForm);
router.post('/upload', publicFormLimiter, handleMulterUpload(upload.single('file')), uploadFormFile);

// ─── Protected CRM Endpoints ────────────────────────────────────────────────
router.get('/', protect, getFormSubmissions);
router.get('/:id', protect, getFormSubmissionById);
router.put('/:id/status', protect, requireStaff, updateFormSubmissionStatus);
router.delete('/:id', protect, requireStaff, deleteFormSubmission);

export default router;
