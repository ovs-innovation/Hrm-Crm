import AuditLog from '../models/AuditLog.js';

export const getAuditLogs = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const filter = {};
    if (req.query.module) filter.module = req.query.module;
    const logs = await AuditLog.find(filter).sort({ createdAt: -1 }).limit(limit);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
