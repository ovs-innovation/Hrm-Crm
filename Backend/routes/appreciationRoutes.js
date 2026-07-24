import Appreciation from '../models/Appreciation.js';
import { createCrudHandlers, createCrudRouter } from '../utils/crudFactory.js';

const handlers = createCrudHandlers(Appreciation, {
  buildFilter: (req) => {
    const filter = {};
    if (req.query.toEmployeeId) filter.toEmployeeId = req.query.toEmployeeId;
    if (req.query.fromEmployeeId) filter.fromEmployeeId = req.query.fromEmployeeId;
    return filter;
  },
});

export default createCrudRouter(handlers);
