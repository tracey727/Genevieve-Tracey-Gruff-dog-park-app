const EXPECTED_ACCOUNT = 'acct_1TmX3HL2fxXXcEAf';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false });
  }

  const stripeKey = String(process.env.STRIPE_SECRET_KEY || '').trim();
  const webhookSecret = String(process.env.STRIPE_WEBHOOK_SECRET || '').trim();
  let accountMatches = false;

  if (stripeKey) {
    try {
      const response = await fetch('https://api.stripe.com/v1/account', {
        headers: { Authorization: `Bearer ${stripeKey}` }
      });
      const data = await response.json().catch(() => ({}));
      accountMatches = Boolean(response.ok && data?.id === EXPECTED_ACCOUNT);
    } catch {
      accountMatches = false;
    }
  }

  return res.status(200).json({
    ok: true,
    checkoutConfigured: Boolean(stripeKey),
    webhookConfigured: Boolean(webhookSecret),
    accountMatches
  });
}
