import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { requireAdmin, requireStaff } from '../middlewares/roleMiddleware.js';

/** Coerce query values to primitives — rejects Mongo operator objects. */
export function sanitizeQueryValue(value) {
  if (value == null) return value;
  if (typeof value === 'object') return undefined;
  return String(value);
}

const writeGate = (mutate) => {
  if (mutate === 'admin') return requireAdmin;
  if (mutate === 'staff') return requireStaff;
  return (_req, _res, next) => next();
};

export function createCrudHandlers(Model, options = {}) {
  const {
    defaultSort = { createdAt: -1 },
    buildFilter = () => ({}),
    transform = (doc) => (doc.toObject ? doc.toObject() : doc),
    listLimit = 500,
  } = options;

  const list = async (req, res) => {
    try {
      const filter = buildFilter(req);
      const page = Math.max(1, parseInt(String(req.query.page || '1'), 10) || 1);
      const limit = Math.min(listLimit, Math.max(1, parseInt(String(req.query.limit || String(listLimit)), 10) || listLimit));
      const skip = (page - 1) * limit;
      const docs = await Model.find(filter).sort(defaultSort).skip(skip).limit(limit);
      res.json(docs.map((doc) => transform(doc)));
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

  const getOne = async (req, res) => {
    try {
      const doc = await Model.findById(req.params.id);
      if (!doc) return res.status(404).json({ message: 'Not found' });
      res.json(transform(doc));
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

  const create = async (req, res) => {
    try {
      const doc = await Model.create(req.body);
      res.status(201).json(transform(doc));
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  };

  const update = async (req, res) => {
    try {
      const doc = await Model.findById(req.params.id);
      if (!doc) return res.status(404).json({ message: 'Not found' });
      Object.assign(doc, req.body);
      await doc.save();
      res.json(transform(doc));
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  };

  const remove = async (req, res) => {
    try {
      const doc = await Model.findById(req.params.id);
      if (!doc) return res.status(404).json({ message: 'Not found' });
      await doc.deleteOne();
      res.json({ message: 'Removed successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

  return { list, getOne, create, update, remove };
}

/**
 * @param handlers - from createCrudHandlers
 * @param {{ mutate?: null | 'admin' | 'staff' }} options
 *   mutate: who may POST/PUT/DELETE (GET stays any authenticated user)
 */
export function createCrudRouter(handlers, options = {}) {
  const gate = writeGate(options.mutate);
  const router = express.Router();
  router.use(protect);
  router.route('/').get(handlers.list).post(gate, handlers.create);
  router.route('/:id').get(handlers.getOne).put(gate, handlers.update).delete(gate, handlers.remove);
  return router;
}
