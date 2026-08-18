import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { safeStripeId, verifyStripeSignature } from '../server/stripe.js';

const root=process.cwd();
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');
const webhook=read('api/stripe-webhook.js');
const statusApi=read('api/membership-status.js');
const portalApi=read('api/create-portal-session.js');
const checkout=read('api/create-checkout-session.js');
const paymentLayer=read('src/payment-layer.js');
const stripeCore=read('server/stripe.js');

test('Stripe webhook signatures are accepted only when current and valid',()=>{
  const secret='whsec_test_only_not_a_real_secret';
  const timestamp=1_800_000_000;
  const body=Buffer.from(JSON.stringify({id:'evt_test',type:'customer.subscription.updated'}));
  const signature=crypto.createHmac('sha256',secret).update(`${timestamp}.`).update(body).digest('hex');
  const header=`t=${timestamp},v1=${signature}`;
  assert.equal(verifyStripeSignature(body,header,secret,timestamp),true);
  assert.equal(verifyStripeSignature(body,header,secret,timestamp+301),false);
  assert.equal(verifyStripeSignature(Buffer.from('tampered'),header,secret,timestamp),false);
});

test('Stripe checkout session IDs are bounded before server retrieval',()=>{
  assert.equal(safeStripeId('cs_live_ABC123','cs_'),'cs_live_ABC123');
  assert.equal(safeStripeId('sub_ABC123','cs_'),'');
  assert.equal(safeStripeId('cs_live_bad-value','cs_'),'');
});

test('subscription lifecycle receiver covers required entitlement events',()=>{
  for(const event of [
    'checkout.session.completed',
    'customer.subscription.created',
    'customer.subscription.updated',
    'customer.subscription.deleted',
    'invoice.paid',
    'invoice.payment_failed',
    'charge.refunded'
  ]) assert.match(webhook,new RegExp(event.replaceAll('.','\\.')));
  assert.match(webhook,/STRIPE_WEBHOOK_SECRET/);
  assert.match(webhook,/bodyParser:\s*false/);
  assert.match(webhook,/stripe-signature/);
});

test('membership is verified server-side with Stripe and refund lookup',()=>{
  assert.match(statusApi,/membershipFromCheckoutSession/);
  assert.match(stripeCore,/\/subscriptions\//);
  assert.match(stripeCore,/\/invoice_payments/);
  assert.match(stripeCore,/\/refunds/);
  assert.match(stripeCore,/status === 'active' \|\| status === 'trialing'/);
});

test('customer portal exposes explicit update-payment and cancellation actions',()=>{
  assert.match(portalApi,/\/billing_portal\/sessions/);
  assert.match(paymentLayer,/genevieve:stripe:checkout_session/);
  assert.match(paymentLayer,/\/api\/membership-status/);
  assert.match(paymentLayer,/\/api\/create-portal-session/);
  assert.match(paymentLayer,/Update Payment Method/);
  assert.match(paymentLayer,/Cancel Subscription/);
  assert.match(paymentLayer,/billing\.stripe\.com\/p\/login/);
});

test('trial checkout explicitly collects a payment method and pins the Stripe API version',()=>{
  assert.match(checkout,/payment_method_collection/);
  assert.match(checkout,/subscription_data\[trial_period_days\]/);
  assert.match(checkout,/integration_identifier/);
  assert.match(stripeCore,/2026-06-24\.dahlia/);
  assert.match(stripeCore,/Stripe-Version/);
  assert.match(stripeCore,/STRIPE_SECRET_KEY/);
  assert.doesNotMatch(paymentLayer,/sk_(?:live|test)_/);
});
