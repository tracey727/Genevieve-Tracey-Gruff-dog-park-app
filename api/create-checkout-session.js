import { originFromRequest, stripePost } from '../server/stripe.js';

const INTEGRATION_IDENTIFIER = 'genevieve_app_yqfmgzpv';
const PLANS = Object.freeze({
  standardMonthly: { name: 'GENEVIEVE Dog Park — Standard Monthly', amount: 1499, interval: 'month' },
  concessionMonthly: { name: 'GENEVIEVE Dog Park — Concession Monthly', amount: 1049, interval: 'month' },
  standardAnnual: { name: 'GENEVIEVE Dog Park — Standard Annual', amount: 11999, interval: 'year' },
  concessionAnnual: { name: 'GENEVIEVE Dog Park — Concession Annual', amount: 8300, interval: 'year' }
});

function safeEmail(value) {
  const email = String(value || '').trim().toLowerCase();
  if (!email || email.length > 254) return '';
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';
}

function safeReference(value) {
  const reference = String(value || '').trim();
  if (!reference || reference.length > 120) return '';
  return /^[A-Za-z0-9_-]+$/.test(reference) ? reference : '';
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const planKey = String(body?.planKey || '');
  const plan = PLANS[planKey];
  if (!plan) return res.status(400).json({ error: 'Unknown membership plan.' });

  const origin = originFromRequest(req);
  const values = {
    mode: 'subscription',
    success_url: `${origin}/?payment=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/?payment=cancelled`,
    payment_method_collection: 'always',
    allow_promotion_codes: 'true',
    locale: 'auto',
    integration_identifier: INTEGRATION_IDENTIFIER,
    'line_items[0][price_data][currency]': 'aud',
    'line_items[0][price_data][product_data][name]': plan.name,
    'line_items[0][price_data][product_data][description]': 'GENEVIEVE App™ Dog Park Membership',
    'line_items[0][price_data][recurring][interval]': plan.interval,
    'line_items[0][price_data][unit_amount]': String(plan.amount),
    'line_items[0][quantity]': '1',
    'subscription_data[trial_period_days]': '30',
    'metadata[genevieve_plan]': planKey,
    'subscription_data[metadata][genevieve_plan]': planKey
  };

  const email = safeEmail(body?.email);
  const memberRef = safeReference(body?.memberRef);
  if (email) values.customer_email = email;
  if (memberRef) values.client_reference_id = memberRef;

  try {
    const data = await stripePost('/checkout/sessions', values);
    if (!data?.url) return res.status(502).json({ error: 'Secure checkout could not start. No charge was made.' });
    return res.status(200).json({ url: data.url });
  } catch (error) {
    if (error?.message === 'stripe_not_configured') {
      return res.status(503).json({ error: 'Secure payments are being connected. Please try again shortly.' });
    }
    console.error('Stripe checkout session error', error?.type || error?.message || 'unknown');
    return res.status(502).json({ error: 'Secure checkout could not start. No charge was made.' });
  }
}
