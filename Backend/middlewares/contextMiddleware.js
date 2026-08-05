import { AsyncLocalStorage } from 'async_hooks';

export const contextStorage = new AsyncLocalStorage();

/**
 * Bind request-scoped context for the remainder of the HTTP lifecycle.
 * Uses enterWith so async Mongoose queries keep the tenant after next().
 */
export const contextMiddleware = (req, res, next) => {
  const store = {
    tenantId: req.tenantId,
    user: req.user?.email || req.user?.userName || 'System',
    skipTenantScope: false,
  };
  contextStorage.enterWith(store);
  next();
};

/** Update ALS tenant mid-request (e.g. after JWT binds user.tenantId). */
export function bindRequestTenant(req, tenantId) {
  if (!tenantId) return;
  req.tenantId = tenantId;
  const store = contextStorage.getStore();
  if (store) {
    store.tenantId = tenantId;
  } else {
    contextStorage.enterWith({
      tenantId,
      user: req.user?.email || 'System',
      skipTenantScope: false,
    });
  }
}
