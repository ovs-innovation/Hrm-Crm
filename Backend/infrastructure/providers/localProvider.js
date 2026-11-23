import { BaseMonitoringProvider } from './baseProvider.js';
import { pullAgentMetrics } from '../services/agentPullService.js';

/**
 * Local / agent-based provider.
 * Metrics arrive via:
 *  - POST /api/infrastructure/agent/metrics (push)
 *  - GET pull from server.agentBaseUrl/metrics (this class)
 */
export class LocalMonitoringProvider extends BaseMonitoringProvider {
  get id() {
    return 'local';
  }

  async listServers() {
    return [];
  }

  /**
   * @param {string} providerRef unused for local
   * @param {{ server?: object, tenantId?: string }} opts
   */
  async fetchServerMetrics(providerRef, opts = {}) {
    const server = opts.server;
    const tenantId = opts.tenantId || this.config.tenantId;
    if (!server?.agentBaseUrl || !tenantId) return null;
    return pullAgentMetrics(server, tenantId);
  }

  async testConnection() {
    const url = this.config.agentBaseUrl;
    const token = this.config.apiToken || this.config.agentToken;
    if (!url) {
      return {
        ok: true,
        message: 'Local agent ready. Set agentBaseUrl on a server or push metrics via /agent/metrics.',
      };
    }
    try {
      const base = String(url).replace(/\/$/, '');
      const res = await fetch(`${base}/health`, {
        signal: AbortSignal.timeout(8000),
        headers: token
          ? { Authorization: `Bearer ${token}`, 'X-Agent-Token': token }
          : {},
      });
      if (!res.ok) return { ok: false, message: `Agent health ${res.status}` };
      return { ok: true, message: `Agent reachable at ${base}` };
    } catch (err) {
      return { ok: false, message: err.message };
    }
  }
}
