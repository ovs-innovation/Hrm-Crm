/** Only Admin portal users with Admin / Founder / Owner roles. */
export const requireInfraAdmin = (req, res, next) => {
  if (req.userType !== 'Admin') {
    return res.status(403).json({ message: 'Infrastructure access requires admin portal login.' });
  }
  const role = String(req.user?.role || 'admin').toLowerCase().trim();
  if (['admin', 'founder', 'owner'].includes(role)) return next();
  return res.status(403).json({ message: 'Only Super Admin / Admin can access Infrastructure.' });
};
