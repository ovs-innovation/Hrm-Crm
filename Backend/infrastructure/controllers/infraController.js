import crypto from 'crypto';
import InfraServer from '../models/InfraServer.js';
import InfraWebsite from '../models/InfraWebsite.js';
import InfraService from '../models/InfraService.js';
import InfraDomain from '../models/InfraDomain.js';
import InfraSsl from '../models/InfraSsl.js';
import InfraBackup from '../models/InfraBackup.js';
import { getInfraDashboard } from '../services/dashboardService.js';
import { getOrCreateSettings, settingsPublicView, updateSettings, getDecryptedProviderToken, getDecryptedAgentToken } from '../services/settingsService.js';
import { listInfraLogs } from '../services/logService.js';
import { listAlerts, resolveAlert } from '../services/alertService.js';
import { checkWebsiteOnce } from '../services/websiteCheckService.js';
import { ingestServerMetrics, getMetricSeries } from '../services/metricsService.js';
import { normalizeAgentPayload } from '../services/agentPullService.js';
import { listIncidents, updateIncident } from '../services/incidentService.js';
import { writeInfraLog } from '../services/logService.js';
import { getMonitoringProvider } from '../providers/index.js';
import {
  daysUntil,
  domainStatusFromExpiry,
  sslStatusFromExpiry,
  refreshSslStatuses,
  refreshDomainStatuses,
  fetchLiveSslCertificate,
  fetchDomainExpiryViaRdap,
} from '../services/expiryService.js';
import { logAudit } from '../../utils/auditLogger.js';
import { cacheDel } from '../utils/cache.js';

const tenantIdOf = (req) => req.user?.tenantId || req.tenantId;

const actorOf = (req) => req.user?.name || req.user?.email || 'Admin';

const crudList = (Model) => async (req, res) => {
  try {
    const rows = await Model.find({ tenantId: tenantIdOf(req) }).sort({ updatedAt: -1 }).limit(500).lean();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const crudGet = (Model) => async (req, res) => {
  try {
    const row = await Model.findOne({ _id: req.params.id, tenantId: tenantIdOf(req) }).lean();
    if (!row) return res.status(404).json({ message: 'Not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const crudDelete = (Model, label) => async (req, res) => {
  try {
    const row = await Model.findOne({ _id: req.params.id, tenantId: tenantIdOf(req) });
    if (!row) return res.status(404).json({ message: 'Not found' });
    await row.deleteOne();
    await logAudit({ req, action: 'DELETE', module: 'infrastructure', entityId: req.params.id, entityLabel: label });
    await writeInfraLog({
      tenantId: tenantIdOf(req),
      category: 'manual',
      message: `Deleted ${label} ${req.params.id}`,
      actor: actorOf(req),
    });
    cacheDel(`infra:dashboard:${tenantIdOf(req)}`);
    res.json({ message: 'Removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getDashboard = async (req, res) => {
  try {
    const data = await getInfraDashboard(tenantIdOf(req));
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getSettings = async (req, res) => {
  try {
    const doc = await getOrCreateSettings(tenantIdOf(req));
    res.json(settingsPublicView(doc));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const putSettings = async (req, res) => {
  try {
    const result = await updateSettings(tenantIdOf(req), req.body || {});
    await logAudit({ req, action: 'UPDATE', module: 'infrastructure', entityLabel: 'settings' });
    await writeInfraLog({
      tenantId: tenantIdOf(req),
      category: 'manual',
      message: 'Infrastructure settings updated',
      actor: actorOf(req),
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const testProvider = async (req, res) => {
  try {
    const settings = await getOrCreateSettings(tenantIdOf(req));
    const token = await getDecryptedProviderToken(tenantIdOf(req));
    const provider = getMonitoringProvider(settings.provider, { apiToken: token });
    const result = await provider.testConnection();
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const syncProviderServers = async (req, res) => {
  try {
    const tid = tenantIdOf(req);
    const settings = await getOrCreateSettings(tid);
    const token = await getDecryptedProviderToken(tid);
    const provider = getMonitoringProvider(settings.provider, { apiToken: token });
    const remote = await provider.listServers();
    let created = 0;
    for (const item of remote) {
      if (!item.name) continue;
      const existing = await InfraServer.findOne({ tenantId: tid, providerRef: item.providerRef });
      if (existing) {
        Object.assign(existing, {
          hostname: item.hostname || existing.hostname,
          ipAddress: item.ipAddress || existing.ipAddress,
          region: item.region || existing.region,
          status: item.status || existing.status,
          osVersion: item.osVersion || existing.osVersion,
        });
        await existing.save();
      } else {
        await InfraServer.create({
          tenantId: tid,
          name: item.name,
          hostname: item.hostname,
          provider: settings.provider,
          providerRef: item.providerRef,
          ipAddress: item.ipAddress,
          region: item.region,
          status: item.status || 'unknown',
          osVersion: item.osVersion,
          createdBy: actorOf(req),
        });
        created += 1;
      }
    }
    await writeInfraLog({
      tenantId: tid,
      category: 'manual',
      message: `Synced ${remote.length} servers from ${settings.provider} (${created} new)`,
      actor: actorOf(req),
    });
    cacheDel(`infra:dashboard:${tid}`);
    res.json({ synced: remote.length, created });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

// —— Servers ——
export const listServers = crudList(InfraServer);
export const getServer = crudGet(InfraServer);
export const deleteServer = crudDelete(InfraServer, 'server');

export const createServer = async (req, res) => {
  try {
    const tid = tenantIdOf(req);
    const row = await InfraServer.create({
      ...req.body,
      tenantId: tid,
      createdBy: actorOf(req),
      name: String(req.body.name || '').trim(),
    });
    await logAudit({ req, action: 'CREATE', module: 'infrastructure', entityId: row._id, entityLabel: row.name });
    await writeInfraLog({ tenantId: tid, category: 'manual', message: `Server created: ${row.name}`, actor: actorOf(req) });
    cacheDel(`infra:dashboard:${tid}`);
    res.status(201).json(row);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateServer = async (req, res) => {
  try {
    const row = await InfraServer.findOne({ _id: req.params.id, tenantId: tenantIdOf(req) });
    if (!row) return res.status(404).json({ message: 'Not found' });
    const allowed = [
      'name', 'hostname', 'provider', 'providerRef', 'ipAddress', 'region',
      'osVersion', 'kernelVersion', 'timezone', 'status', 'pollingIntervalSec',
      'agentEnabled', 'agentBaseUrl', 'notes',
    ];
    for (const key of allowed) {
      if (req.body[key] !== undefined) row[key] = req.body[key];
    }
    await row.save();
    await logAudit({ req, action: 'UPDATE', module: 'infrastructure', entityId: row._id, entityLabel: row.name });
    cacheDel(`infra:dashboard:${tenantIdOf(req)}`);
    res.json(row);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const pushServerMetrics = async (req, res) => {
  try {
    const server = await ingestServerMetrics(tenantIdOf(req), req.params.id, req.body || {});
    cacheDel(`infra:dashboard:${tenantIdOf(req)}`);
    res.json(server);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

const tokensMatch = (provided, expected) => {
  const a = Buffer.from(String(provided));
  const b = Buffer.from(String(expected));
  if (a.length !== b.length) {
    crypto.timingSafeEqual(b, b);
    return false;
  }
  return crypto.timingSafeEqual(a, b);
};

const extractAgentToken = (req) => {
  const auth = req.headers.authorization || '';
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  return (
    req.headers['x-infra-agent-token'] ||
    req.headers['x-agent-token'] ||
    bearer ||
    ''
  );
};

/** Agent ingest — authenticated by agent token header, not user JWT (mounted separately). */
export const agentIngestMetrics = async (req, res) => {
  try {
    const token = extractAgentToken(req);
    if (!token) return res.status(401).json({ message: 'Missing agent token' });
    const serverId =
      req.body?.serverId ||
      req.headers['x-server-id'] ||
      req.params.serverId;
    if (!serverId) return res.status(400).json({ message: 'serverId required' });

    const server = await InfraServer.findById(serverId);
    if (!server) return res.status(404).json({ message: 'Server not found' });
    const expected = await getDecryptedAgentToken(server.tenantId);
    if (!expected || !tokensMatch(token, expected)) {
      return res.status(403).json({ message: 'Invalid agent token' });
    }

    const payload = normalizeAgentPayload(req.body || {});
    const updated = await ingestServerMetrics(server.tenantId, server._id, payload);
    cacheDel(`infra:dashboard:${server.tenantId}`);
    res.json({ ok: true, serverId: updated._id, status: updated.status });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const refreshSslNow = async (req, res) => {
  try {
    await refreshSslStatuses(tenantIdOf(req));
    cacheDel(`infra:dashboard:${tenantIdOf(req)}`);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const refreshDomainsNow = async (req, res) => {
  try {
    await refreshDomainStatuses(tenantIdOf(req));
    cacheDel(`infra:dashboard:${tenantIdOf(req)}`);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// —— Websites ——
export const listWebsites = crudList(InfraWebsite);
export const getWebsite = crudGet(InfraWebsite);
export const deleteWebsite = crudDelete(InfraWebsite, 'website');

export const createWebsite = async (req, res) => {
  try {
    const tid = tenantIdOf(req);
    const row = await InfraWebsite.create({
      ...req.body,
      tenantId: tid,
      domain: String(req.body.domain || '').trim().toLowerCase(),
      name: String(req.body.name || req.body.domain || '').trim(),
      createdBy: actorOf(req),
    });
    await logAudit({ req, action: 'CREATE', module: 'infrastructure', entityId: row._id, entityLabel: row.name });
    cacheDel(`infra:dashboard:${tid}`);
    res.status(201).json(row);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateWebsite = async (req, res) => {
  try {
    const row = await InfraWebsite.findOne({ _id: req.params.id, tenantId: tenantIdOf(req) });
    if (!row) return res.status(404).json({ message: 'Not found' });
    const allowed = [
      'name', 'domain', 'environment', 'protocol', 'port', 'healthPath',
      'autoPing', 'serverId', 'status', 'notes',
    ];
    for (const key of allowed) {
      if (req.body[key] !== undefined) row[key] = req.body[key];
    }
    if (row.domain) row.domain = String(row.domain).toLowerCase();
    await row.save();
    cacheDel(`infra:dashboard:${tenantIdOf(req)}`);
    res.json(row);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const checkWebsiteNow = async (req, res) => {
  try {
    const settings = await getOrCreateSettings(tenantIdOf(req));
    const row = await InfraWebsite.findOne({ _id: req.params.id, tenantId: tenantIdOf(req) });
    if (!row) return res.status(404).json({ message: 'Not found' });
    const updated = await checkWebsiteOnce(row, settings);
    await writeInfraLog({
      tenantId: tenantIdOf(req),
      category: 'manual',
      message: `Manual check: ${row.name}`,
      actor: actorOf(req),
    });
    cacheDel(`infra:dashboard:${tenantIdOf(req)}`);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// —— Services ——
export const listServices = crudList(InfraService);
export const getService = crudGet(InfraService);
export const deleteService = crudDelete(InfraService, 'service');

export const createService = async (req, res) => {
  try {
    const tid = tenantIdOf(req);
    const row = await InfraService.create({ ...req.body, tenantId: tid, createdBy: actorOf(req) });
    cacheDel(`infra:dashboard:${tid}`);
    res.status(201).json(row);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateService = async (req, res) => {
  try {
    const row = await InfraService.findOne({ _id: req.params.id, tenantId: tenantIdOf(req) });
    if (!row) return res.status(404).json({ message: 'Not found' });
    const allowed = [
      'name', 'kind', 'serverId', 'status', 'version', 'cpuUsage', 'ramUsageMb',
      'restartCount', 'uptimeSec', 'notes',
    ];
    for (const key of allowed) {
      if (req.body[key] !== undefined) row[key] = req.body[key];
    }
    row.lastCheckedAt = new Date();
    await row.save();
    if (row.status === 'failed' || row.status === 'stopped') {
      const { raiseAlert } = await import('../services/alertService.js');
      await raiseAlert({
        tenantId: tenantIdOf(req),
        type: ['mysql', 'postgresql', 'mongodb', 'redis'].includes(row.kind) ? 'database_down' : 'service_down',
        severity: 'critical',
        title: `Service ${row.status}: ${row.name}`,
        message: `${row.kind} is ${row.status}`,
        entityType: 'service',
        entityId: row._id,
      });
    }
    cacheDel(`infra:dashboard:${tenantIdOf(req)}`);
    res.json(row);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// —— Domains ——
export const listDomains = async (req, res) => {
  try {
    const rows = await InfraDomain.find({ tenantId: tenantIdOf(req) }).sort({ expiryDate: 1 }).lean();
    res.json(rows.map((d) => ({
      ...d,
      daysRemaining: daysUntil(d.expiryDate || d.renewalDate),
    })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
export const getDomain = crudGet(InfraDomain);
export const deleteDomain = crudDelete(InfraDomain, 'domain');

export const createDomain = async (req, res) => {
  try {
    const tid = tenantIdOf(req);
    const domain = String(req.body.domain || '').trim().toLowerCase();
    let expiryDate = req.body.expiryDate || null;
    let registrar = req.body.registrar || '';
    let expirySource = expiryDate ? 'metadata' : '';
    if (!expiryDate && domain) {
      try {
        const live = await fetchDomainExpiryViaRdap(domain);
        if (live?.expiryDate) {
          expiryDate = live.expiryDate;
          registrar = registrar || live.registrar || '';
          expirySource = 'rdap';
        }
      } catch {
        /* keep without live expiry */
      }
    }
    const row = await InfraDomain.create({
      ...req.body,
      tenantId: tid,
      domain,
      registrar,
      expiryDate,
      expirySource,
      lastCheckedAt: expirySource === 'rdap' ? new Date() : null,
      status: domainStatusFromExpiry(expiryDate || req.body.renewalDate, req.body.reminderDaysBefore || 30),
      createdBy: actorOf(req),
    });
    cacheDel(`infra:dashboard:${tid}`);
    res.status(201).json({ ...row.toObject(), daysRemaining: daysUntil(row.expiryDate || row.renewalDate) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateDomain = async (req, res) => {
  try {
    const row = await InfraDomain.findOne({ _id: req.params.id, tenantId: tenantIdOf(req) });
    if (!row) return res.status(404).json({ message: 'Not found' });
    const allowed = [
      'domain', 'registrar', 'purchaseDate', 'renewalDate', 'expiryDate',
      'autoRenewal', 'reminderDaysBefore', 'owner', 'notes',
    ];
    for (const key of allowed) {
      if (req.body[key] !== undefined) row[key] = req.body[key];
    }
    row.status = domainStatusFromExpiry(row.expiryDate || row.renewalDate, row.reminderDaysBefore);
    await row.save();
    cacheDel(`infra:dashboard:${tenantIdOf(req)}`);
    res.json({ ...row.toObject(), daysRemaining: daysUntil(row.expiryDate || row.renewalDate) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// —— SSL ——
export const listSsl = async (req, res) => {
  try {
    const rows = await InfraSsl.find({ tenantId: tenantIdOf(req) }).sort({ expiryDate: 1 }).lean();
    res.json(rows.map((s) => ({ ...s, daysRemaining: daysUntil(s.expiryDate) })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
export const getSsl = crudGet(InfraSsl);
export const deleteSsl = crudDelete(InfraSsl, 'ssl');

export const createSsl = async (req, res) => {
  try {
    const tid = tenantIdOf(req);
    const domain = String(req.body.domain || '').trim().toLowerCase();
    let issuedDate = req.body.issuedDate || null;
    let expiryDate = req.body.expiryDate || null;
    let provider = req.body.provider || '';
    if (!expiryDate && domain) {
      try {
        const live = await fetchLiveSslCertificate(domain, 443);
        if (live?.expiryDate) {
          expiryDate = live.expiryDate;
          issuedDate = issuedDate || live.issuedDate;
          provider = provider || live.issuer?.slice(0, 120) || '';
        }
      } catch {
        /* stored without live cert */
      }
    }
    const row = await InfraSsl.create({
      ...req.body,
      tenantId: tid,
      domain,
      issuedDate,
      expiryDate,
      provider,
      status: sslStatusFromExpiry(expiryDate),
      lastCheckedAt: expiryDate ? new Date() : null,
      createdBy: actorOf(req),
    });
    cacheDel(`infra:dashboard:${tid}`);
    res.status(201).json({ ...row.toObject(), daysRemaining: daysUntil(row.expiryDate) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateSsl = async (req, res) => {
  try {
    const row = await InfraSsl.findOne({ _id: req.params.id, tenantId: tenantIdOf(req) });
    if (!row) return res.status(404).json({ message: 'Not found' });
    const allowed = ['domain', 'provider', 'issuedDate', 'expiryDate', 'autoRenewal', 'websiteId', 'notes'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) row[key] = req.body[key];
    }
    row.status = sslStatusFromExpiry(row.expiryDate);
    await row.save();
    cacheDel(`infra:dashboard:${tenantIdOf(req)}`);
    res.json({ ...row.toObject(), daysRemaining: daysUntil(row.expiryDate) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// —— Backups ——
export const listBackups = crudList(InfraBackup);
export const getBackup = crudGet(InfraBackup);
export const deleteBackup = crudDelete(InfraBackup, 'backup');

export const createBackup = async (req, res) => {
  try {
    const tid = tenantIdOf(req);
    const row = await InfraBackup.create({ ...req.body, tenantId: tid, createdBy: actorOf(req) });
    if (row.status === 'failed') {
      const { raiseAlert } = await import('../services/alertService.js');
      await raiseAlert({
        tenantId: tid,
        type: 'backup_failed',
        severity: 'critical',
        title: `Backup failed: ${row.name}`,
        message: row.notes || 'Backup reported failed',
        entityType: 'backup',
        entityId: row._id,
      });
    }
    cacheDel(`infra:dashboard:${tid}`);
    res.status(201).json(row);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateBackup = async (req, res) => {
  try {
    const row = await InfraBackup.findOne({ _id: req.params.id, tenantId: tenantIdOf(req) });
    if (!row) return res.status(404).json({ message: 'Not found' });
    const allowed = [
      'name', 'serverId', 'location', 'status', 'sizeBytes', 'lastBackupAt',
      'nextBackupAt', 'durationSec', 'retentionDays', 'notes',
    ];
    for (const key of allowed) {
      if (req.body[key] !== undefined) row[key] = req.body[key];
    }
    await row.save();
    cacheDel(`infra:dashboard:${tenantIdOf(req)}`);
    res.json(row);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAlerts = async (req, res) => {
  try {
    const data = await listAlerts({
      tenantId: tenantIdOf(req),
      resolved: req.query.resolved,
      severity: req.query.severity,
      page: req.query.page,
      limit: req.query.limit,
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const patchAlert = async (req, res) => {
  try {
    const row = await resolveAlert(tenantIdOf(req), req.params.id, req.body || {});
    if (!row) return res.status(404).json({ message: 'Not found' });
    await writeInfraLog({
      tenantId: tenantIdOf(req),
      category: 'manual',
      message: `Alert resolved: ${row.title}`,
      actor: actorOf(req),
    });
    cacheDel(`infra:dashboard:${tenantIdOf(req)}`);
    res.json(row);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getLogs = async (req, res) => {
  try {
    const data = await listInfraLogs({
      tenantId: tenantIdOf(req),
      category: req.query.category,
      level: req.query.level,
      q: req.query.q,
      page: req.query.page,
      limit: req.query.limit,
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const exportLogs = async (req, res) => {
  try {
    const data = await listInfraLogs({
      tenantId: tenantIdOf(req),
      category: req.query.category,
      level: req.query.level,
      q: req.query.q,
      page: 1,
      limit: 1000,
    });
    const header = 'createdAt,category,level,message,actor\n';
    const csv = data.rows.map((r) =>
      [r.createdAt?.toISOString?.() || r.createdAt, r.category, r.level, JSON.stringify(r.message || ''), JSON.stringify(r.actor || '')].join(',')
    ).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="infra-logs.csv"');
    res.send(header + csv);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getIncidents = async (req, res) => {
  try {
    res.json(await listIncidents(tenantIdOf(req)));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const patchIncident = async (req, res) => {
  try {
    const row = await updateIncident(tenantIdOf(req), req.params.id, {
      ...req.body,
      actor: actorOf(req),
    });
    if (!row) return res.status(404).json({ message: 'Not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getMetrics = async (req, res) => {
  try {
    const series = await getMetricSeries({
      tenantId: tenantIdOf(req),
      kind: req.query.kind || 'cpu',
      serverId: req.query.serverId,
      websiteId: req.query.websiteId,
      range: req.query.range || '24h',
    });
    res.json({ kind: req.query.kind || 'cpu', range: req.query.range || '24h', points: series });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
