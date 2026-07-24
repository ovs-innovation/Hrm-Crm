import express from 'express';

export function createCrudHandlers(Model, options = {}) {
  const {
    defaultSort = { createdAt: -1 },
    buildFilter = () => ({}),
    transform = (doc) => (doc.toObject ? doc.toObject() : doc),
  } = options;

  const list = async (req, res) => {
    try {
      const filter = buildFilter(req);
      const docs = await Model.find(filter).sort(defaultSort);
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

export function createCrudRouter(handlers) {
  const router = express.Router();
  router.route('/').get(handlers.list).post(handlers.create);
  router.route('/:id').get(handlers.getOne).put(handlers.update).delete(handlers.remove);
  return router;
}
