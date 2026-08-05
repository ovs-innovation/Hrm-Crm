import ShiftRoster from '../models/ShiftRoster.js';
import { createCrudHandlers, createCrudRouter, sanitizeQueryValue } from '../utils/crudFactory.js';

const handlers = createCrudHandlers(ShiftRoster, {
  defaultSort: { date: -1 },
  buildFilter: (req) => {
    const filter = {};
    const employeeId = sanitizeQueryValue(req.query.employeeId);
    const date = sanitizeQueryValue(req.query.date);
    const month = sanitizeQueryValue(req.query.month);
    if (employeeId) filter.employeeId = employeeId;
    if (date) filter.date = date;
    if (month && /^\d{4}-\d{2}$/.test(month)) filter.date = { $regex: `^${month}` };
    return filter;
  },
});

export default createCrudRouter(handlers);
