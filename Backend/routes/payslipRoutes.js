import express from 'express';
import Payslip from '../models/Payslip.js';
import { createCrudHandlers } from '../utils/crudFactory.js';

const handlers = createCrudHandlers(Payslip, {
  defaultSort: { month: -1 },
  buildFilter: (req) => {
    const filter = {};
    if (req.query.employeeId) filter.employeeId = req.query.employeeId;
    if (req.query.month) filter.month = req.query.month;
    if (req.query.status) filter.status = req.query.status;
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
router.get('/', handlers.list);
router.post('/generate', generateBulkPayslips);
router.post('/', createPayslip);
router.get('/:id', handlers.getOne);
router.put('/:id', handlers.update);
router.delete('/:id', handlers.remove);

export default router;
