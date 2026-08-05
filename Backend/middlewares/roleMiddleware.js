export const requireAdmin = (req, res, next) => {
  if (req.userType !== 'Admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

export const requireRole = (...roles) => (req, res, next) => {
  if (req.userType === 'Admin') return next();
  const role = (req.user?.role || '').toLowerCase();
  const allowed = roles.map((r) => r.toLowerCase());
  // Only authorize when the user's role is in the allowlist (not when 'admin' is listed)
  if (allowed.includes(role)) {
    return next();
  }
  return res.status(403).json({ message: 'Insufficient permissions' });
};

export const requireStaff = requireRole('founder', 'hr', 'manager', 'sales');
