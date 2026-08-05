import mongoose from 'mongoose';
import { tenantScoped } from '../plugins/tenantScope.plugin.js';

const payslipSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true, index: true },
    employeeName: { type: String, required: true },
    month: { type: String, required: true },
    basicSalary: { type: Number, default: 0 },
    allowances: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 },
    netPay: { type: Number, default: 0 },
    status: { type: String, enum: ['Draft', 'Paid'], default: 'Draft' },
    paidDate: { type: Date },
    breakdown: {
      hra: { type: Number, default: 0 },
      transport: { type: Number, default: 0 },
      tax: { type: Number, default: 0 },
      pf: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

payslipSchema.index({ tenantId: 1, employeeId: 1, month: 1 }, { unique: true });

tenantScoped(payslipSchema);

const Payslip = mongoose.model('Payslip', payslipSchema);
export default Payslip;
