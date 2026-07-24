/** Admin portal nav visibility by role (case-insensitive). */
export const getNavAccess = (role) => {
  const r = (role || 'admin').toLowerCase();

  const full = { home: true, reports: true, analytics: true, settings: true, sales: true, activities: true, people: true, messenger: true };

  if (['admin', 'founder', 'owner'].includes(r)) return full;

  if (r === 'sales') {
    return { ...full, people: false, settings: false };
  }

  if (r === 'hr') {
    return { home: true, reports: true, analytics: true, settings: false, sales: false, activities: false, people: true, messenger: true };
  }

  if (r === 'manager') {
    return { ...full, settings: false };
  }

  return full;
};

export const canAccessRoute = (role, path) => {
  const access = getNavAccess(role);
  if (path === '/' || path.startsWith('/crm') && !path.includes('tasks')) {
    if (path === '/') return access.home;
    return access.sales;
  }
  if (['/crm/tasks', '/crm/meetings', '/crm/calls'].some((p) => path.startsWith(p))) {
    return access.activities;
  }
  if (path.startsWith('/hrm')) return access.people;
  if (path === '/settings') return access.settings;
  if (path === '/reports' || path.startsWith('/reports')) return access.reports;
  if (path === '/analytics') return access.analytics;
  if (path === '/messenger') return access.messenger;
  return true;
};
