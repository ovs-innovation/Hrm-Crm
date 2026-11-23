import InfraLog from '../models/InfraLog.js';

export const writeInfraLog = async ({
  tenantId,
  category = 'event',
  level = 'info',
  message,
  meta = {},
  actor = '',
}) => {
  if (!tenantId || !message) return null;
  try {
    return await InfraLog.create({
      tenantId,
      category,
      level,
      message: String(message).slice(0, 4000),
      meta,
      actor,
    });
  } catch (err) {
    console.error('[infra:log]', err.message);
    return null;
  }
};

export const listInfraLogs = async ({
  tenantId,
  category,
  level,
  q,
  page = 1,
  limit = 50,
}) => {
  const filter = { tenantId };
  if (category) filter.category = category;
  if (level) filter.level = level;
  if (q) filter.message = { $regex: String(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };

  const take = Math.min(200, Math.max(1, Number(limit) || 50));
  const skip = (Math.max(1, Number(page) || 1) - 1) * take;
  const [rows, total] = await Promise.all([
    InfraLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(take).lean(),
    InfraLog.countDocuments(filter),
  ]);
  return { rows, total, page: Math.max(1, Number(page) || 1), limit: take };
};

export const cleanupInfraLogs = async (tenantId, retentionDays = 30) => {
  const cutoff = new Date(Date.now() - retentionDays * 86400000);
  const res = await InfraLog.deleteMany({ tenantId, createdAt: { $lt: cutoff } });
  return res.deletedCount || 0;
};
