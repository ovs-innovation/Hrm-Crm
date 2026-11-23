import InfraIncident from '../models/InfraIncident.js';

const nextNumber = async (tenantId) => {
  const last = await InfraIncident.findOne({ tenantId }).sort({ number: -1 }).select('number').lean();
  return (last?.number || 100) + 1;
};

export const openIncident = async ({
  tenantId,
  title,
  priority = 'critical',
  entityType = '',
  entityId = '',
  message = '',
}) => {
  if (!tenantId || !title) return null;
  const existing = await InfraIncident.findOne({
    tenantId,
    entityType,
    entityId: String(entityId || ''),
    status: { $in: ['open', 'investigating'] },
  });
  if (existing) {
    existing.timeline.push({ at: new Date(), message: message || title, actor: 'system' });
    if (existing.timeline.length > 40) existing.timeline = existing.timeline.slice(-40);
    await existing.save();
    return existing;
  }
  return InfraIncident.create({
    tenantId,
    number: await nextNumber(tenantId),
    title,
    priority,
    entityType,
    entityId: String(entityId || ''),
    startedAt: new Date(),
    timeline: [{ at: new Date(), message: message || 'Incident opened', actor: 'system' }],
  });
};

export const noteRecovery = async ({ tenantId, entityType, entityId, message }) => {
  const existing = await InfraIncident.findOne({
    tenantId,
    entityType,
    entityId: String(entityId || ''),
    status: { $in: ['open', 'investigating'] },
  });
  if (!existing) return null;
  existing.timeline.push({ at: new Date(), message, actor: 'system' });
  await existing.save();
  return existing;
};

export const listIncidents = async (tenantId) =>
  InfraIncident.find({ tenantId }).sort({ startedAt: -1 }).limit(100).lean();

export const updateIncident = async (tenantId, id, body = {}) => {
  const row = await InfraIncident.findOne({ _id: id, tenantId });
  if (!row) return null;
  if (body.assignedTo != null) row.assignedTo = String(body.assignedTo).slice(0, 120);
  if (body.rootCause != null) row.rootCause = String(body.rootCause).slice(0, 2000);
  if (body.priority && ['low', 'medium', 'high', 'critical'].includes(body.priority)) row.priority = body.priority;
  if (body.status && ['open', 'investigating', 'resolved'].includes(body.status)) {
    row.status = body.status;
    row.resolvedAt = body.status === 'resolved' ? new Date() : null;
    row.timeline.push({
      at: new Date(),
      message: `Status → ${body.status}`,
      actor: body.actor || '',
    });
  }
  if (body.note) {
    row.timeline.push({ at: new Date(), message: String(body.note).slice(0, 500), actor: body.actor || '' });
  }
  await row.save();
  return row;
};
