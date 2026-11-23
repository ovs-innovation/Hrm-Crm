import InfraWebsite from '../models/InfraWebsite.js';
import InfraMetric from '../models/InfraMetric.js';
import { raiseAlert } from './alertService.js';
import { writeInfraLog } from './logService.js';
import { getOrCreateSettings } from './settingsService.js';
import { fetchLiveSslCertificate } from './expiryService.js';
import { openIncident, noteRecovery } from './incidentService.js';

const classifyStatus = (ok, ms, httpStatus, slowMs) => {
  if (!ok) return 'offline';
  if (httpStatus >= 500) return 'offline';
  if (ms > slowMs) return 'slow';
  if (httpStatus >= 200 && httpStatus < 400) return 'online';
  return 'unknown';
};

export const buildCheckUrl = (site) => {
  const proto = site.protocol || 'https';
  const port = site.port ? `:${site.port}` : '';
  const path = site.healthPath?.startsWith('/') ? site.healthPath : `/${site.healthPath || 'health'}`;
  return `${proto}://${site.domain}${port}${path}`;
};

export const checkWebsiteOnce = async (site, settings) => {
  const url = buildCheckUrl(site);
  const slowMs = settings?.slowResponseMs || 1500;
  const started = Date.now();
  let httpStatus = null;
  let ok = false;
  let errorMsg = '';

  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: AbortSignal.timeout(12000),
      headers: { 'User-Agent': 'Vastora-InfraMonitor/1.0' },
    });
    httpStatus = res.status;
    ok = res.status >= 200 && res.status < 500;
  } catch (err) {
    errorMsg = err.message;
    ok = false;
  }

  const responseTimeMs = Date.now() - started;
  const status = classifyStatus(ok, responseTimeMs, httpStatus || 0, slowMs);

  site.checksTotal = (site.checksTotal || 0) + 1;
  if (ok && status !== 'offline') site.checksSuccess = (site.checksSuccess || 0) + 1;
  site.uptimePercent = site.checksTotal
    ? Math.round((site.checksSuccess / site.checksTotal) * 10000) / 100
    : 100;
  site.httpStatus = httpStatus;
  site.responseTimeMs = responseTimeMs;
  site.status = site.status === 'maintenance' ? 'maintenance' : status;
  site.lastCheckedAt = new Date();
  if (status === 'offline') site.lastDowntimeAt = new Date();

  // Live SSL certificate read for https sites
  if ((site.protocol || 'https') === 'https') {
    try {
      const cert = await fetchLiveSslCertificate(site.domain, site.port || 443);
      if (cert?.expiryDate) {
        site.sslExpiry = cert.expiryDate;
        const days = Math.ceil((cert.expiryDate.getTime() - Date.now()) / 86400000);
        site.sslStatus = days < 0 ? 'expired' : days <= 30 ? 'expiring' : 'valid';
      }
    } catch {
      /* ignore */
    }
  }

  await site.save();

  await InfraMetric.create({
    tenantId: site.tenantId,
    websiteId: site._id,
    kind: 'response_time',
    value: responseTimeMs,
    at: new Date(),
  }).catch(() => {});

  await writeInfraLog({
    tenantId: site.tenantId,
    category: 'website_check',
    level: status === 'offline' ? 'error' : status === 'slow' ? 'warn' : 'info',
    message: `${site.name} → ${status} (${responseTimeMs}ms)${errorMsg ? ` ${errorMsg}` : ''}`,
    meta: { websiteId: String(site._id), httpStatus, url },
  });

  if (status === 'offline') {
    await raiseAlert({
      tenantId: site.tenantId,
      type: 'website_down',
      severity: 'critical',
      title: `Website down: ${site.name}`,
      message: `${url} failed. HTTP ${httpStatus || 'n/a'}. ${errorMsg}`,
      entityType: 'website',
      entityId: site._id,
    });
    await openIncident({
      tenantId: site.tenantId,
      title: `${site.name} down`,
      priority: 'critical',
      entityType: 'website',
      entityId: site._id,
      message: `HTTP ${httpStatus || 'n/a'}${errorMsg ? ` ${errorMsg}` : ''}`,
    }).catch(() => {});
  } else if (status === 'online') {
    await noteRecovery({
      tenantId: site.tenantId,
      entityType: 'website',
      entityId: site._id,
      message: `Website responded ${httpStatus} in ${responseTimeMs}ms`,
    }).catch(() => {});
  }

  return site;
};

export const peekSslExpiry = async (host, port = 443) => {
  const cert = await fetchLiveSslCertificate(host, port);
  return cert?.expiryDate || null;
};

export const runWebsiteChecksForTenant = async (tenantId) => {
  const settings = await getOrCreateSettings(tenantId);
  const sites = await InfraWebsite.find({ tenantId, autoPing: true }).limit(100);
  for (const site of sites) {
    try {
      await checkWebsiteOnce(site, settings);
    } catch (err) {
      console.error('[infra:website]', site.domain, err.message);
    }
  }
};
