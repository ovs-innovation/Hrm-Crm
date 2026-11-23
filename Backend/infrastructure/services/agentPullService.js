import { getDecryptedAgentToken } from './settingsService.js';
import { writeInfraLog } from './logService.js';

/**
 * Normalize agent /metrics JSON (or flat push body) into ingestServerMetrics payload.
 * Never invents numbers — missing fields stay null/undefined.
 */
export const normalizeAgentPayload = (raw = {}) => {
  const nested = raw.metrics && typeof raw.metrics === 'object' ? raw.metrics : raw;
  const cpu = nested.cpu || {};
  const memory = nested.memory || {};
  const disk = nested.disk || {};
  const network = nested.network || {};
  const load = cpu.load || {};

  const cpuUsage =
    nested.cpuUsage != null
      ? Number(nested.cpuUsage)
      : cpu.percent != null
        ? Number(cpu.percent)
        : null;

  const ramUsage =
    nested.ramUsage != null
      ? Number(nested.ramUsage)
      : memory.percent != null
        ? Number(memory.percent)
        : null;

  const ramTotalMb =
    nested.ramTotalMb != null
      ? Number(nested.ramTotalMb)
      : memory.totalMb != null
        ? Number(memory.totalMb)
        : null;

  const ramUsedMb =
    nested.ramUsedMb != null
      ? Number(nested.ramUsedMb)
      : memory.usedMb != null
        ? Number(memory.usedMb)
        : null;

  const diskUsage =
    nested.diskUsage != null
      ? Number(nested.diskUsage)
      : disk.rootPercent != null
        ? Number(disk.rootPercent)
        : null;

  let diskTotalGb = nested.diskTotalGb != null ? Number(nested.diskTotalGb) : null;
  let diskUsedGb = nested.diskUsedGb != null ? Number(nested.diskUsedGb) : null;
  if ((diskTotalGb == null || diskUsedGb == null) && Array.isArray(disk.mounts)) {
    const root = disk.mounts.find((m) => m.mount === '/') || disk.mounts[0];
    if (root?.sizeKb != null) diskTotalGb = Math.round((root.sizeKb / (1024 * 1024)) * 100) / 100;
    if (root?.usedKb != null) diskUsedGb = Math.round((root.usedKb / (1024 * 1024)) * 100) / 100;
  }

  const loadAverage = Array.isArray(nested.loadAverage)
    ? nested.loadAverage.map(Number)
    : [load.load1, load.load5, load.load15].some((n) => n != null)
      ? [load.load1, load.load5, load.load15].map((n) => (n == null ? null : Number(n)))
      : null;

  const uptimeSec =
    nested.uptimeSec != null
      ? Number(nested.uptimeSec)
      : nested.uptimeSec === 0
        ? 0
        : null;

  return {
    source: nested.source || raw.source || 'agent',
    cpuUsage,
    ramUsage,
    ramTotalMb,
    ramUsedMb,
    diskUsage,
    diskTotalGb,
    diskUsedGb,
    swapUsage: nested.swapUsage != null ? Number(nested.swapUsage) : null,
    diskIoReadMbps: nested.diskIoReadMbps != null ? Number(nested.diskIoReadMbps) : null,
    diskIoWriteMbps: nested.diskIoWriteMbps != null ? Number(nested.diskIoWriteMbps) : null,
    netUploadMbps: nested.netUploadMbps != null ? Number(nested.netUploadMbps) : null,
    netDownloadMbps: nested.netDownloadMbps != null ? Number(nested.netDownloadMbps) : null,
    bandwidthUsedGb: nested.bandwidthUsedGb != null ? Number(nested.bandwidthUsedGb) : null,
    networkRxBytes: network.rxBytes != null ? Number(network.rxBytes) : nested.networkRxBytes ?? null,
    networkTxBytes: network.txBytes != null ? Number(network.txBytes) : nested.networkTxBytes ?? null,
    loadAverage,
    uptimeSec: uptimeSec ?? (nested.uptimeSec != null ? Number(nested.uptimeSec) : null),
    temperatureC: nested.temperatureC != null ? Number(nested.temperatureC) : null,
    processesRunning: nested.processesRunning != null ? Number(nested.processesRunning) : null,
    openPorts: Array.isArray(nested.openPorts) ? nested.openPorts : undefined,
    hostname: nested.hostname || raw.hostname || undefined,
    osVersion: nested.release || nested.platform
      ? [nested.platform, nested.release].filter(Boolean).join(' ')
      : nested.osVersion || undefined,
    kernelVersion: nested.kernelVersion || undefined,
    timezone: nested.timezone || undefined,
    agentExtras: {
      docker: nested.docker || null,
      pm2: nested.pm2 || null,
      nginx: nested.nginx || null,
      certbot: nested.certbot || null,
      cron: nested.cron || null,
      cores: cpu.cores ?? null,
      cpuModel: cpu.model || null,
      diskMounts: disk.mounts || null,
      collectedAt: nested.collectedAt || raw.collectedAt || null,
    },
    collectedAt: nested.collectedAt || raw.collectedAt || new Date().toISOString(),
  };
};

/**
 * Pull metrics from a VPS agent HTTP endpoint.
 * Prefers per-server agentBaseUrl + shared tenant agent token.
 */
export const pullAgentMetrics = async (server, tenantId) => {
  const base = String(server.agentBaseUrl || '').replace(/\/$/, '');
  if (!base) return null;

  const token =
    server.agentToken ||
    (await getDecryptedAgentToken(tenantId));
  if (!token) {
    await writeInfraLog({
      tenantId,
      category: 'error',
      level: 'warn',
      message: `Agent pull skipped for ${server.name}: no agent token configured`,
    });
    return null;
  }

  const url = `${base}/metrics`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Agent-Token': token,
      'X-Infra-Agent-Token': token,
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const err = new Error(`Agent ${res.status}: ${text.slice(0, 160)}`);
    err.status = res.status;
    throw err;
  }

  const body = await res.json();
  return normalizeAgentPayload(body);
};
