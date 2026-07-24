import Campaign from '../models/Campaign.js';
import { createCrudHandlers, createCrudRouter } from '../utils/crudFactory.js';

const handlers = createCrudHandlers(Campaign, {
  buildFilter: (req) => {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.type) filter.type = req.query.type;
    return filter;
  },
});

export default createCrudRouter(handlers);
