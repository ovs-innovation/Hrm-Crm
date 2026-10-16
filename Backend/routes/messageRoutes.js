import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { protect } from '../middlewares/authMiddleware.js';
import { MIME_TO_EXT, safeUploadFilename } from '../utils/uploadSafe.js';
import {
  getMessages,
  sendMessage,
  uploadFile,
  markAsSeen,
  getMessengerContacts,
  whatsappWebhookVerify,
  whatsappWebhookInbound,
} from '../controllers/messageController.js';

const router = express.Router();

const uploadDir = path.join(path.resolve(), 'uploads');
try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (err) {
  console.warn('[Storage] Could not create uploadDir:', err.message);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, safeUploadFilename(file.fieldname || 'file', file.mimetype));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!MIME_TO_EXT[file.mimetype]) {
      return cb(new Error('Unsupported file type'));
    }
    cb(null, true);
  },
});

router.get('/contacts', protect, getMessengerContacts);
router.post('/upload', protect, upload.single('file'), uploadFile);
router.post('/whatsapp', protect, (req, res, next) => {
  req.params.id = `wa:${req.body?.whatsappPhone || req.body?.phone || ''}`;
  req.body.channel = 'whatsapp';
  return sendMessage(req, res, next);
});
router.get('/whatsapp/:phone', protect, (req, res, next) => {
  req.params.id = req.params.phone;
  req.query.channel = 'whatsapp';
  return getMessages(req, res, next);
});
router.post('/whatsapp/seen/:phone', protect, (req, res, next) => {
  req.params.id = req.params.phone;
  req.query.channel = 'whatsapp';
  return markAsSeen(req, res, next);
});
router.post('/seen/:id', protect, markAsSeen);
router.get('/:id', protect, getMessages);
router.post('/send/:id', protect, sendMessage);

export default router;

/** Public WhatsApp Cloud API webhook (mounted separately) */
export const whatsappWebhookRouter = express.Router();
whatsappWebhookRouter.get('/', whatsappWebhookVerify);
whatsappWebhookRouter.post('/', whatsappWebhookInbound);
