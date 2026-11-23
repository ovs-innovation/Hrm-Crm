import mongoose from 'mongoose';
import InfraSettings from '../models/InfraSettings.js';
import InfraServer from '../models/InfraServer.js';
import InfraBackup from '../models/InfraBackup.js';
import { runWebsiteChecksForTenant } from '../services/websiteCheckService.js';
import { refreshDomainStatuses, refreshSslStatuses } from '../services/expiryService.js';
import { cleanupMetrics, ingestServerMetrics } from '../services/metricsService.js';
import { cleanupInfraLogs, writeInfraLog } from '../services/logService.js';
import { getMonitoringProvider } from '../providers/index.js';
import { getDecryptedProviderToken } from '../services/settingsService.js';
import { pullAgentMetrics } from '../services/agentPullService.js';
import { raiseAlert } from '../services/alertService.js';
import { withoutTenantScope } from '../../plugins/tenantScope.plugin.js';
import { contextStorage } from '../../middlewares/contextMiddleware.js';

let started = false;
const timers = [];

const listTenantIds = async () =>
  withoutTenantScope(async () => {
    const rows = await InfraSettings.find({}).select('tenantId').lean();
    const fromSettings = rows.map((r) => String(r.tenantId)).filter(Boolean);
    if (fromSettings.length) return [...new Set(fromSettings)];
    const servers = await InfraServer.find({}).select('tenantId').lean();
    const fromServers = servers.map((s) => String(s.tenantId)).filter(Boolean);
    if (fromServers.length) return [...new Set(fromServers)];
    try {
      const Tenant = (await import('../../models/Tenant.js')).default;
      const tenants = await Tenant.find({ isActive: { $ne: false } }).select('_id').limit(50).lean();
      return tenants.map((t) => String(t._id));
    } catch {
      return [];
    }
  });

const withTenant = async (tenantId, fn) =>
  contextStorage.run({ tenantId: String(tenantId), skipTenantScope: false }, () => fn(tenantId));

const safeRun = async (label, fn) => {
  try {
    await fn();
  } catch (err) {
    console.error(`[infra:job:${label}]`, err.message);
  }
};

const runWebsiteJob = async () => {
  const tenants = await listTenantIds();
  for (const tid of tenants) {
    await safeRun(`websites:${tid}`, () => withTenant(tid, runWebsiteChecksForTenant));
  }
};

const runProviderMetricsJob = async () => {
  const tenants = await listTenantIds();
  for (const tid of tenants) {
    await safeRun(`provider-metrics:${tid}`, async () => {
      await withTenant(tid, async () => {
        const token = await getDecryptedProviderToken(tid);
        const settings = await InfraSettings.findOne({ tenantId: tid, singleton: 'default' });
        if (!settings || settings.provider === 'local' || !token) return;
        const provider = getMonitoringProvider(settings.provider, { apiToken: token });
        const servers = await InfraServer.find({
          tenantId: tid,
          provider: settings.provider,
          providerRef: { $ne: '' },
        }).limit(50);
        for (const server of servers) {
          try {
            const metrics = await provider.fetchServerMetrics(server.providerRef);
            if (metrics) await ingestServerMetrics(tid, server._id, metrics);
          } catch (err) {
            await writeInfraLog({
              tenantId: tid,
              category: 'error',
              level: 'warn',
              message: `Provider metrics failed for ${server.name}: ${err.message}`,
            });
          }
        }
      });
    });
  }
};

/** Pull from VPS agents when agentBaseUrl is set (fills Hostinger gaps too). */
const runAgentPullJob = async () => {
  const tenants = await listTenantIds();
  for (const tid of tenants) {
    await safeRun(`agent-pull:${tid}`, async () => {
      await withTenant(tid, async () => {
        const servers = await InfraServer.find({
          tenantId: tid,
          agentEnabled: true,
          agentBaseUrl: { $nin: ['', null] },
        }).limit(50);
        for (const server of servers) {
          try {
            const metrics = await pullAgentMetrics(server, tid);
            if (metrics) await ingestServerMetrics(tid, server._id, metrics);
          } catch (err) {
            server.status = 'degraded';
            server.lastCheckedAt = new Date();
            await server.save().catch(() => {});
            await writeInfraLog({
              tenantId: tid,
              category: 'error',
              level: 'warn',
              message: `Agent pull failed for ${server.name}: ${err.message}`,
            });
          }
        }
      });
    });
  }
};

const runSslJob = async () => {
  const tenants = await listTenantIds();
  for (const tid of tenants) {
    await safeRun(`ssl:${tid}`, () => withTenant(tid, refreshSslStatuses));
  }
};

const runDomainJob = async () => {
  const tenants = await listTenantIds();
  for (const tid of tenants) {
    await safeRun(`domain:${tid}`, () => withTenant(tid, refreshDomainStatuses));
  }
};

const runBackupStatusJob = async () => {
  const tenants = await listTenantIds();
  for (const tid of tenants) {
    await safeRun(`backup:${tid}`, async () => {
      await withTenant(tid, async () => {
        const failed = await InfraBackup.find({ tenantId: tid, status: 'failed' }).limit(20);
        for (const b of failed) {
          await raiseAlert({
            tenantId: tid,
            type: 'backup_failed',
            severity: 'critical',
            title: `Backup failed: ${b.name}`,
            message: b.notes || 'Backup status is failed',
            entityType: 'backup',
            entityId: b._id,
            dedupeMinutes: 360,
          });
        }
      });
    });
  }
};

const runCleanupJob = async () => {
  const tenants = await listTenantIds();
  for (const tid of tenants) {
    await safeRun(`cleanup:${tid}`, async () => {
      await withTenant(tid, async () => {
        const settings = await InfraSettings.findOne({ tenantId: tid, singleton: 'default' });
        const logDays = settings?.logRetentionDays || 30;
        const metricDays = settings?.metricRetentionDays || 30;
        await cleanupInfraLogs(tid, logDays);
        await cleanupMetrics(tid, metricDays);
      });
    });
  }
};

/**
 * Start lightweight interval jobs. Does not block API. Safe to call once after DB connect.
 */
export const startInfrastructureJobs = () => {
  if (started) return;
  if (process.env.INFRA_JOBS_DISABLED === 'true') {
    console.log('[infra] background jobs disabled via INFRA_JOBS_DISABLED');
    return;
  }
  started = true;

  timers.push(setInterval(() => {
    if (mongoose.connection.readyState !== 1) return;
    safeRun('websites', runWebsiteJob);
  }, 60 * 1000));

  timers.push(setInterval(() => {
    if (mongoose.connection.readyState !== 1) return;
    safeRun('provider-metrics', runProviderMetricsJob);
    safeRun('agent-pull', runAgentPullJob);
  }, 60 * 1000));

  timers.push(setInterval(() => {
    if (mongoose.connection.readyState !== 1) return;
    safeRun('backups', runBackupStatusJob);
  }, 60 * 60 * 1000));

  timers.push(setInterval(() => {
    if (mongoose.connection.readyState !== 1) return;
    const hour = new Date().getHours();
    if (hour === 3) safeRun('ssl', runSslJob);
    if (hour === 4) safeRun('domain', runDomainJob);
    if (hour === 5) safeRun('cleanup', runCleanupJob);
  }, 60 * 60 * 1000));

  timers.forEach((t) => t.unref?.());

  setTimeout(() => {
    if (mongoose.connection.readyState === 1) {
      safeRun('websites-boot', runWebsiteJob);
      safeRun('agent-pull-boot', runAgentPullJob);
    }
  }, 20000).unref?.();

  // Live SSL/domain shortly after boot (not only at 3am)
  setTimeout(() => {
    if (mongoose.connection.readyState === 1) {
      safeRun('ssl-boot', runSslJob);
      safeRun('domain-boot', runDomainJob);
    }
  }, 45000).unref?.();

  console.log('[infra] background monitoring jobs started');
};

export const stopInfrastructureJobs = () => {
  timers.splice(0).forEach((t) => clearInterval(t));
  started = false;
};
