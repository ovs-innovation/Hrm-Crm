import express from 'express';
import Appreciation from '../models/Appreciation.js';
import { createCrudHandlers, sanitizeQueryValue } from '../utils/crudFactory.js';
import { protect } from '../middlewares/authMiddleware.js';
import { requireStaff } from '../middlewares/roleMiddleware.js';

const handlers = createCrudHandlers(Appreciation, {
  buildFilter: (req) => {
    const filter = {};
    const toEmployeeId = sanitizeQueryValue(req.query.toEmployeeId);
    const fromEmployeeId = sanitizeQueryValue(req.query.fromEmployeeId);
    if (toEmployeeId) filter.toEmployeeId = toEmployeeId;
    if (fromEmployeeId) filter.fromEmployeeId = fromEmployeeId;
    return filter;
  },
});

const router = express.Router();
router.use(protect);
router.get('/', handlers.list);
router.post('/', handlers.create);
router.get('/:id', handlers.getOne);
router.put('/:id', requireStaff, handlers.update);
router.delete('/:id', requireStaff, handlers.remove);

export default router;
