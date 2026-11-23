import api from '../../../services/api';

const base = '/infrastructure';

export const infraApi = {
  dashboard: () => api.get(`${base}/dashboard`).then((r) => r.data),
  settings: () => api.get(`${base}/settings`).then((r) => r.data),
  updateSettings: (body) => api.put(`${base}/settings`, body).then((r) => r.data),
  testProvider: () => api.post(`${base}/settings/test-provider`).then((r) => r.data),
  syncServers: () => api.post(`${base}/settings/sync-servers`).then((r) => r.data),
  metrics: (params) => api.get(`${base}/metrics`, { params }).then((r) => r.data),

  listServers: () => api.get(`${base}/servers`).then((r) => r.data),
  createServer: (body) => api.post(`${base}/servers`, body).then((r) => r.data),
  updateServer: (id, body) => api.put(`${base}/servers/${id}`, body).then((r) => r.data),
  deleteServer: (id) => api.delete(`${base}/servers/${id}`).then((r) => r.data),
  pushMetrics: (id, body) => api.post(`${base}/servers/${id}/metrics`, body).then((r) => r.data),

  listWebsites: () => api.get(`${base}/websites`).then((r) => r.data),
  createWebsite: (body) => api.post(`${base}/websites`, body).then((r) => r.data),
  updateWebsite: (id, body) => api.put(`${base}/websites/${id}`, body).then((r) => r.data),
  deleteWebsite: (id) => api.delete(`${base}/websites/${id}`).then((r) => r.data),
  checkWebsite: (id) => api.post(`${base}/websites/${id}/check`).then((r) => r.data),

  listServices: () => api.get(`${base}/services`).then((r) => r.data),
  createService: (body) => api.post(`${base}/services`, body).then((r) => r.data),
  updateService: (id, body) => api.put(`${base}/services/${id}`, body).then((r) => r.data),
  deleteService: (id) => api.delete(`${base}/services/${id}`).then((r) => r.data),

  listDomains: () => api.get(`${base}/domains`).then((r) => r.data),
  createDomain: (body) => api.post(`${base}/domains`, body).then((r) => r.data),
  updateDomain: (id, body) => api.put(`${base}/domains/${id}`, body).then((r) => r.data),
  deleteDomain: (id) => api.delete(`${base}/domains/${id}`).then((r) => r.data),
  refreshDomains: () => api.post(`${base}/domains/refresh`).then((r) => r.data),
  approveDomainMail: (id) => api.post(`${base}/domains/${id}/approve-client-mail`).then((r) => r.data),

  listSsl: () => api.get(`${base}/ssl`).then((r) => r.data),
  createSsl: (body) => api.post(`${base}/ssl`, body).then((r) => r.data),
  updateSsl: (id, body) => api.put(`${base}/ssl/${id}`, body).then((r) => r.data),
  deleteSsl: (id) => api.delete(`${base}/ssl/${id}`).then((r) => r.data),
  refreshSsl: () => api.post(`${base}/ssl/refresh`).then((r) => r.data),

  listBackups: () => api.get(`${base}/backups`).then((r) => r.data),
  createBackup: (body) => api.post(`${base}/backups`, body).then((r) => r.data),
  updateBackup: (id, body) => api.put(`${base}/backups/${id}`, body).then((r) => r.data),
  deleteBackup: (id) => api.delete(`${base}/backups/${id}`).then((r) => r.data),

  listIncidents: () => api.get(`${base}/incidents`).then((r) => r.data),
  updateIncident: (id, body) => api.patch(`${base}/incidents/${id}`, body).then((r) => r.data),

  listAlerts: (params) => api.get(`${base}/alerts`, { params }).then((r) => r.data),
  resolveAlert: (id, body) => api.patch(`${base}/alerts/${id}/resolve`, body).then((r) => r.data),

  listLogs: (params) => api.get(`${base}/logs`, { params }).then((r) => r.data),
  exportLogsUrl: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return `/api${base}/logs/export${q ? `?${q}` : ''}`;
  },
};
