const express = require('express');
const { body, validationResult } = require('express-validator');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Site = require('../models/Site');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/stripe/create-customer
// @desc    Create Stripe customer for site
// @access  Private (Admin only)
router.post('/create-customer', auth, authorize('admin'), [
  body('siteId').isMongoId().withMessage('Valid site ID is required'),
  body('email').isEmail().withMessage('Valid email is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

// New: handle subscription.created for Pricing Table flow
async function handleSubscriptionCreated(subscription) {
  try {
    const customerId = subscription.customer;
    // Retrieve customer to get email for mapping
    const customer = await stripe.customers.retrieve(customerId);
    const customerEmail = customer?.email?.toLowerCase();

    if (!customerEmail) return;

    // Find admin user by email
    const User = require('../models/User');
    const adminUser = await User.findOne({ email: customerEmail, role: 'admin' });
    if (!adminUser) return;

    // Find site owned by this admin
    const site = await Site.findOne({ admin: adminUser._id });
    if (!site) return;

    // Update subscription fields on Site
    site.subscription.stripeCustomerId = customerId;
    site.subscription.stripeSubscriptionId = subscription.id;
    site.subscription.status = subscription.status || 'active';
    site.subscription.currentPeriodStart = new Date(subscription.current_period_start * 1000);
    site.subscription.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
    site.subscription.plan = site.subscription.plan || 'basic';
    await site.save();
  } catch (err) {
    console.error('handleSubscriptionCreated error:', err);
  }
}

    const { siteId, email } = req.body;

    const site = await Site.findById(siteId);
    if (!site) {
      return res.status(404).json({ message: 'Site not found' });
    }

    // Create Stripe customer
    const customer = await stripe.customers.create({
      email,
      name: site.name,
      metadata: {
        siteId: siteId,
        adminId: req.user._id.toString()
      }
    });

    // Update site with Stripe customer ID
    site.subscription.stripeCustomerId = customer.id;
    await site.save();

    res.json({
      message: 'Stripe customer created successfully',
      customerId: customer.id
    });
  } catch (error) {
    console.error('Create Stripe customer error:', error);
    res.status(500).json({ message: 'Server error during customer creation' });
  }
});

// @route   POST /api/stripe/create-subscription
// @desc    Create subscription for site
// @access  Private (Admin only)
router.post('/create-subscription', auth, authorize('admin'), [
  body('siteId').isMongoId().withMessage('Valid site ID is required'),
  body('priceId').notEmpty().withMessage('Price ID is required'),
  body('paymentMethodId').notEmpty().withMessage('Payment method ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { siteId, priceId, paymentMethodId } = req.body;

    const site = await Site.findById(siteId);
    if (!site) {
      return res.status(404).json({ message: 'Site not found' });
    }

    if (!site.subscription.stripeCustomerId) {
      return res.status(400).json({ message: 'Stripe customer not found' });
    }

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: site.subscription.stripeCustomerId,
    });

    // Set as default payment method
    await stripe.customers.update(site.subscription.stripeCustomerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: site.subscription.stripeCustomerId,
      items: [{ price: priceId }],
      default_payment_method: paymentMethodId,
      expand: ['latest_invoice.payment_intent'],
    });

    // Update site with subscription details
    site.subscription.stripeSubscriptionId = subscription.id;
    site.subscription.status = subscription.status;
    site.subscription.currentPeriodStart = new Date(subscription.current_period_start * 1000);
    site.subscription.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
    site.subscription.plan = req.body.plan || 'basic';
    await site.save();

    res.json({
      message: 'Subscription created successfully',
      subscription: {
        id: subscription.id,
        status: subscription.status,
        currentPeriodStart: site.subscription.currentPeriodStart,
        currentPeriodEnd: site.subscription.currentPeriodEnd
      }
    });
  } catch (error) {
    console.error('Create subscription error:', error);
    res.status(500).json({ message: 'Server error during subscription creation' });
  }
});

// @route   GET /api/stripe/subscription/:siteId
// @desc    Get subscription details for site
// @access  Private (Admin only)
router.get('/subscription/:siteId', auth, authorize('admin'), async (req, res) => {
  try {
    const { siteId } = req.params;

    const site = await Site.findById(siteId);
    if (!site) {
      return res.status(404).json({ message: 'Site not found' });
    }

    if (!site.subscription.stripeSubscriptionId) {
      return res.status(404).json({ message: 'No subscription found' });
    }

    // Get subscription details from Stripe
    const subscription = await stripe.subscriptions.retrieve(
      site.subscription.stripeSubscriptionId
    );

    res.json({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        plan: site.subscription.plan
      }
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/stripe/cancel-subscription
// @desc    Cancel subscription
// @access  Private (Admin only)
router.post('/cancel-subscription', auth, authorize('admin'), [
  body('siteId').isMongoId().withMessage('Valid site ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { siteId } = req.body;

    const site = await Site.findById(siteId);
    if (!site) {
      return res.status(404).json({ message: 'Site not found' });
    }

    if (!site.subscription.stripeSubscriptionId) {
      return res.status(404).json({ message: 'No subscription found' });
    }

    // Cancel subscription at period end
    const subscription = await stripe.subscriptions.update(
      site.subscription.stripeSubscriptionId,
      {
        cancel_at_period_end: true,
      }
    );

    res.json({
      message: 'Subscription will be cancelled at period end',
      subscription: {
        id: subscription.id,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end
      }
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ message: 'Server error during cancellation' });
  }
});

// @route   POST /api/stripe/webhook
// @desc    Handle Stripe webhooks
// @access  Public
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created': {
        const createdSubscription = event.data.object;
        await handleSubscriptionCreated(createdSubscription);
        break;
      }
      case 'customer.subscription.updated':
        const subscription = event.data.object;
        await handleSubscriptionUpdate(subscription);
        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object;
        await handleSubscriptionDeleted(deletedSubscription);
        break;

      case 'invoice.payment_failed':
        const invoice = event.data.object;
        await handlePaymentFailed(invoice);
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

// Helper functions for webhook handling
async function handleSubscriptionUpdate(subscription) {
  const site = await Site.findOne({
    'subscription.stripeSubscriptionId': subscription.id
  });

  if (site) {
    site.subscription.status = subscription.status;
    site.subscription.currentPeriodStart = new Date(subscription.current_period_start * 1000);
    site.subscription.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
    await site.save();
  }
}

async function handleSubscriptionDeleted(subscription) {
  const site = await Site.findOne({
    'subscription.stripeSubscriptionId': subscription.id
  });

  if (site) {
    site.subscription.status = 'cancelled';
    await site.save();
  }
}

async function handlePaymentFailed(invoice) {
  const site = await Site.findOne({
    'subscription.stripeCustomerId': invoice.customer
  });

  if (site) {
    site.subscription.status = 'past_due';
    await site.save();
  }
}

module.exports = router;

