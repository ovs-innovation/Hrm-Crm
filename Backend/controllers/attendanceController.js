import Attendance from '../models/Attendance.js';
import { rememberAttendance } from '../utils/attendanceStore.js';
import DailyReport from '../models/DailyReport.js';

const OFFICE_LAT = 28.579126;
const OFFICE_LON = 77.363649;
const OFFICE_RADIUS_METERS = 300;
const SHIFT_START = 10 * 60 + 15;
const SHIFT_END = 18 * 60 + 30;
const LUNCH_START = 13 * 60 + 30;
const LUNCH_END = 14 * 60 + 15;

const parseClock = (value) => {
  const match = String(value || '').trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3]?.toUpperCase();
  if (meridiem === 'PM' && hours < 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;
  if (!meridiem && hours <= 7) hours += 12;
  return hours * 60 + minutes;
};

const overlapMinutes = (startA, endA, startB, endB) =>
  Math.max(0, Math.min(endA, endB) - Math.max(startA, startB));

const shiftHasEnded = (at = new Date()) => {
  const minutes = at.getHours() * 60 + at.getMinutes();
  return minutes >= SHIFT_END;
};

export const evaluateShift = (checkIn, checkOut) => {
  const arrived = parseClock(checkIn);
  const left = parseClock(checkOut);
  if (arrived == null) return { status: 'Present (Active)', workedMinutes: null };
  const late = arrived > SHIFT_START;
  if (left == null) {
    return { status: late ? 'Late (Active)' : 'Present (Active)', workedMinutes: null };
  }
  const from = Math.max(arrived, SHIFT_START);
  const to = Math.min(left, SHIFT_END);
  const insideShift = Math.max(0, to - from);
  const lunch = overlapMinutes(from, to, LUNCH_START, LUNCH_END);
  const workedMinutes = Math.max(0, insideShift - lunch);
  const leftEarly = left < SHIFT_END;
  const status = leftEarly ? 'Half Day' : late ? 'Late' : 'Present';
  return { status, workedMinutes };
};

const distanceMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const getAttendance = async (req, res) => {
  try {
    const employeeId = typeof req.query.employeeId === 'string' ? req.query.employeeId : undefined;
    const month = typeof req.query.month === 'string' ? req.query.month : undefined;
    
    let query = {};
    if (employeeId) {
      query.employeeId = employeeId;
    }
    if (month && /^\d{4}-\d{2}$/.test(month)) {
      query.date = { $regex: `^${month}` };
    }

    const records = await Attendance.find(query).sort({ date: -1 }).limit(1000);
    
    // Transform to frontend format if necessary
    const formatted = records.map(r => ({
      id: r._id.toString(),
      _id: r._id.toString(),
      employeeId: r.employeeId,
      date: r.date,
      checkIn: r.checkIn,
      checkOut: r.checkOut,
      status: r.status,
      workMode: r.workMode,
      workedMinutes: r.workedMinutes,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const checkIn = async (req, res) => {
  try {
    const { employeeId, date, checkIn, checkOut, status, workMode, latitude, longitude, accuracy } = req.body;

    let distanceFromOffice = null;
    if (workMode === 'Office' && !checkOut) {
      const lat = Number(latitude);
      const lon = Number(longitude);
      const acc = Number(accuracy);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        return res.status(400).json({ message: 'Office check-in requires a GPS location.' });
      }
      if (!Number.isFinite(acc) || acc > OFFICE_RADIUS_METERS) {
        return res.status(400).json({ message: `GPS must be accurate to ${OFFICE_RADIUS_METERS}m or better.` });
      }
      distanceFromOffice = distanceMeters(OFFICE_LAT, OFFICE_LON, lat, lon);
      if (distanceFromOffice > OFFICE_RADIUS_METERS) {
        return res.status(400).json({ message: `Outside office. You are ${Math.round(distanceFromOffice)}m away. Limit is ${OFFICE_RADIUS_METERS}m.` });
      }
    }
    
    if (checkOut && !shiftHasEnded()) {
      return res.status(400).json({ message: 'Checkout opens only after the shift ends at 6:30 PM.' });
    }

    if (checkOut) {
      const report = await DailyReport.findOne({ employeeId, date });
      if (!report) {
        return res.status(400).json({ message: 'MISSING_REPORT' });
      }
    }

    // Check if already checked in today
    let existing = await Attendance.findOne({ employeeId, date });
    if (existing) {
      if (!checkOut) {
        return res.status(409).json({ message: 'Already checked in for this date' });
      }
      if (existing.checkOut) {
        return res.status(409).json({ message: 'Already checked out for this date' });
      }
      existing.checkOut = checkOut;
      const result = evaluateShift(existing.checkIn, checkOut);
      existing.status = result.status;
      existing.workedMinutes = result.workedMinutes;
      const updated = await existing.save();
      rememberAttendance(updated);
      return res.status(200).json(updated);
    }

    const result = evaluateShift(checkIn, checkOut);
    const record = await Attendance.create({
      employeeId,
      date,
      checkIn,
      checkOut,
      status: result.status,
      workedMinutes: result.workedMinutes,
      workMode,
      latitude: Number.isFinite(Number(latitude)) ? Number(latitude) : null,
      longitude: Number.isFinite(Number(longitude)) ? Number(longitude) : null,
      distanceFromOffice,
    });
    rememberAttendance(record);

    res.status(201).json(record);
  } catch (error) {
    console.error("Attendance CheckIn/Upsert Error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const checkOut = async (req, res) => {
  try {
    const { employeeId, date, checkOut } = req.body;

    if (!shiftHasEnded()) {
      return res.status(400).json({ message: 'Checkout opens only after the shift ends at 6:30 PM.' });
    }
    
    // STRICT CHECKOUT FLOW: Verify daily report exists
    const report = await DailyReport.findOne({ employeeId, date });
    if (!report) {
      return res.status(400).json({ message: 'MISSING_REPORT' });
    }

    const record = await Attendance.findOne({ employeeId, date });
    if (!record) {
      return res.status(404).json({ message: 'No check-in found for today' });
    }
    if (record.checkOut) {
      return res.status(409).json({ message: 'Already checked out for this date' });
    }

    record.checkOut = checkOut;
    const result = evaluateShift(record.checkIn, checkOut);
    record.status = result.status;
    record.workedMinutes = result.workedMinutes;
    const updated = await record.save();
    rememberAttendance(updated);

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
