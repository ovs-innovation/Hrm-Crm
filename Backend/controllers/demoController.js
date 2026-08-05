import { ensureNovaTechDemo, DEMO_META } from '../services/demoWorkspace.service.js';

/**
 * GET  /api/demo/workspace — status + login hint (no secrets beyond demo password for FCX)
 * POST /api/demo/workspace/ensure — create/refresh NovaTech demo (force=true reseeds)
 * POST /api/demo/workspace/login — ensure + return credentials for one-click explore
 */
export const getDemoWorkspaceStatus = async (req, res) => {
  try {
    const result = await ensureNovaTechDemo({ force: false });
    res.json({
      ready: true,
      companyName: DEMO_META.companyName,
      industry: DEMO_META.industry,
      hq: DEMO_META.hq,
      branches: DEMO_META.branches,
      stats: result.stats,
      loginEmail: DEMO_META.adminEmail,
      created: result.created,
      durationMs: result.durationMs,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const ensureDemoWorkspace = async (req, res) => {
  try {
    const force = req.body?.force === true || req.query?.force === 'true';
    const result = await ensureNovaTechDemo({ force });
    res.json({
      message: result.created
        ? 'NovaTech demo workspace seeded.'
        : 'NovaTech demo workspace already ready.',
      ...result,
    });
  } catch (error) {
    console.error('[DemoWorkspace]', error);
    res.status(500).json({ message: error.message });
  }
};

export const exploreDemoWorkspace = async (req, res) => {
  try {
    const result = await ensureNovaTechDemo({ force: false });
    // Auto-login via existing auth cookie flow
    const { createRefreshSession } = await import('../utils/generateToken.js');
    const { bindRequestTenant } = await import('../middlewares/contextMiddleware.js');
    const Admin = (await import('../models/Admin.js')).default;
    const { withoutTenantScope } = await import('../plugins/tenantScope.plugin.js');

    const admin = await withoutTenantScope(() =>
      Admin.findOne({ email: DEMO_META.adminEmail, tenantId: result.tenantId })
    );
    if (!admin) {
      return res.status(500).json({ message: 'Demo admin missing after seed.' });
    }

    bindRequestTenant(req, result.tenantId);
    await createRefreshSession({
      res,
      req,
      userId: admin._id,
      tenantId: result.tenantId,
      userType: 'Admin',
      deviceLabel: 'Demo Explore',
    });

    res.json({
      message: 'Welcome to NovaTech Solutions demo workspace.',
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      tenantId: result.tenantId,
      companyName: DEMO_META.companyName,
      demo: true,
      stats: result.stats,
    });
  } catch (error) {
    console.error('[DemoExplore]', error);
    res.status(500).json({ message: error.message });
  }
};
