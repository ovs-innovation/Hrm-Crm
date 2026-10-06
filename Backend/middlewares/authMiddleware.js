import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import Admin from '../models/Admin.js';
import Employee from '../models/Employee.js';
import { bindRequestTenant } from './contextMiddleware.js';
import { readAccessToken } from '../utils/generateToken.js';

const SKIP_TENANT = { skipTenantScope: true };

async function findAuthUser(userId, preferredType) {
  if (!userId || !mongoose.isValidObjectId(userId)) {
    return { user: null, userType: null };
  }

  const findAdmin = () => Admin.findById(userId).select('-password').setOptions(SKIP_TENANT);
  const findEmployee = () => Employee.findById(userId).select('-password').setOptions(SKIP_TENANT);

  if (preferredType === 'Employee') {
    const employee = await findEmployee();
    if (employee) return { user: employee, userType: 'Employee' };
    const admin = await findAdmin();
    if (admin) return { user: admin, userType: 'Admin' };
    return { user: null, userType: null };
  }

  const admin = await findAdmin();
  if (admin) return { user: admin, userType: 'Admin' };
  const employee = await findEmployee();
  if (employee) return { user: employee, userType: 'Employee' };
  return { user: null, userType: null };
}

/**
 * Auth middleware — supports cookie JWT (admin + employee) and Bearer token.
 * Binds tenant from token/user into request ALS (overrides hostname default).
 */
const protect = async (req, res, next) => {
  let token = readAccessToken(req);

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

    const userId = decoded.userId || decoded.id || decoded._id;
    if (decoded.tenantId) {
      bindRequestTenant(req, decoded.tenantId);
    }

    const { user, userType } = await findAuthUser(userId, decoded.userType);

    if (!user) {
      return res.status(401).json({
        message: 'Session expired. Please sign in again.',
        code: 'USER_NOT_FOUND',
      });
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
