import Ticket from '../models/Ticket.js';
import { createCrudHandlers, createCrudRouter } from '../utils/crudFactory.js';

const handlers = createCrudHandlers(Ticket, {
  buildFilter: (req) => {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.createdBy) filter.createdBy = req.query.createdBy;
    if (req.query.category) filter.category = req.query.category;
    return filter;
  },
});

export default createCrudRouter(handlers);
