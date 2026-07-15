import DailyReport from '../models/DailyReport.js';

// @desc    Submit or update daily report
// @route   POST /api/reports
// @access  Private (Employee)
export const submitReport = async (req, res) => {
  try {
    const { date, reportText } = req.body;
    const employeeId = req.user._id;

    if (!date || !reportText) {
      return res.status(400).json({ message: 'Please provide date and report content' });
    }

    // Check if report already exists for this date
    let report = await DailyReport.findOne({ employeeId, date });

    if (report) {
      report.reportText = reportText;
      await report.save();
      return res.status(200).json(report);
    } else {
      report = await DailyReport.create({
        employeeId,
        date,
        reportText
      });
      return res.status(201).json(report);
    }
  } catch (error) {
    console.error('Error submitting report:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get employee's own reports
// @route   GET /api/reports/my
// @access  Private (Employee)
export const getMyReports = async (req, res) => {
  try {
    const employeeId = req.user._id;
    const reports = await DailyReport.find({ employeeId }).sort({ date: -1 });
    res.status(200).json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all employees' reports
// @route   GET /api/reports
// @access  Private (Admin)
export const getAllReports = async (req, res) => {
  try {
    const reports = await DailyReport.find()
      .populate('employeeId', 'name designation department')
      .sort({ date: -1 });
    res.status(200).json(reports);
  } catch (error) {
    console.error('Error fetching all reports:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};
