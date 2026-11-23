/**
 * Pluggable cloud / VPS provider contract.
 * Implementations: local (agent), hostinger, aws, … — business code never imports vendor SDKs directly.
 */
export class BaseMonitoringProvider {
  constructor(config = {}) {
    this.config = config;
  }

  get id() {
    return 'base';
  }

  /** @returns {Promise<object[]>} normalized server summaries from provider API */
  async listServers() {
    return [];
  }

  /** Pull latest metrics for a provider server ref if API supports it */
  async fetchServerMetrics(_providerRef) {
    return null;
  }

  async testConnection() {
    return { ok: false, message: 'Provider not implemented' };
  }
}
