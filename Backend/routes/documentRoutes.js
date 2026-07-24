import Document from '../models/Document.js';
import { createCrudHandlers, createCrudRouter } from '../utils/crudFactory.js';

const handlers = createCrudHandlers(Document, {
  buildFilter: (req) => {
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.relatedTo) filter.relatedTo = req.query.relatedTo;
    if (req.query.relatedId) filter.relatedId = req.query.relatedId;
    return filter;
  },
});

export default createCrudRouter(handlers);
