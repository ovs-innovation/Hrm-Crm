import express from 'express';
import Department from '../models/Department.js';
import Employee from '../models/Employee.js';
import { createCrudHandlers } from '../utils/crudFactory.js';
import { protect } from '../middlewares/authMiddleware.js';
import { requireAdmin } from '../middlewares/roleMiddleware.js';

const handlers = createCrudHandlers(Department, {
  defaultSort: { name: 1 },
});

export const listDepartments = async (req, res) => {
  try {
    const departments = await Department.find({}).sort({ name: 1 });
    const enriched = await Promise.all(
      departments.map(async (dept) => {
        const employeeCount = await Employee.countDocuments({ department: dept.name });
        return {
          ...dept.toObject(),
          id: dept._id.toString(),
          employeeCount,
          head: dept.head || '—',
        };
      })
    );
    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const router = express.Router();
router.use(protect);
router.get('/', listDepartments);
router.post('/', requireAdmin, handlers.create);
router.get('/:id', handlers.getOne);
router.put('/:id', requireAdmin, handlers.update);
router.delete('/:id', requireAdmin, handlers.remove);

export default router;
