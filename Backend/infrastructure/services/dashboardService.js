import InfraServer from '../models/InfraServer.js';
import InfraWebsite from '../models/InfraWebsite.js';
import InfraService from '../models/InfraService.js';
import InfraDomain from '../models/InfraDomain.js';
import InfraSsl from '../models/InfraSsl.js';
import InfraBackup from '../models/InfraBackup.js';
import InfraAlert from '../models/InfraAlert.js';
import InfraLog from '../models/InfraLog.js';
import { cacheGet, cacheSet } from '../utils/cache.js';
import { daysUntil } from './expiryService.js';

/** Average only real numeric samples; return null when none available. */
const avgOrNull = (arr, pick) => {
  const vals = arr
    .map((x) => pick(x))
    .filter((v) => v != null && Number.isFinite(Number(v)))
    .map(Number);
  if (!vals.length) return null;
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
};

export const getInfraDashboard = async (tenantId) => {
  const cacheKey = `infra:dashboard:${tenantId}`;
  const cached = cacheGet(cacheKey);
  if (cached) return { ...cached, cached: true };

  const [
    servers,
    websites,
    services,
    domains,
    ssls,
    backups,
    alerts,
    logs,
  ] = await Promise.all([
    InfraServer.find({ tenantId }).lean(),
    InfraWebsite.find({ tenantId }).lean(),
    InfraService.find({ tenantId }).lean(),
    InfraDomain.find({ tenantId }).lean(),
    InfraSsl.find({ tenantId }).lean(),
    InfraBackup.find({ tenantId }).sort({ lastBackupAt: -1 }).limit(20).lean(),
    InfraAlert.find({ tenantId }).sort({ createdAt: -1 }).limit(15).lean(),
    InfraLog.find({ tenantId }).sort({ createdAt: -1 }).limit(20).lean(),
  ]);

  const onlineServers = servers.filter((s) => s.status === 'online').length;
  const onlineSites = websites.filter((s) => s.status === 'online').length;
  const offlineSites = websites.filter((s) => s.status === 'offline').length;
  const runningServices = services.filter((s) => s.status === 'running').length;

  const withMetrics = servers.filter((s) => s.latestMetrics?.collectedAt);
  const cpuUsage = avgOrNull(withMetrics, (s) => s.latestMetrics.cpuUsage);
  const ramUsage = avgOrNull(withMetrics, (s) => s.latestMetrics.ramUsage);
  const diskUsage = avgOrNull(withMetrics, (s) => s.latestMetrics.diskUsage);
  const swapUsage = avgOrNull(withMetrics, (s) => s.latestMetrics.swapUsage);
  const netUp = avgOrNull(withMetrics, (s) => s.latestMetrics.netUploadMbps);
  const netDown = avgOrNull(withMetrics, (s) => s.latestMetrics.netDownloadMbps);
  const bandwidth = avgOrNull(withMetrics, (s) => s.latestMetrics.bandwidthUsedGb);

  const firstWithLoad = withMetrics.find((s) => Array.isArray(s.latestMetrics?.loadAverage) && s.latestMetrics.loadAverage.some((n) => n != null));
  const loadAverage = firstWithLoad?.latestMetrics?.loadAverage || null;
  const firstWithUptime = withMetrics.find((s) => s.latestMetrics?.uptimeSec != null);
  const uptimeSec = firstWithUptime?.latestMetrics?.uptimeSec ?? null;

  const sslExpiring = ssls
    .map((s) => ({ ...s, daysRemaining: daysUntil(s.expiryDate) }))
    .filter((s) => s.daysRemaining != null && s.daysRemaining <= 30)
    .sort((a, b) => a.daysRemaining - b.daysRemaining)
    .slice(0, 12);

  const cronJobs = servers.flatMap((s) => {
    const jobs = s.latestMetrics?.agentExtras?.cron?.jobs;
    if (!Array.isArray(jobs)) return [];
    return jobs.slice(0, 20).map((job) => ({
      ...job,
      server: s.name || s.hostname || '',
    }));
  }).slice(0, 20);

  const domainRenewals = domains
    .map((d) => ({ ...d, daysRemaining: daysUntil(d.expiryDate || d.renewalDate) }))
    .filter((d) => d.daysRemaining != null && d.daysRemaining <= 45)
    .sort((a, b) => a.daysRemaining - b.daysRemaining)
    .slice(0, 10);

  const healthScore = (() => {
    if (!servers.length && !websites.length) return null;
    let score = 100;
    let hasSignal = false;
    if (websites.length) {
      hasSignal = true;
      score -= offlineSites * 8;
    }
    if (cpuUsage != null) {
      hasSignal = true;
      score -= Math.max(0, cpuUsage - 70) * 0.4;
    }
    if (ramUsage != null) {
      hasSignal = true;
      score -= Math.max(0, ramUsage - 75) * 0.4;
    }
    if (diskUsage != null) {
      hasSignal = true;
      score -= Math.max(0, diskUsage - 80) * 0.5;
    }
    const critical = alerts.filter((a) => !a.resolved && a.severity === 'critical').length;
    if (critical) {
      hasSignal = true;
      score -= critical * 5;
    }
    if (!hasSignal) return null;
    return Math.max(0, Math.min(100, Math.round(score)));
  })();

  const payload = {
    cached: false,
    refreshedAt: new Date().toISOString(),
    health: {
      score: healthScore,
      label:
        healthScore == null
          ? 'No data'
          : healthScore >= 85
            ? 'Healthy'
            : healthScore >= 60
              ? 'Degraded'
              : 'Critical',
    },
    counts: {
      servers: servers.length,
      serversOnline: onlineServers,
      websites: websites.length,
      websitesOnline: onlineSites,
      websitesOffline: offlineSites,
      services: services.length,
      servicesRunning: runningServices,
      openAlerts: alerts.filter((a) => !a.resolved).length,
    },
    resources: {
      cpuUsage,
      ramUsage,
      diskUsage,
      swapUsage,
      bandwidthUsageGb: bandwidth,
      networkUploadMbps: netUp,
      networkDownloadMbps: netDown,
      loadAverage,
      uptimeSec,
    },
    upcomingRenewals: domainRenewals,
    sslExpiringSoon: sslExpiring,
    cronJobs,
    recentAlerts: alerts,
    recentLogs: logs,
    recentBackups: backups.slice(0, 5),
  };

  cacheSet(cacheKey, payload, 12000);
  return payload;
};
