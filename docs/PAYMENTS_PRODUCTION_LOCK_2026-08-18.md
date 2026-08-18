# GENEVIEVE App™ — Stripe Production Subscription Lock

Date: 18 August 2026
Status: hardening branch only until deployment gate passes

## Source of truth
Stripe is the authoritative source for membership billing state. The browser never decides that a membership is active based only on a redirect message.

After a successful Checkout Session, Genevieve stores only the opaque Checkout Session reference on the device. `/api/membership-status` uses the server-side Stripe secret to retrieve the Checkout Session and Subscription directly from Stripe and reports the current lifecycle state.

Recognised lifecycle states include trialing, active, past_due, unpaid, incomplete, incomplete_expired, paused and canceled. Refund activity is checked against Stripe invoice payments/refunds where available.

## Webhook verification
`/api/stripe-webhook` receives Stripe lifecycle events. It must reject requests without a valid Stripe signature. The signing secret belongs only in the Vercel environment variable `STRIPE_WEBHOOK_SECRET`.

Expected lifecycle events:
- checkout.session.completed
- customer.subscription.created
- customer.subscription.updated
- customer.subscription.deleted
- invoice.paid
- invoice.payment_failed
- charge.refunded

The webhook receives raw request bytes and verifies the Stripe `v1` HMAC-SHA256 signature with a five-minute timestamp tolerance before parsing the event.

## Checkout
Checkout remains Stripe-hosted. Stripe secret keys remain server-side only. Checkout is subscription mode, uses the approved AUD plan amounts, explicitly collects a payment method, applies the planned 30-day trial, and places the Genevieve plan key in Checkout and Subscription metadata.

Approved schedule:
- Standard Monthly — AUD 14.99
- Concession Monthly — AUD 10.49
- Standard Annual — AUD 119.99
- Concession Annual — AUD 83.00

## Customer self-service
The connected Stripe account has an active Customer Portal. Genevieve creates a server-side portal session using the verified Checkout Session customer and provides a `Manage membership with Stripe` control. The return URL is generated from the current deployment rather than relying on an old static deployment URL.

## Safety isolation
Billing must never disable, delay, rewrite or intercept:
- emergency access;
- hazard reporting;
- GPS boundary safeguards;
- local/offline safety state;
- colour-alert calculations;
- emergency contacts.

A Stripe outage must degrade only membership verification/checkout. It must not break safety screens.

## Production activation gate
Before production promotion:
1. Deploy this branch to a controlled Vercel preview.
2. Add `STRIPE_WEBHOOK_SECRET` securely in Vercel; never commit or paste it into client code.
3. Register the production webhook destination with Stripe at `/api/stripe-webhook` and subscribe only to the required lifecycle events.
4. Confirm `STRIPE_SECRET_KEY` is present server-side.
5. Use Stripe test mode or a controlled test subscription to validate: trialing, active, failed payment/past_due, cancel-at-period-end, cancellation and refund reporting.
6. Confirm the safety application remains fully usable when Stripe endpoints intentionally fail.
7. Promote only after CI and preview verification pass.
