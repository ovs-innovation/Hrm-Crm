import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import Employee from '../models/Employee.js';
import { bindRequestTenant } from './contextMiddleware.js';
import { withoutTenantScope } from '../plugins/tenantScope.plugin.js';

/**
 * Auth middleware — supports both cookie JWT and Bearer token.
 * Binds tenant from token/user into request ALS (overrides hostname default).
 */
const protect = async (req, res, next) => {
  let token;

  if (req.cookies?.jwt) {
    token = req.cookies.jwt;
  }

  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.typ && decoded.typ !== 'access') {
      return res.status(401).json({ message: 'Not authorized, access token required' });
    }

    if (decoded.tenantId) {
      bindRequestTenant(req, decoded.tenantId);
    }

    let user = null;
    let userType = decoded.userType;

    await withoutTenantScope(async () => {
      if (userType === 'Employee') {
        user = await Employee.findById(decoded.userId).select('-password');
        if (user) userType = 'Employee';
      } else {
        user = await Admin.findById(decoded.userId).select('-password');
        if (user) {
          userType = 'Admin';
        } else {
          user = await Employee.findById(decoded.userId).select('-password');
          if (user) userType = 'Employee';
        }
      }
    });

    if (!user) {
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }

    if (typeof decoded.tokenVersion === 'number' && typeof user.tokenVersion === 'number') {
      if (decoded.tokenVersion !== user.tokenVersion) {
        return res.status(401).json({ message: 'Session revoked. Please sign in again.' });
      }
    }

    const userTenantId = user.tenantId?.toString?.() || user.tenantId;
    if (userTenantId) {
      bindRequestTenant(req, userTenantId);
    }

    if (decoded.tenantId && userTenantId && String(decoded.tenantId) !== String(userTenantId)) {
      return res.status(401).json({ message: 'Tenant mismatch' });
    }

    req.user = user;
    req.admin = user;
    req.userType = userType;
    next();
  } catch (error) {
    console.error('[Auth]', error.message);
    res.status(401).json({ message: 'Not authorized, token invalid or expired' });
  }
};

export { protect };
