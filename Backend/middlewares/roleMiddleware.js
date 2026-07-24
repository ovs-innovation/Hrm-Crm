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
  if (allowed.includes(role) || allowed.includes('admin')) {
    return next();
  }
  return res.status(403).json({ message: 'Insufficient permissions' });
};

export const requireStaff = requireRole('admin', 'founder', 'hr', 'manager', 'sales');
