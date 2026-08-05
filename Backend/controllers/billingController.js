import Tenant from '../models/Tenant.js';

/**
 * Initiate multi-tenant subscription checkout session
 * NOTE: Returns a mock Stripe URL until STRIPE_SECRET_KEY is configured.
 */
export const createCheckoutSession = async (req, res) => {
  try {
    const { planType } = req.body;
    const tenant = req.tenant;

    if (!tenant) {
      return res.status(404).json({ message: 'Tenant context not resolved.' });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(503).json({
        message: 'Billing is not configured. Set STRIPE_SECRET_KEY to enable checkout.',
        configured: false,
      });
    }

    const mockSessionId = 'cs_test_' + Math.random().toString(36).substring(2, 15);
    const checkoutUrl = `https://checkout.stripe.com/pay/${mockSessionId}?tenant=${tenant._id}&plan=${planType}`;

    res.json({
      sessionId: mockSessionId,
      url: checkoutUrl,
      message: `Checkout session initialized for ${planType} plan.`,
      note: 'Stripe SDK integration pending — do not treat this as a live payment session.',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Handle Stripe inbound webhooks to update subscriptions.
 * Rejects unverified payloads — never trust raw body without signature.
 */
export const handleStripeWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return res.status(503).json({ message: 'Webhook not configured (STRIPE_WEBHOOK_SECRET missing).' });
    }

    const signature = req.headers['stripe-signature'];
    if (!signature) {
      return res.status(401).json({ message: 'Missing Stripe-Signature header.' });
    }

    // Without the Stripe SDK, we refuse to mutate tenant plans from client-supplied bodies.
    // Wire stripe.webhooks.constructEvent when STRIPE_SECRET_KEY is provisioned.
    return res.status(501).json({
      message: 'Stripe signature verification is required before plan upgrades. Webhook handler is not live.',
    });
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
