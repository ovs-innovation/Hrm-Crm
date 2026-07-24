import express from 'express';
import {
  registerEmployee,
  loginEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  setEmployeePassword,
  logoutEmployee,
  deleteEmployee,
} from '../controllers/employeeController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { requireAdmin } from '../middlewares/roleMiddleware.js';

const router = express.Router();

router.post('/register', protect, requireAdmin, registerEmployee);
router.post('/login', loginEmployee);
router.post('/logout', logoutEmployee);
router.post('/set-password', setEmployeePassword);
router.get('/', protect, getEmployees);
router.get('/:id', protect, getEmployeeById);
router.put('/:id', protect, requireAdmin, updateEmployee);
router.patch('/:id/password', protect, requireAdmin, setEmployeePassword);
router.delete('/:id', protect, requireAdmin, deleteEmployee);

export default router;
