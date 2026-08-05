import Tenant from '../models/Tenant.js';
import crypto from 'crypto';

/**
 * Tenant resolution middleware
 * Client-supplied x-tenant-id is ignored unless ALLOW_TENANT_HEADER=true (dev only).
 * Prevents cross-tenant AI memory/KB spoofing via header injection.
 */
export const resolveTenant = async (req, res, next) => {
  try {
    let tenantId = null;
    let tenant = null;

    // Opt-in header resolution only (never trust by default in production)
    if (process.env.ALLOW_TENANT_HEADER === 'true') {
      tenantId = req.headers['x-tenant-id'] || req.query.tenantId || null;
    }

    // Resolve by subdomain when present (e.g. acme.vastora.com)
    if (!tenantId) {
      const hostname = req.hostname || 'localhost';
      const parts = hostname.split('.');
      if (parts.length > 2 && parts[0] !== 'www') {
        const subdomain = parts[0].toLowerCase();
        tenant = await Tenant.findOne({ subdomain });
        if (tenant) tenantId = tenant._id;
      }
    }

    if (tenantId && !tenant) {
      tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        return res.status(400).json({ message: 'Unknown tenant.' });
      }
    }

    // Single-tenant fallback: use existing default tenant (create only outside production)
    if (!tenant) {
      tenant = await Tenant.findOne({ subdomain: 'default' });
      if (!tenant) {
        if (process.env.NODE_ENV === 'production') {
          return res.status(503).json({ message: 'Tenant not provisioned. Contact operations.' });
        }
        tenant = new Tenant({
          companyName: 'Default Trial Tenant',
          subdomain: 'default',
          apiKey: crypto.randomBytes(24).toString('hex'),
          plan: 'Free',
          isActive: true,
          limits: { maxEmployees: 25, maxLeads: 100, maxWorkflows: 5 },
          billingStatus: 'Trialing'
        });
        await tenant.save();
      }
      tenantId = tenant._id;
    }

    if (tenant && tenant.isActive === false) {
      return res.status(403).json({ message: 'Tenant subscription has been suspended. Please contact operations.' });
    }

    req.tenantId = tenantId;
    req.tenant = tenant;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Tenant resolution error: ' + error.message });
  }
};

/**
 * Middleware to enforce subscription limits (tenant-scoped counts).
 */
export const enforceLimit = (resourceType) => {
  return async (req, res, next) => {
    try {
      const tenant = req.tenant;
      if (!tenant) return next();

      const mongoose = (await import('mongoose')).default;
      let currentCount = 0;

      if (resourceType === 'employees') {
        const Employee = mongoose.model('Employee');
        currentCount = await Employee.countDocuments({ tenantId: tenant._id });
        if (currentCount >= tenant.limits.maxEmployees) {
          return res.status(403).json({ message: `SaaS Limit Reached: Your current plan allows up to ${tenant.limits.maxEmployees} employees. Please upgrade your plan.` });
        }
      } else if (resourceType === 'leads') {
        const Client = mongoose.model('Client');
        currentCount = await Client.countDocuments({ tenantId: tenant._id, status: 'Lead' });
        if (currentCount >= tenant.limits.maxLeads) {
          return res.status(403).json({ message: `SaaS Limit Reached: Your current plan allows up to ${tenant.limits.maxLeads} leads. Please upgrade your plan.` });
        }
      } else if (resourceType === 'workflows') {
        const Workflow = mongoose.model('Workflow');
        currentCount = await Workflow.countDocuments({ tenantId: tenant._id });
        if (currentCount >= tenant.limits.maxWorkflows) {
          return res.status(403).json({ message: `SaaS Limit Reached: Your current plan allows up to ${tenant.limits.maxWorkflows} active workflows. Please upgrade your plan.` });
        }
      }

      next();
    } catch (err) {
      res.status(500).json({ message: 'Limit enforcement check failed: ' + err.message });
    }
  };
};
