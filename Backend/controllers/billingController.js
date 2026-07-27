import Tenant from '../models/Tenant.js';

/**
 * Initiate multi-tenant subscription checkout session
 */
export const createCheckoutSession = async (req, res) => {
  try {
    const { planType } = req.body;
    const tenant = req.tenant;

    if (!tenant) {
      return res.status(404).json({ message: 'Tenant context not resolved.' });
    }

    // Mock payment link generation for deployment flexibility
    const mockSessionId = 'cs_test_' + Math.random().toString(36).substring(2, 15);
    const checkoutUrl = `https://checkout.stripe.com/pay/${mockSessionId}?tenant=${tenant._id}&plan=${planType}`;

    res.json({
      sessionId: mockSessionId,
      url: checkoutUrl,
      message: `Checkout session initialized for ${planType} plan.`
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Handle Stripe inbound webhooks to update subscriptions
 */
export const handleStripeWebhook = async (req, res) => {
  try {
    const event = req.body; // Mock parser support
    
    // Parse simulated checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const tenantId = session.client_reference_id || session.metadata?.tenantId;
      const planName = session.metadata?.plan || 'Premium';

      if (tenantId) {
        const limitsMap = {
          Basic: { maxEmployees: 25, maxLeads: 100, maxWorkflows: 5 },
          Premium: { maxEmployees: 100, maxLeads: 500, maxWorkflows: 15 },
          Enterprise: { maxEmployees: 1000, maxLeads: 10000, maxWorkflows: 50 }
        };

        const targetLimits = limitsMap[planName] || limitsMap.Premium;

        await Tenant.findByIdAndUpdate(tenantId, {
          plan: planName,
          billingStatus: 'Active',
          limits: targetLimits
        });

        console.log(`[SaaS Billing Hub] Upgraded Tenant ID ${tenantId} to plan: ${planName}`);
      }
    }

    res.json({ received: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Save active plugins on tenant
 */
export const updateTenantPlugins = async (req, res) => {
  try {
    const { plugins } = req.body;
    const tenant = req.tenant;

    if (!tenant) {
      return res.status(404).json({ message: 'Tenant context not resolved.' });
    }

    tenant.activePlugins = plugins;
    await tenant.save();

    res.json({
      message: 'App Marketplace plugins updated successfully!',
      activePlugins: tenant.activePlugins
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
