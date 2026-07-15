import mongoose from 'mongoose';

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

const DailyReport = mongoose.model('DailyReport', dailyReportSchema);
export default DailyReport;
