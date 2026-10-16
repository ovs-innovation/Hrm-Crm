/** Admin portal nav visibility by role. Unknown roles fail closed. */

const emptyAccess = {
  dashboard: true,
  crm: false,
  hrms: false,
  work: false,
  workspace: true,
  support: false,
  ai: false,
  reports: false,
  administration: false,
};

export const getNavAccess = (role) => {
  const r = String(role || '').toLowerCase().trim();

  const full = {
    dashboard: true,
    crm: true,
    hrms: true,
    work: true,
    workspace: true,
    support: true,
    ai: true,
    reports: true,
    administration: true,
  };

  if (!r) return emptyAccess;

  if (['admin', 'founder', 'owner'].includes(r)) return full;

  if (r === 'sales') {
    return { ...full, hrms: false, support: false, administration: false };
  }

  if (r === 'hr') {
    return { ...full, crm: false, administration: false };
  }

  if (r === 'manager') {
    return { ...full, administration: false };
  }

  // Unknown role — do not grant full portal
  return emptyAccess;
};

export const canAccessRoute = (role, path) => {
  const access = getNavAccess(role);
  if (path === '/' || path === '') return access.dashboard;
  if (path.startsWith('/crm')) return access.crm;
  if (path.startsWith('/hrm')) return access.hrms;
  if (path.startsWith('/work') || path === '/projects') return access.work;
  if (path.startsWith('/workspace') || path.startsWith('/messenger')) return access.workspace;
  if (path.startsWith('/support')) return access.support;
  if (path.startsWith('/ai') || path.startsWith('/ai-hub')) return access.ai;
  if (path.startsWith('/reports') || path.startsWith('/analytics')) return access.reports;
  if (path.startsWith('/settings') || path.startsWith('/setup-wizard')) return access.administration;
  // Fail closed for unmapped paths
  return false;
};
