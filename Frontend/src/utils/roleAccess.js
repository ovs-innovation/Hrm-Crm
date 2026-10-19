/** Employee portal role helpers — keep in sync with Sidebar visibility. */

const MANAGE_ROLES = new Set(['hr', 'manager', 'founder', 'owner', 'admin']);

export const canManageTeam = (role) => MANAGE_ROLES.has(String(role || '').toLowerCase().trim());

export const isTeamLeader = (user = {}) => {
  const blob = `${user.role || ''} ${user.designation || ''}`.toLowerCase();
  return /team\s*leader|team\s*lead|teamleader/.test(blob);
};

export const canAssignProjects = (user) => {
  if (!user) return false;
  if (typeof user === 'string') return canManageTeam(user);
  return canManageTeam(user.role) || isTeamLeader(user);
};

export const canAccessEmployeeRoute = (user, path) => {
  const role = typeof user === 'string' ? user : user?.role;
  if (!path) return true;
  if (path.startsWith('/manage/projects')) return canAssignProjects(typeof user === 'string' ? { role } : user);
  if (path.startsWith('/manage')) return canManageTeam(role);
  if (path.startsWith('/executive')) return false;
  return true;
};
