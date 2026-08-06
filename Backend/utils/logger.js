import { contextStorage } from '../middlewares/contextMiddleware.js';

/**
 * Enterprise Structured Logger
 * Emits uniform JSON logging formats for direct log-aggregators parsing (Pino/Winston equivalent)
 */
const formatLog = (level, message, meta = {}) => {
  const store = contextStorage.getStore() || {};
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    tenantId: store.tenantId || meta.tenantId || null,
    user: store.user || null,
    requestId: store.requestId || meta.requestId || null,
    correlationId: store.correlationId || meta.correlationId || null,
    ...meta
  });
};

export const logger = {
  info: (msg, meta) => console.log(formatLog('info', msg, meta)),
  warn: (msg, meta) => console.warn(formatLog('warn', msg, meta)),
  error: (msg, meta) => console.error(formatLog('error', msg, meta)),
  debug: (msg, meta) => console.debug(formatLog('debug', msg, meta))
};

export default logger;
