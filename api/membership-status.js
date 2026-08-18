import { membershipFromCheckoutSession } from '../server/stripe.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const membership = await membershipFromCheckoutSession(body.sessionId);
    return res.status(200).json({ ok: true, membership });
  } catch (error) {
    if (error?.message === 'stripe_not_configured') {
      return res.status(503).json({ ok: false, error: 'Secure membership verification is not configured on this deployment.' });
    }
    if (['invalid_checkout_session', 'not_subscription_checkout'].includes(error?.message)) {
      return res.status(400).json({ ok: false, error: 'The saved membership reference is not valid.' });
    }
    console.error('Membership status verification failed', error?.type || error?.message || 'unknown');
    return res.status(502).json({ ok: false, error: 'Membership status could not be verified with Stripe right now.' });
  }
}
