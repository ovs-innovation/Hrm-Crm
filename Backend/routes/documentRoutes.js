import express from 'express';
import Document from '../models/Document.js';
import { createCrudHandlers } from '../utils/crudFactory.js';
import { protect } from '../middlewares/authMiddleware.js';
import { evaluateDocument, auditDocument } from '../controllers/documentController.js';

const handlers = createCrudHandlers(Document, {
  buildFilter: (req) => {
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.relatedTo) filter.relatedTo = req.query.relatedTo;
    if (req.query.relatedId) filter.relatedId = req.query.relatedId;
    return filter;
  },
});

const router = express.Router();
router.use(protect);
router.get('/', handlers.list);
router.post('/', handlers.create);
router.get('/:id', handlers.getOne);
router.put('/:id', handlers.update);
router.delete('/:id', handlers.remove);
router.post('/:id/evaluate', evaluateDocument);
router.post('/:id/audit', auditDocument);

export default router;
