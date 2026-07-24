import ShiftRoster from '../models/ShiftRoster.js';
import { createCrudHandlers, createCrudRouter } from '../utils/crudFactory.js';

const handlers = createCrudHandlers(ShiftRoster, {
  defaultSort: { date: -1 },
  buildFilter: (req) => {
    const filter = {};
    if (req.query.employeeId) filter.employeeId = req.query.employeeId;
    if (req.query.date) filter.date = req.query.date;
    if (req.query.month) filter.date = { $regex: `^${req.query.month}` };
    return filter;
  },
});

export default createCrudRouter(handlers);
