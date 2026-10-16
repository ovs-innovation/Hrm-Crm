/** Employee portal role helpers — keep in sync with Sidebar visibility. */

const MANAGE_ROLES = new Set(['hr', 'manager', 'founder', 'owner', 'admin']);

export const canManageTeam = (role) => MANAGE_ROLES.has(String(role || '').toLowerCase().trim());

export const canAccessEmployeeRoute = (role, path) => {
  if (!path) return true;
  if (path.startsWith('/manage')) return canManageTeam(role);
  // Executive tools live in the Admin portal — block by URL in employee app.
  if (path.startsWith('/executive')) return false;
  return true;
};
