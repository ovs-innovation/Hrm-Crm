import InfraAlert from '../models/InfraAlert.js';
import { writeInfraLog } from './logService.js';
import { notifyInfraChannels } from './notifyService.js';

export const raiseAlert = async ({
  tenantId,
  type,
  severity = 'warning',
  title,
  message = '',
  entityType = '',
  entityId = '',
  dedupeMinutes = 60,
}) => {
  if (!tenantId || !type || !title) return null;

  const since = new Date(Date.now() - dedupeMinutes * 60000);
  const existing = await InfraAlert.findOne({
    tenantId,
    type,
    entityId: String(entityId || ''),
    resolved: false,
    createdAt: { $gte: since },
  });
  if (existing) return existing;

  const alert = await InfraAlert.create({
    tenantId,
    type,
    severity,
    title,
    message,
    entityType,
    entityId: String(entityId || ''),
  });

  await writeInfraLog({
    tenantId,
    category: 'alert',
    level: severity === 'critical' ? 'error' : 'warn',
    message: title,
    meta: { type, severity, entityId },
  });

  notifyInfraChannels(tenantId, alert).catch(() => {});
  return alert;
};

export const listAlerts = async ({ tenantId, resolved, severity, page = 1, limit = 50 }) => {
  const filter = { tenantId };
  if (resolved === 'true' || resolved === true) filter.resolved = true;
  if (resolved === 'false' || resolved === false) filter.resolved = false;
  if (severity) filter.severity = severity;
  const take = Math.min(100, Math.max(1, Number(limit) || 50));
  const skip = (Math.max(1, Number(page) || 1) - 1) * take;
  const [rows, total] = await Promise.all([
    InfraAlert.find(filter).sort({ createdAt: -1 }).skip(skip).limit(take).lean(),
    InfraAlert.countDocuments(filter),
  ]);
  return { rows, total, page: Math.max(1, Number(page) || 1), limit: take };
};

export const resolveAlert = async (tenantId, id, { notes, assignedTo } = {}) => {
  const alert = await InfraAlert.findOne({ _id: id, tenantId });
  if (!alert) return null;
  alert.resolved = true;
  alert.resolvedAt = new Date();
  if (notes !== undefined) alert.notes = notes;
  if (assignedTo !== undefined) alert.assignedTo = assignedTo;
  await alert.save();
  return alert;
};
