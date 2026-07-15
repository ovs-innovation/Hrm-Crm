import Attendance from '../models/Attendance.js';
import DailyReport from '../models/DailyReport.js';

export const getAttendance = async (req, res) => {
  try {
    const { employeeId, month } = req.query;
    
    let query = {};
    if (employeeId) {
      query.employeeId = employeeId;
    }
    if (month) {
      // month is expected to be 'YYYY-MM' format. We can match date strings starting with this.
      query.date = { $regex: `^${month}` };
    }

    const records = await Attendance.find(query).sort({ date: -1 });
    
    // Transform to frontend format if necessary
    const formatted = records.map(r => ({
      id: r._id.toString(),
      employeeId: r.employeeId,
      date: r.date,
      checkIn: r.checkIn,
      checkOut: r.checkOut,
      status: r.status,
      workMode: r.workMode
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const checkIn = async (req, res) => {
  try {
    const { employeeId, date, checkIn, checkOut, status, workMode } = req.body;
    
    if (checkOut) {
      const report = await DailyReport.findOne({ employeeId, date });
      if (!report) {
        return res.status(400).json({ message: 'MISSING_REPORT' });
      }
    }

    // Check if already checked in today
    let existing = await Attendance.findOne({ employeeId, date });
    if (existing) {
      // Upsert: update existing record instead of throwing error
      existing.checkOut = checkOut || existing.checkOut;
      existing.status = status || existing.status;
      const updated = await existing.save();
      return res.status(200).json(updated);
    }

    const record = await Attendance.create({
      employeeId,
      date,
      checkIn,
      checkOut,
      status,
      workMode
    });

    res.status(201).json(record);
  } catch (error) {
    console.error("Attendance CheckIn/Upsert Error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const checkOut = async (req, res) => {
  try {
    const { employeeId, date, checkOut, status } = req.body;
    
    // STRICT CHECKOUT FLOW: Verify daily report exists
    const report = await DailyReport.findOne({ employeeId, date });
    if (!report) {
      return res.status(400).json({ message: 'MISSING_REPORT' });
    }

    const record = await Attendance.findOne({ employeeId, date });
    if (!record) {
      return res.status(404).json({ message: 'No check-in found for today' });
    }

    record.checkOut = checkOut;
    record.status = status; // updating status from "Present (Active)" to "Completed"
    const updated = await record.save();

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
