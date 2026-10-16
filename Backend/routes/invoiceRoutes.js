import express from 'express';
import {
  getInvoices, getInvoiceById, createInvoice, updateInvoice, deleteInvoice, convertQuoteToInvoice,
} from '../controllers/invoiceController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { requireStaff } from '../middlewares/roleMiddleware.js';

const router = express.Router();

router.use(protect);
router.route('/').get(getInvoices).post(requireStaff, createInvoice);
router.post('/:id/convert', requireStaff, convertQuoteToInvoice);
router.route('/:id').get(getInvoiceById).put(requireStaff, updateInvoice).delete(requireStaff, deleteInvoice);

export default router;
