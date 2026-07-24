import Activity from '../models/Activity.js';
import { logActivity } from '../utils/activityLogger.js';

export const getActivities = async (req, res) => {
  try {
    const { entityType, entityId } = req.query;
    if (!entityType || !entityId) {
      return res.status(400).json({ message: 'entityType and entityId required' });
    }
    const activities = await Activity.find({ entityType, entityId }).sort({ createdAt: -1 }).limit(100);
    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createActivity = async (req, res) => {
  try {
    const activity = await logActivity({
      ...req.body,
      req,
    });
    res.status(201).json(activity);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteActivity = async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) return res.status(404).json({ message: 'Activity not found' });
    await activity.deleteOne();
    res.json({ message: 'Activity removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
