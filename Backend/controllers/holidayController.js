import Holiday from '../models/Holiday.js';
import { publishAnnouncement } from './announcementController.js';

const holidayAnnouncement = (holiday) => {
  const when = holiday.date
    ? new Date(`${holiday.date}T12:00:00+05:30`).toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Kolkata',
    })
    : holiday.day;
  const optional = String(holiday.type || '').toLowerCase() === 'optional';
  const description = optional
    ? `${holiday.name} is an optional holiday on ${when}. You can take this day off if you want.`
    : `${holiday.name} is a ${String(holiday.type || 'company').toLowerCase()} holiday on ${when}. The office will be closed.`;
  return {
    title: `Holiday: ${holiday.name}`,
    description,
    type: 'Event',
    date: holiday.date,
  };
};

export const getHolidays = async (req, res) => {
  try {
    const holidays = await Holiday.find({}).sort({ date: 1 });
    const formatted = holidays.map(h => ({
      id: h._id.toString(),
      name: h.name,
      date: h.date,
      day: h.day,
      type: h.type
    }));
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createHoliday = async (req, res) => {
  try {
    const { name, date, day, type } = req.body;
    const holiday = await Holiday.create({ name, date, day, type });
    let emailNotice = 'Holiday saved. The announcement could not be published.';
    try {
      const published = await publishAnnouncement(holidayAnnouncement(holiday));
      emailNotice = published.emailNotice;
    } catch (err) {
      console.error('[holiday] announcement failed:', err.message);
    }
    res.status(201).json({
      id: holiday._id.toString(),
      name: holiday.name,
      date: holiday.date,
      day: holiday.day,
      type: holiday.type,
      emailNotice,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateHoliday = async (req, res) => {
  try {
    const holiday = await Holiday.findById(req.params.id);
    if (!holiday) {
      return res.status(404).json({ message: 'Holiday not found' });
    }
    Object.assign(holiday, req.body);
    const updated = await holiday.save();
    res.json({
      id: updated._id.toString(),
      name: updated.name,
      date: updated.date,
      day: updated.day,
      type: updated.type,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteHoliday = async (req, res) => {
  try {
    const holiday = await Holiday.findById(req.params.id);
    if (holiday) {
      await Holiday.deleteOne({ _id: holiday._id });
      res.json({ message: 'Holiday removed' });
    } else {
      res.status(404).json({ message: 'Holiday not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
