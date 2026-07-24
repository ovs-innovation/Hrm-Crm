import express from 'express';
import Designation from '../models/Designation.js';
import { createCrudHandlers, createCrudRouter } from '../utils/crudFactory.js';

const handlers = createCrudHandlers(Designation, {
  defaultSort: { title: 1 },
  buildFilter: (req) => {
    const filter = {};
    if (req.query.department) filter.department = req.query.department;
    if (req.query.status) filter.status = req.query.status;
    return filter;
  },
});

export default createCrudRouter(handlers);
