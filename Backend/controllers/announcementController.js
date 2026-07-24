import Announcement from '../models/Announcement.js';

// @desc    Get all announcements
// @route   GET /api/announcements
// @access  Public (Protected later by Auth)
export const getAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new announcement
// @route   POST /api/announcements
// @access  Public (Admin only later)
export const createAnnouncement = async (req, res) => {
  try {
    const { title, description, type, date } = req.body;
    const announcement = await Announcement.create({
      title,
      description,
      type: type || 'General',
      date: date || Date.now()
    });
    res.status(201).json(announcement);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete an announcement
// @route   DELETE /api/announcements/:id
// @access  Public (Admin only later)
export const updateAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    Object.assign(announcement, req.body);
    const updated = await announcement.save();
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    await announcement.deleteOne();
    res.json({ message: 'Announcement removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
