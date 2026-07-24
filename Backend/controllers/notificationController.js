import Notification from '../models/Notification.js';

export const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const limit = Math.min(Number(req.query.limit) || 30, 100);
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const count = await Notification.countDocuments({ userId, read: false });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markRead = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    await Notification.updateOne({ _id: req.params.id, userId }, { read: true });
    res.json({ message: 'Marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markAllRead = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    await Notification.updateMany({ userId, read: false }, { read: true });
    res.json({ message: 'All marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
