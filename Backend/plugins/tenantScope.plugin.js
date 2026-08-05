import mongoose from 'mongoose';
import { contextStorage } from '../middlewares/contextMiddleware.js';

const TENANT_FIELD = 'tenantId';

/**
 * Escape hatch for auth lookups / migrations that must run without tenant filter.
 * Usage: await withoutTenantScope(() => Admin.findOne({ email }))
 * IMPORTANT: must await the work inside ALS run so Mongoose queries keep skipTenantScope.
 */
export async function withoutTenantScope(fn) {
  return contextStorage.run(
    { ...(contextStorage.getStore() || {}), skipTenantScope: true },
    async () => await fn()
  );
}

export function getActiveTenantId() {
  const store = contextStorage.getStore();
  if (!store || store.skipTenantScope) return null;
  return store.tenantId || null;
}

export function setActiveTenantId(tenantId) {
  const store = contextStorage.getStore();
  if (store) store.tenantId = tenantId;
}

function toTenantObjectId(tenantId) {
  if (!tenantId) return null;
  if (tenantId instanceof mongoose.Types.ObjectId) return tenantId;
  if (mongoose.isValidObjectId(tenantId)) return new mongoose.Types.ObjectId(String(tenantId));
  return tenantId;
}

/**
 * Mongoose plugin: auto-inject tenantId on writes and filter reads.
 */
export function tenantScoped(schema) {
  if (!schema.path(TENANT_FIELD)) {
    schema.add({
      [TENANT_FIELD]: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
      },
    });
  }

  schema.index({ [TENANT_FIELD]: 1 });

  const injectFilter = function injectTenantFilter() {
    const store = contextStorage.getStore();
    if (!store || store.skipTenantScope) return;
    const tenantId = toTenantObjectId(store.tenantId);
    if (!tenantId) return;

    const q = this.getQuery?.() || {};
    const alreadyScoped =
      q[TENANT_FIELD] !== undefined ||
      (Array.isArray(q.$and) && q.$and.some((c) => c && c[TENANT_FIELD] !== undefined));

    if (!alreadyScoped) {
      this.where({ [TENANT_FIELD]: tenantId });
    }
  };

  const queryOps = [
    'find',
    'findOne',
    'findOneAndUpdate',
    'findOneAndDelete',
    'findOneAndReplace',
    'countDocuments',
    'count',
    'updateMany',
    'updateOne',
    'deleteMany',
    'deleteOne',
    'replaceOne',
    'estimatedDocumentCount',
  ];

  for (const op of queryOps) {
    schema.pre(op, injectFilter);
  }

  schema.pre('save', function injectTenantOnSave() {
    const store = contextStorage.getStore();
    if (store?.skipTenantScope) return;
    const tenantId = toTenantObjectId(store?.tenantId);
    if (tenantId && !this[TENANT_FIELD]) {
      this[TENANT_FIELD] = tenantId;
    }
  });

  schema.pre('insertMany', function injectTenantOnInsertMany(docs) {
    const store = contextStorage.getStore();
    if (store?.skipTenantScope) return;
    const tenantId = toTenantObjectId(store?.tenantId);
    if (tenantId && Array.isArray(docs)) {
      for (const doc of docs) {
        if (doc && !doc[TENANT_FIELD]) doc[TENANT_FIELD] = tenantId;
      }
    }
  });
}

export default tenantScoped;
