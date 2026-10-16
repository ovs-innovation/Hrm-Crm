import express from 'express';
import Document from '../models/Document.js';
import { createCrudHandlers, sanitizeQueryValue } from '../utils/crudFactory.js';
import { protect } from '../middlewares/authMiddleware.js';
import { requireStaff } from '../middlewares/roleMiddleware.js';
import { evaluateDocument, auditDocument } from '../controllers/documentController.js';

const handlers = createCrudHandlers(Document, {
  buildFilter: (req) => {
    const filter = {};
    const category = sanitizeQueryValue(req.query.category);
    const relatedTo = sanitizeQueryValue(req.query.relatedTo);
    const relatedId = sanitizeQueryValue(req.query.relatedId);
    if (category) filter.category = category;
    if (relatedTo) filter.relatedTo = relatedTo;
    if (relatedId) filter.relatedId = relatedId;
    return filter;
  },
});

const router = express.Router();
router.use(protect);
router.get('/', handlers.list);
router.post('/', requireStaff, handlers.create);
router.get('/:id', handlers.getOne);
router.put('/:id', requireStaff, handlers.update);
router.delete('/:id', requireStaff, handlers.remove);
router.post('/:id/evaluate', requireStaff, evaluateDocument);
router.post('/:id/audit', requireStaff, auditDocument);

export default router;
