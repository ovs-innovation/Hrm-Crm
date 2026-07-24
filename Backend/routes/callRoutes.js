import Call from '../models/Call.js';
import { createCrudHandlers, createCrudRouter } from '../utils/crudFactory.js';

const handlers = createCrudHandlers(Call, {
  defaultSort: { calledAt: -1 },
  buildFilter: (req) => {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.owner) filter.owner = req.query.owner;
    if (req.query.client) filter.client = req.query.client;
    return filter;
  },
});

export default createCrudRouter(handlers);
