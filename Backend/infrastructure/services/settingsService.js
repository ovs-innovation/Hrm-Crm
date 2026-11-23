import InfraSettings from '../models/InfraSettings.js';
import { encryptSecret, decryptSecret, maskSecret } from '../utils/crypto.js';
import { cacheDel, cacheGet, cacheSet } from '../utils/cache.js';

export const getOrCreateSettings = async (tenantId) => {
  const cacheKey = `infra:settings:${tenantId}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  let doc = await InfraSettings.findOne({ tenantId, singleton: 'default' });
  if (!doc) {
    doc = await InfraSettings.create({ tenantId, singleton: 'default' });
  }
  cacheSet(cacheKey, doc, 10000);
  return doc;
};

export const settingsPublicView = (doc) => {
  const o = doc.toObject ? doc.toObject() : { ...doc };
  delete o.providerApiTokenEnc;
  delete o.agentIngestTokenEnc;
  return {
    ...o,
    hasProviderApiToken: Boolean(doc.providerApiTokenEnc),
    hasAgentIngestToken: Boolean(doc.agentIngestTokenEnc),
    providerApiTokenMasked: doc.providerApiTokenEnc ? '••••configured' : '',
    agentIngestTokenMasked: doc.agentIngestTokenEnc ? '••••configured' : '',
  };
};

export const updateSettings = async (tenantId, body = {}) => {
  const doc = await getOrCreateSettings(tenantId);
  const numeric = [
    'pollingIntervalSec', 'websiteCheckIntervalSec', 'serverMetricsIntervalSec',
    'sslCheckCronHour', 'domainCheckCronHour', 'backupCheckIntervalSec',
    'logRetentionDays', 'metricRetentionDays',
    'cpuAlertThreshold', 'ramAlertThreshold', 'diskAlertThreshold', 'slowResponseMs',
  ];
  for (const key of numeric) {
    if (body[key] !== undefined && body[key] !== null && body[key] !== '') {
      doc[key] = Number(body[key]);
    }
  }
  if (body.provider) doc.provider = body.provider;
  if (body.providerApiToken) {
    doc.providerApiTokenEnc = encryptSecret(body.providerApiToken);
  }
  if (body.clearProviderApiToken) doc.providerApiTokenEnc = '';
  if (body.agentIngestToken) {
    doc.agentIngestTokenEnc = encryptSecret(body.agentIngestToken);
  }
  if (body.clearAgentIngestToken) doc.agentIngestTokenEnc = '';
  if (body.generateAgentIngestToken) {
    const token = `infra_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 14)}`;
    doc.agentIngestTokenEnc = encryptSecret(token);
    await doc.save();
    cacheDel(`infra:settings:${tenantId}`);
    return { settings: settingsPublicView(doc), generatedAgentToken: token };
  }
  if (body.notifications && typeof body.notifications === 'object') {
    doc.notifications = {
      ...doc.notifications?.toObject?.() || doc.notifications || {},
      ...body.notifications,
    };
  }
  await doc.save();
  cacheDel(`infra:settings:${tenantId}`);
  return { settings: settingsPublicView(doc) };
};

export const getDecryptedProviderToken = async (tenantId) => {
  const doc = await getOrCreateSettings(tenantId);
  return decryptSecret(doc.providerApiTokenEnc);
};

export const getDecryptedAgentToken = async (tenantId) => {
  const doc = await getOrCreateSettings(tenantId);
  return decryptSecret(doc.agentIngestTokenEnc);
};

export { maskSecret };
