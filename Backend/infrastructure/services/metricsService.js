import InfraServer from '../models/InfraServer.js';
import InfraMetric from '../models/InfraMetric.js';
import { raiseAlert } from './alertService.js';
import { getOrCreateSettings } from './settingsService.js';
import { writeInfraLog } from './logService.js';
import { normalizeAgentPayload } from './agentPullService.js';
import { syncCertbotCertificates } from './certbotSync.js';

const numOrNull = (v) => {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const clampPctOrNull = (n) => {
  const v = numOrNull(n);
  if (v == null) return null;
  return Math.max(0, Math.min(100, v));
};

const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

/** Prefer explicit payload value; keep previous only when payload omits the field. */
const pickMetric = (data, key, previous, transform = numOrNull) => {
  if (!hasOwn(data, key)) return previous ?? null;
  return transform(data[key]);
};

export const ingestServerMetrics = async (tenantId, serverId, payload = {}) => {
  const server = await InfraServer.findOne({ _id: serverId, tenantId });
  if (!server) {
    const err = new Error('Server not found');
    err.status = 404;
    throw err;
  }

  const looksNested = Boolean(payload.metrics || payload.cpu || payload.memory || payload.disk);
  const data = looksNested ? normalizeAgentPayload(payload) : { ...payload };

  const prev = server.latestMetrics || {};

  const metrics = {
    cpuUsage: pickMetric(data, 'cpuUsage', prev.cpuUsage, clampPctOrNull),
    ramUsage: pickMetric(data, 'ramUsage', prev.ramUsage, clampPctOrNull),
    ramTotalMb: pickMetric(data, 'ramTotalMb', prev.ramTotalMb),
    ramUsedMb: pickMetric(data, 'ramUsedMb', prev.ramUsedMb),
    diskUsage: pickMetric(data, 'diskUsage', prev.diskUsage, clampPctOrNull),
    diskTotalGb: pickMetric(data, 'diskTotalGb', prev.diskTotalGb),
    diskUsedGb: pickMetric(data, 'diskUsedGb', prev.diskUsedGb),
    swapUsage: pickMetric(data, 'swapUsage', prev.swapUsage, clampPctOrNull),
    diskIoReadMbps: pickMetric(data, 'diskIoReadMbps', prev.diskIoReadMbps),
    diskIoWriteMbps: pickMetric(data, 'diskIoWriteMbps', prev.diskIoWriteMbps),
    netUploadMbps: pickMetric(data, 'netUploadMbps', prev.netUploadMbps),
    netDownloadMbps: pickMetric(data, 'netDownloadMbps', prev.netDownloadMbps),
    bandwidthUsedGb: pickMetric(data, 'bandwidthUsedGb', prev.bandwidthUsedGb),
    networkRxBytes: pickMetric(data, 'networkRxBytes', prev.networkRxBytes),
    networkTxBytes: pickMetric(data, 'networkTxBytes', prev.networkTxBytes),
    loadAverage: Array.isArray(data.loadAverage)
      ? data.loadAverage.map((n) => (n == null ? null : Number(n)))
      : (prev.loadAverage || []),
    uptimeSec: pickMetric(data, 'uptimeSec', prev.uptimeSec),
    temperatureC: pickMetric(data, 'temperatureC', prev.temperatureC),
    processesRunning: pickMetric(data, 'processesRunning', prev.processesRunning),
    openPorts: Array.isArray(data.openPorts)
      ? data.openPorts.map(Number).filter((n) => Number.isFinite(n))
      : (prev.openPorts || []),
    source: hasOwn(data, 'source') ? (data.source || null) : (prev.source || null),
    agentExtras: hasOwn(data, 'agentExtras') ? data.agentExtras : (prev.agentExtras || null),
    collectedAt: data.collectedAt ? new Date(data.collectedAt) : new Date(),
  };

  if (data.hostname) server.hostname = data.hostname;
  if (data.osVersion) server.osVersion = data.osVersion;
  if (data.kernelVersion) server.kernelVersion = data.kernelVersion;
  if (data.timezone) server.timezone = data.timezone;

  server.latestMetrics = metrics;
  server.status = 'online';
  server.lastCheckedAt = new Date();
  await server.save();

  const at = new Date();
  const samples = [
    { kind: 'cpu', value: metrics.cpuUsage },
    { kind: 'ram', value: metrics.ramUsage },
    { kind: 'disk', value: metrics.diskUsage },
    { kind: 'network_up', value: metrics.netUploadMbps },
    { kind: 'network_down', value: metrics.netDownloadMbps },
    { kind: 'bandwidth', value: metrics.bandwidthUsedGb },
    { kind: 'load', value: Array.isArray(metrics.loadAverage) ? metrics.loadAverage[0] : null },
  ]
    .filter((s) => s.value != null && Number.isFinite(Number(s.value)))
    .map((s) => ({ tenantId, serverId: server._id, at, kind: s.kind, value: Number(s.value) }));

  if (samples.length) {
    await InfraMetric.insertMany(samples, { ordered: false }).catch(() => {});
  }

  const certs = metrics.agentExtras?.certbot?.certificates;
  if (Array.isArray(certs) && certs.length) {
    await syncCertbotCertificates(tenantId, certs).catch(() => {});
  }

  const settings = await getOrCreateSettings(tenantId);
  if (metrics.cpuUsage != null && metrics.cpuUsage >= settings.cpuAlertThreshold) {
    await raiseAlert({
      tenantId,
      type: 'high_cpu',
      severity: metrics.cpuUsage >= 95 ? 'critical' : 'warning',
      title: `High CPU on ${server.name}`,
      message: `CPU at ${metrics.cpuUsage}%`,
      entityType: 'server',
      entityId: server._id,
    });
  }
  if (metrics.ramUsage != null && metrics.ramUsage >= settings.ramAlertThreshold) {
    await raiseAlert({
      tenantId,
      type: 'high_ram',
      severity: metrics.ramUsage >= 95 ? 'critical' : 'warning',
      title: `High RAM on ${server.name}`,
      message: `RAM at ${metrics.ramUsage}%`,
      entityType: 'server',
      entityId: server._id,
    });
  }
  if (metrics.diskUsage != null && metrics.diskUsage >= settings.diskAlertThreshold) {
    await raiseAlert({
      tenantId,
      type: 'high_disk',
      severity: metrics.diskUsage >= 95 ? 'critical' : 'warning',
      title: `High disk on ${server.name}`,
      message: `Disk at ${metrics.diskUsage}%`,
      entityType: 'server',
      entityId: server._id,
    });
  }

  return server;
};

export const getMetricSeries = async ({
  tenantId,
  kind,
  serverId,
  websiteId,
  range = '24h',
}) => {
  const ranges = {
    '1h': 1,
    '24h': 24,
    '7d': 24 * 7,
    '30d': 24 * 30,
  };
  const hours = ranges[range] || 24;
  const since = new Date(Date.now() - hours * 3600000);
  const filter = { tenantId, kind, at: { $gte: since } };
  if (serverId) filter.serverId = serverId;
  if (websiteId) filter.websiteId = websiteId;

  const rows = await InfraMetric.find(filter).sort({ at: 1 }).limit(2000).lean();
  return rows.map((r) => ({ t: r.at, v: r.value }));
};

export const cleanupMetrics = async (tenantId, retentionDays = 30) => {
  const cutoff = new Date(Date.now() - retentionDays * 86400000);
  const res = await InfraMetric.deleteMany({ tenantId, at: { $lt: cutoff } });
  await writeInfraLog({
    tenantId,
    category: 'job',
    message: `Cleaned ${res.deletedCount || 0} metric samples older than ${retentionDays}d`,
  });
  return res.deletedCount || 0;
};
