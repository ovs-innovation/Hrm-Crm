import AuditLog from '../models/AuditLog.js';

export const logAudit = async ({
  req,
  action,
  module,
  entityId,
  entityLabel,
  changes,
}) => {
  try {
    const user = req?.user;
    await AuditLog.create({
      action,
      module,
      entityId: entityId?.toString?.() || entityId,
      entityLabel,
      userId: user?._id?.toString?.(),
      userName: user?.name,
      userRole: user?.role,
      changes,
      ip: req?.ip || req?.headers?.['x-forwarded-for'],
    });
  } catch (err) {
    console.error('[audit]', err.message);
  }
};

export const auditMiddleware = (module) => (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode >= 200 && res.statusCode < 300 && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      logAudit({
        req,
        action: `${req.method} ${req.path}`,
        module,
        entityId: body?._id || req.params?.id,
        entityLabel: body?.title || body?.name || body?.email,
        changes: req.body,
      });
    }
    return originalJson(body);
  };
  next();
};
