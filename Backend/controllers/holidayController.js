import Holiday from '../models/Holiday.js';

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
    res.status(201).json({
      id: holiday._id.toString(),
      name: holiday.name,
      date: holiday.date,
      day: holiday.day,
      type: holiday.type
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
