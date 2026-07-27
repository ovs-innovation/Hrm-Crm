import { AsyncLocalStorage } from 'async_hooks';

export const contextStorage = new AsyncLocalStorage();

export const contextMiddleware = (req, res, next) => {
  const store = {
    tenantId: req.tenantId,
    user: req.user?.email || req.user?.userName || 'System'
  };
  contextStorage.run(store, () => {
    next();
  });
};
