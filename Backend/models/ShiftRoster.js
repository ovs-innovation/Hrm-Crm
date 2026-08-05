import mongoose from 'mongoose';
import { tenantScoped } from '../plugins/tenantScope.plugin.js';

const shiftRosterSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true, index: true },
    employeeName: { type: String, required: true },
    date: { type: String, required: true },
    shiftType: { type: String, enum: ['Morning', 'Evening', 'Night', 'General'], default: 'General' },
    startTime: { type: String, default: '09:00' },
    endTime: { type: String, default: '18:00' },
    notes: { type: String },
  },
  { timestamps: true }
);

shiftRosterSchema.index({ tenantId: 1, employeeId: 1, date: 1 }, { unique: true });

tenantScoped(shiftRosterSchema);

const ShiftRoster = mongoose.model('ShiftRoster', shiftRosterSchema);
export default ShiftRoster;
