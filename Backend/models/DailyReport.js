import mongoose from 'mongoose';
import { tenantScoped } from '../plugins/tenantScope.plugin.js';

const dailyReportSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true,
  },
  reportText: {
    type: String,
    required: true,
  }
}, {
  timestamps: true
});

dailyReportSchema.index({ tenantId: 1, employeeId: 1, date: 1 }, { unique: true });

tenantScoped(dailyReportSchema);

const DailyReport = mongoose.model('DailyReport', dailyReportSchema);
export default DailyReport;
