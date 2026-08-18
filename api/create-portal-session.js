import { originFromRequest, safeStripeId, stripeGet, stripePost } from '../server/stripe.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const sessionId = safeStripeId(body.sessionId, 'cs_');
    if (!sessionId) return res.status(400).json({ ok: false, error: 'Membership reference missing.' });

    const checkout = await stripeGet(`/checkout/sessions/${sessionId}`);
    const customerId = typeof checkout.customer === 'string' ? checkout.customer : checkout.customer?.id;
    if (!customerId || !customerId.startsWith('cus_')) {
      return res.status(409).json({ ok: false, error: 'Stripe has not attached a customer to this membership yet.' });
    }

    const portal = await stripePost('/billing_portal/sessions', {
      customer: customerId,
      return_url: `${originFromRequest(req)}/?membership=return`
    });
    return res.status(200).json({ ok: true, url: portal.url });
  } catch (error) {
    if (error?.message === 'stripe_not_configured') {
      return res.status(503).json({ ok: false, error: 'Secure membership management is not configured on this deployment.' });
    }
    console.error('Stripe portal session failed', error?.type || error?.message || 'unknown');
    return res.status(502).json({ ok: false, error: 'Stripe membership management is temporarily unavailable.' });
  }
}
