import { verifyStripeSignature } from '../server/stripe.js';

const SUPPORTED_EVENTS = new Set([
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.paid',
  'invoice.payment_failed',
  'charge.refunded'
]);

async function readRawBody(req, maxBytes = 1024 * 1024) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > maxBytes) throw new Error('request_too_large');
    chunks.push(buffer);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ received: false });
  }

  const webhookSecret = String(process.env.STRIPE_WEBHOOK_SECRET || '').trim();
  if (!webhookSecret) {
    return res.status(503).json({ received: false, error: 'Webhook verification is not configured.' });
  }

  try {
    const rawBody = await readRawBody(req);
    const signature = req.headers?.['stripe-signature'];
    if (!verifyStripeSignature(rawBody, signature, webhookSecret)) {
      return res.status(400).json({ received: false, error: 'Invalid Stripe signature.' });
    }

    const event = JSON.parse(rawBody.toString('utf8'));
    if (!event?.id || !event?.type) return res.status(400).json({ received: false, error: 'Invalid event.' });

    if (SUPPORTED_EVENTS.has(event.type)) {
      const object = event.data?.object || {};
      console.info('GENEVIEVE verified Stripe lifecycle event', {
        eventId: event.id,
        type: event.type,
        objectId: object.id || null,
        status: object.status || null,
        livemode: Boolean(event.livemode)
      });
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    if (error?.message === 'request_too_large') return res.status(413).json({ received: false, error: 'Webhook request too large.' });
    console.error('Stripe webhook processing failed', error?.message || 'unknown');
    return res.status(400).json({ received: false, error: 'Webhook could not be processed.' });
  }
}

export const config = {
  api: {
    bodyParser: false
  }
};
