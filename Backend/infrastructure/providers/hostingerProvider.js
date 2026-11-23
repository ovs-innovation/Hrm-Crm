import { BaseMonitoringProvider } from './baseProvider.js';

/**
 * Official Hostinger VPS API adapter.
 * Docs: https://developers.hostinger.com — /api/vps/v1/virtual-machines
 * Never logs the API token.
 */
export class HostingerMonitoringProvider extends BaseMonitoringProvider {
  get id() {
    return 'hostinger';
  }

  get baseUrl() {
    return (this.config.baseUrl || process.env.HOSTINGER_API_BASE || 'https://developers.hostinger.com').replace(/\/$/, '');
  }

  async #request(path, query) {
    const token = this.config.apiToken;
    if (!token) {
      const err = new Error('Hostinger API token not configured');
      err.status = 400;
      throw err;
    }
    const url = new URL(`${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`);
    if (query) {
      Object.entries(query).forEach(([k, v]) => {
        if (v != null && v !== '') url.searchParams.set(k, v);
      });
    }
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      const err = new Error(`Hostinger API ${res.status}: ${text.slice(0, 240)}`);
      err.status = res.status === 401 || res.status === 403 ? 401 : 502;
      throw err;
    }
    return res.json().catch(() => ({}));
  }

  #latestSample(metric) {
    if (!metric || typeof metric !== 'object') return null;
    const usage = metric.usage || metric;
    if (typeof usage !== 'object' || Array.isArray(usage)) {
      return typeof metric === 'number' ? metric : null;
    }
    const keys = Object.keys(usage).sort((a, b) => Number(a) - Number(b));
    if (!keys.length) return null;
    const val = usage[keys[keys.length - 1]];
    return val == null ? null : Number(val);
  }

  /** Hostinger VM details sometimes return disk/memory in bytes, sometimes GB/MB. */
  #asGb(value) {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) return 0;
    return n > 1e9 ? n / (1024 ** 3) : n;
  }

  #asMb(value) {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) return 0;
    return n > 1e9 ? n / (1024 ** 2) : n;
  }

  #mapVm(row) {
    const ipv4 = Array.isArray(row.ipv4)
      ? row.ipv4[0]?.address || row.ipv4[0]
      : row.ip || row.ipv4 || row.primary_ip || '';
    const statusRaw = String(row.state || row.status || '').toLowerCase();
    let status = 'unknown';
    if (['running', 'active', 'started'].some((s) => statusRaw.includes(s))) status = 'online';
    else if (['stopped', 'offline', 'suspended'].some((s) => statusRaw.includes(s))) status = 'offline';

    return {
      providerRef: String(row.id ?? row.virtualMachineId ?? ''),
      name: row.hostname || row.name || `Hostinger VPS ${row.id || ''}`.trim(),
      hostname: row.hostname || '',
      ipAddress: String(ipv4 || ''),
      region: row.datacenter?.name || row.datacenter || row.region || '',
      status,
      osVersion: row.template?.name || row.os || row.template || '',
    };
  }

  async listServers() {
    const data = await this.#request('/api/vps/v1/virtual-machines');
    const rows = Array.isArray(data) ? data : data?.data || data?.items || [];
    return rows.map((row) => this.#mapVm(row)).filter((r) => r.providerRef);
  }

  async fetchServerMetrics(providerRef) {
    if (!providerRef || !this.config.apiToken) return null;

    const dateTo = new Date();
    const dateFrom = new Date(Date.now() - 2 * 60 * 60 * 1000); // last 2h for latest point
    const data = await this.#request(
      `/api/vps/v1/virtual-machines/${encodeURIComponent(providerRef)}/metrics`,
      {
        date_from: dateFrom.toISOString(),
        date_to: dateTo.toISOString(),
      }
    );

    const payload = data?.data || data || {};
    const cpu = this.#latestSample(payload.cpu_usage);
    const ramBytes = this.#latestSample(payload.ram_usage);
    const diskBytes = this.#latestSample(payload.disk_space);
    const outBytes = this.#latestSample(payload.outgoing_traffic);
    const inBytes = this.#latestSample(payload.incoming_traffic);
    const uptimeRaw = this.#latestSample(payload.uptime);
    const uptimeUnit = String(payload.uptime?.unit || 'seconds').toLowerCase();

    // Hostinger returns absolute RAM/disk bytes for the latest sample — percent needs totals from VM details when available
    let ramTotalMb = Number(this.config.ramTotalMb) || 0;
    let diskTotalGb = Number(this.config.diskTotalGb) || 0;
    try {
      const details = await this.#request(`/api/vps/v1/virtual-machines/${encodeURIComponent(providerRef)}`);
      const vm = details?.data || details || {};
      if (vm.memory) ramTotalMb = this.#asMb(vm.memory) || ramTotalMb;
      if (vm.disk) diskTotalGb = this.#asGb(vm.disk) || diskTotalGb;
    } catch {
      /* optional */
    }

    const ramUsedMb = ramBytes != null ? Math.round(ramBytes / (1024 * 1024)) : null;
    const diskUsedGb = diskBytes != null ? Math.round((diskBytes / (1024 ** 3)) * 100) / 100 : null;

    const ramUsage = ramUsedMb != null && ramTotalMb > 0
      ? Math.min(100, Math.round((ramUsedMb / ramTotalMb) * 1000) / 10)
      : null;
    const diskUsage = diskUsedGb != null && diskTotalGb > 0
      ? Math.min(100, Math.round((diskUsedGb / diskTotalGb) * 1000) / 10)
      : null;

    // Traffic samples are cumulative counters — store bytes, do not invent Mbps
    return {
      source: 'hostinger',
      cpuUsage: cpu != null ? Math.round(cpu * 10) / 10 : null,
      ramUsage,
      ramUsedMb,
      ramTotalMb: ramTotalMb || null,
      diskUsage,
      diskUsedGb,
      diskTotalGb: diskTotalGb || null,
      netUploadMbps: null,
      netDownloadMbps: null,
      networkTxBytes: outBytes != null ? Math.round(outBytes) : null,
      networkRxBytes: inBytes != null ? Math.round(inBytes) : null,
      uptimeSec: uptimeRaw == null
        ? null
        : Math.round(uptimeUnit.startsWith('milli') ? uptimeRaw / 1000 : uptimeRaw),
      collectedAt: new Date(),
    };
  }

  async testConnection() {
    if (!this.config.apiToken) {
      return { ok: false, message: 'Add a Hostinger API token in Infrastructure Settings.' };
    }
    try {
      const servers = await this.listServers();
      return { ok: true, message: `Hostinger OK — ${servers.length} VPS found.` };
    } catch (err) {
      return { ok: false, message: err.message };
    }
  }
}
