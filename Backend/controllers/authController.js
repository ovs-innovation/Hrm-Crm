import Admin from '../models/Admin.js';
import generateToken, {
  createRefreshSession,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllUserSessions,
  listUserSessions,
  clearAuthCookies,
} from '../utils/generateToken.js';
import { emailFilter, normalizeEmail } from '../utils/normalizeEmail.js';
import { withoutTenantScope } from '../plugins/tenantScope.plugin.js';
import { bindRequestTenant } from '../middlewares/contextMiddleware.js';

export const adminSignup = async (req, res) => {
  try {
    const allowSignup = process.env.ALLOW_ADMIN_SIGNUP === 'true';
    const bootstrapSecret = process.env.ADMIN_BOOTSTRAP_SECRET;
    const providedSecret = req.headers['x-bootstrap-secret'] || req.body?.bootstrapSecret;

    const adminCount = await withoutTenantScope(() => Admin.countDocuments());

    if (process.env.NODE_ENV === 'production' && !allowSignup) {
      return res.status(403).json({ message: 'Admin signup is disabled in production.' });
    }
    if (adminCount > 0 && (!bootstrapSecret || providedSecret !== bootstrapSecret)) {
      return res.status(403).json({ message: 'Admin signup requires a valid bootstrap secret.' });
    }
    if (!allowSignup && adminCount > 0) {
      return res.status(403).json({ message: 'Admin signup is disabled.' });
    }

    const { name, password } = req.body;
    const email = normalizeEmail(req.body.email);

    if (!name || !email || !password || String(password).length < 8) {
      return res.status(400).json({ message: 'Name, email, and password (min 8 chars) are required.' });
    }

    if (!req.tenantId) {
      return res.status(503).json({ message: 'Tenant not resolved.' });
    }

    bindRequestTenant(req, req.tenantId);

    const adminExists = await Admin.findOne(emailFilter(email));
    if (adminExists) {
      return res.status(400).json({ message: 'Admin already exists' });
    }

    const admin = await Admin.create({
      name,
      email,
      password,
      role: 'Admin',
      tenantId: req.tenantId,
    });

    if (admin) {
      await createRefreshSession({
        res,
        req,
        userId: admin._id,
        tenantId: req.tenantId,
        userType: 'Admin',
      });

      res.status(201).json({
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        tenantId: admin.tenantId,
      });
    } else {
      res.status(400).json({ message: 'Invalid admin data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const adminLogin = async (req, res) => {
  try {
    const { password } = req.body;
    const email = normalizeEmail(req.body.email);

    // Login must find user across tenants, then bind their tenant
    const admin = await withoutTenantScope(() => Admin.findOne(emailFilter(email)));

    if (admin && (await admin.matchPassword(password))) {
      // Legacy accounts created before multi-tenant may lack tenantId
      if (!admin.tenantId) {
        const Tenant = (await import('../models/Tenant.js')).default;
        const fallback =
          (await Tenant.findOne({ subdomain: 'default' })) ||
          (await Tenant.findOne({ subdomain: 'novatech-demo' })) ||
          req.tenant;
        if (fallback?._id) {
          admin.tenantId = fallback._id;
          await withoutTenantScope(() => admin.save());
        }
      }

      const tenantId = admin.tenantId || req.tenantId;
      if (!tenantId) {
        return res.status(503).json({
          message: 'Account has no workspace tenant. Run demo seed or contact support.',
        });
      }

      bindRequestTenant(req, tenantId);
      await createRefreshSession({
        res,
        req,
        userId: admin._id,
        tenantId,
        userType: 'Admin',
      });

      res.json({
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        tenantId: admin.tenantId,
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const adminLogout = async (req, res) => {
  try {
    const raw = req.cookies?.refreshToken;
    await revokeRefreshToken(raw);
    clearAuthCookies(res);
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const refreshAccessToken = async (req, res) => {
  try {
    const raw = req.cookies?.refreshToken || req.body?.refreshToken;
    const rotated = await rotateRefreshToken({ rawRefreshToken: raw, req, res });
    res.json({
      message: 'Token refreshed',
      userId: rotated.userId,
      tenantId: rotated.tenantId,
      userType: rotated.userType,
      deviceId: rotated.deviceId,
    });
  } catch (error) {
    clearAuthCookies(res);
    res.status(error.status || 401).json({ message: error.message });
  }
};

export const logoutAllDevices = async (req, res) => {
  try {
    await revokeAllUserSessions(req.user._id);
    // Bump tokenVersion to invalidate outstanding access JWTs
    req.user.tokenVersion = (req.user.tokenVersion || 0) + 1;
    await req.user.save();
    clearAuthCookies(res);
    res.json({ message: 'Logged out from all devices' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const listSessions = async (req, res) => {
  try {
    const sessions = await listUserSessions(req.user._id);
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// keep default export path compatible
export { generateToken };
