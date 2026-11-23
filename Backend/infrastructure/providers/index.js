import { LocalMonitoringProvider } from './localProvider.js';
import { HostingerMonitoringProvider } from './hostingerProvider.js';
import { BaseMonitoringProvider } from './baseProvider.js';

const REGISTRY = {
  local: LocalMonitoringProvider,
  hostinger: HostingerMonitoringProvider,
  // Future: aws, azure, digitalocean, hetzner, contabo — same BaseMonitoringProvider contract
};

export const getMonitoringProvider = (providerId, config = {}) => {
  const Cls = REGISTRY[providerId] || LocalMonitoringProvider;
  return new Cls(config);
};

export { BaseMonitoringProvider, LocalMonitoringProvider, HostingerMonitoringProvider };
