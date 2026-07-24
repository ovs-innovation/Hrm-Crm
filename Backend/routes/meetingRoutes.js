import Meeting from '../models/Meeting.js';
import { createCrudHandlers, createCrudRouter } from '../utils/crudFactory.js';

const handlers = createCrudHandlers(Meeting, {
  defaultSort: { scheduledAt: -1 },
  buildFilter: (req) => {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.owner) filter.owner = req.query.owner;
    return filter;
  },
});

export default createCrudRouter(handlers);
