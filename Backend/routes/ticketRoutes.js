import express from 'express';
import Ticket from '../models/Ticket.js';
import { createCrudHandlers, sanitizeQueryValue } from '../utils/crudFactory.js';
import { protect } from '../middlewares/authMiddleware.js';
import { requireStaff } from '../middlewares/roleMiddleware.js';

const handlers = createCrudHandlers(Ticket, {
  buildFilter: (req) => {
    const filter = {};
    const status = sanitizeQueryValue(req.query.status);
    const createdBy = sanitizeQueryValue(req.query.createdBy);
    const category = sanitizeQueryValue(req.query.category);
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (req.userType === 'Admin' || ['hr', 'manager', 'founder', 'owner', 'admin'].includes(String(req.user?.role || '').toLowerCase())) {
      if (createdBy) filter.createdBy = createdBy;
    } else {
      filter.createdBy = String(req.user?._id || '');
    }
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
