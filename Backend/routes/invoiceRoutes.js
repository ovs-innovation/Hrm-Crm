import express from 'express';
import {
  getInvoices, getInvoiceById, createInvoice, updateInvoice, deleteInvoice, convertQuoteToInvoice,
} from '../controllers/invoiceController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/').get(protect, getInvoices).post(protect, createInvoice);
router.post('/:id/convert', protect, convertQuoteToInvoice);
router.route('/:id').get(protect, getInvoiceById).put(protect, updateInvoice).delete(protect, deleteInvoice);

export default router;
