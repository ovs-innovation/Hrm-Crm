import express from 'express';
import Payslip from '../models/Payslip.js';
import { createCrudHandlers, sanitizeQueryValue } from '../utils/crudFactory.js';
import { protect } from '../middlewares/authMiddleware.js';
import { requireAdmin } from '../middlewares/roleMiddleware.js';

const handlers = createCrudHandlers(Payslip, {
  defaultSort: { month: -1 },
  buildFilter: (req) => {
    const filter = {};
    const employeeId = sanitizeQueryValue(req.query.employeeId);
    const month = sanitizeQueryValue(req.query.month);
    const status = sanitizeQueryValue(req.query.status);
    if (employeeId) filter.employeeId = employeeId;
    if (month) filter.month = month;
    if (status) filter.status = status;
    // Employees may only list their own payslips
    if (req.userType === 'Employee' && req.user?.employeeId) {
      filter.employeeId = req.user.employeeId;
    }
    return filter;
  },
});

export const createPayslip = async (req, res) => {
  try {
    const { basicSalary = 0, allowances = 0, deductions = 0, netPay, ...rest } = req.body;
    const calculatedNet = netPay ?? basicSalary + allowances - deductions;
    const doc = await Payslip.create({
      ...rest,
      basicSalary,
      allowances,
      deductions,
      netPay: calculatedNet,
    });
    res.status(201).json(doc);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const generateBulkPayslips = async (req, res) => {
  try {
    const { month, basicSalary = 50000, allowances = 5000, deductions = 2000 } = req.body;
    if (!month) return res.status(400).json({ message: 'month (YYYY-MM) is required' });

    const Employee = (await import('../models/Employee.js')).default;
    const employees = await Employee.find({}).select('employeeId name');
    const created = [];

    for (const emp of employees) {
      const existing = await Payslip.findOne({ employeeId: emp.employeeId, month });
      if (existing) continue;
      const doc = await Payslip.create({
        employeeId: emp.employeeId,
        employeeName: emp.name,
        month,
        basicSalary,
        allowances,
        deductions,
        netPay: basicSalary + allowances - deductions,
        status: 'Draft',
      });
      created.push(doc);
    }

    res.status(201).json({ count: created.length, payslips: created });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const router = express.Router();
router.use(protect);
router.get('/', handlers.list);
router.post('/generate', requireAdmin, generateBulkPayslips);
router.post('/', requireAdmin, createPayslip);
router.get('/:id', handlers.getOne);
router.put('/:id', requireAdmin, handlers.update);
router.delete('/:id', requireAdmin, handlers.remove);

export default router;
