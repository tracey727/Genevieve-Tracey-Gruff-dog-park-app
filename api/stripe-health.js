export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false });
  }
  return res.status(200).json({
    ok: true,
    checkoutConfigured: Boolean(String(process.env.STRIPE_SECRET_KEY || '').trim()),
    webhookConfigured: Boolean(String(process.env.STRIPE_WEBHOOK_SECRET || '').trim())
  });
}
