import crypto from 'node:crypto';

const STRIPE_API = 'https://api.stripe.com/v1';
const STRIPE_VERSION = '2026-06-24.dahlia';

export function stripeSecret() {
  const value = String(process.env.STRIPE_SECRET_KEY || '').trim();
  if (!value) throw new Error('stripe_not_configured');
  return value;
}

export function safeStripeId(value, prefix) {
  const id = String(value || '').trim();
  if (!id || id.length > 128 || !id.startsWith(prefix)) return '';
  return /^[A-Za-z0-9_]+$/.test(id) ? id : '';
}

export function originFromRequest(req) {
  const proto = String(req.headers?.['x-forwarded-proto'] || 'https').split(',')[0].trim();
  const host = String(req.headers?.['x-forwarded-host'] || req.headers?.host || '').split(',')[0].trim();
  if (!host) return 'https://genevieve-tracey-gruff-dog-park-app-opal.vercel.app';
  return `${proto}://${host}`;
}

export function verifyStripeSignature(rawBody, signatureHeader, secret, nowSeconds = Math.floor(Date.now() / 1000), toleranceSeconds = 300) {
  const header = String(signatureHeader || '');
  const signingSecret = String(secret || '');
  if (!header || !signingSecret) return false;

  let timestamp = null;
  const signatures = [];
  for (const part of header.split(',')) {
    const [key, ...rest] = part.trim().split('=');
    const value = rest.join('=');
    if (key === 't') timestamp = Number(value);
    if (key === 'v1' && value) signatures.push(value);
  }
  if (!Number.isFinite(timestamp) || !signatures.length) return false;
  if (Math.abs(nowSeconds - timestamp) > toleranceSeconds) return false;

  const body = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(String(rawBody || ''), 'utf8');
  const expected = crypto.createHmac('sha256', signingSecret).update(`${timestamp}.`).update(body).digest('hex');
  const expectedBuffer = Buffer.from(expected, 'utf8');
  return signatures.some((candidate) => {
    const candidateBuffer = Buffer.from(String(candidate), 'utf8');
    return candidateBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(candidateBuffer, expectedBuffer);
  });
}

async function stripeFetch(path, options = {}) {
  const response = await fetch(`${STRIPE_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${stripeSecret()}`,
      'Stripe-Version': STRIPE_VERSION,
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data?.error?.message || 'stripe_request_failed');
    error.status = response.status;
    error.type = data?.error?.type || 'stripe_error';
    throw error;
  }
  return data;
}

export async function stripeGet(path, params = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) value.forEach((item) => query.append(key, String(item)));
    else if (value !== undefined && value !== null && value !== '') query.set(key, String(value));
  }
  return stripeFetch(`${path}${query.size ? `?${query}` : ''}`);
}

export async function stripePost(path, values = {}) {
  const form = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (Array.isArray(value)) value.forEach((item) => form.append(key, String(item)));
    else if (value !== undefined && value !== null) form.set(key, String(value));
  }
  return stripeFetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form
  });
}

function objectId(value) {
  if (typeof value === 'string') return value;
  return typeof value?.id === 'string' ? value.id : '';
}

function paymentIntentId(invoicePayment) {
  const payment = invoicePayment?.payment;
  const candidates = [
    invoicePayment?.payment_intent,
    payment?.payment_intent,
    payment?.payment_intent?.id,
    payment?.id
  ];
  for (const candidate of candidates) {
    const id = objectId(candidate);
    if (id.startsWith('pi_')) return id;
  }
  return '';
}

export async function membershipFromCheckoutSession(sessionId) {
  const safeSession = safeStripeId(sessionId, 'cs_');
  if (!safeSession) throw new Error('invalid_checkout_session');

  const session = await stripeGet(`/checkout/sessions/${safeSession}`, {
    'expand[]': ['subscription', 'customer']
  });
  if (session.mode !== 'subscription') throw new Error('not_subscription_checkout');

  let subscription = session.subscription;
  const subscriptionId = objectId(subscription);
  if (!subscriptionId) {
    return {
      configured: true,
      checkoutComplete: session.status === 'complete',
      status: 'pending',
      entitled: false,
      attention: true,
      planKey: session.metadata?.genevieve_plan || '',
      refund: null
    };
  }
  if (typeof subscription === 'string') {
    subscription = await stripeGet(`/subscriptions/${subscriptionId}`);
  }

  const latestInvoiceId = objectId(subscription.latest_invoice);
  let latestInvoiceStatus = '';
  let refund = null;
  if (latestInvoiceId) {
    try {
      const invoice = await stripeGet(`/invoices/${latestInvoiceId}`);
      latestInvoiceStatus = String(invoice.status || '');
      const payments = await stripeGet('/invoice_payments', {
        invoice: latestInvoiceId,
        limit: 10,
        'expand[]': ['data.payment']
      });
      const pi = (payments.data || []).map(paymentIntentId).find(Boolean);
      if (pi) {
        const refunds = await stripeGet('/refunds', { payment_intent: pi, limit: 10 });
        if (refunds.data?.length) {
          const successful = refunds.data.filter((item) => item.status === 'succeeded');
          const amount = successful.reduce((sum, item) => sum + Number(item.amount || 0), 0);
          refund = {
            status: successful.length ? 'refunded' : String(refunds.data[0]?.status || 'pending'),
            amountAud: Math.round(amount) / 100,
            count: refunds.data.length
          };
        }
      }
    } catch (error) {
      console.warn('Stripe invoice/refund status lookup incomplete', error?.type || error?.message || 'unknown');
    }
  }

  const status = String(subscription.status || 'unknown');
  const entitled = status === 'active' || status === 'trialing';
  const attention = ['past_due', 'unpaid', 'incomplete', 'incomplete_expired', 'paused'].includes(status);

  return {
    configured: true,
    checkoutComplete: session.status === 'complete',
    status,
    entitled,
    attention,
    planKey: subscription.metadata?.genevieve_plan || session.metadata?.genevieve_plan || '',
    cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
    currentPeriodEnd: subscription.current_period_end || null,
    trialEnd: subscription.trial_end || null,
    latestInvoiceStatus,
    refund
  };
}
