# Payments Setup — Do Today

## Product catalogue

Subscription group: **GENEVIEVE Dog Park Membership**  
Entitlement: **premium**

| Product ID | Display name | Target AUD price | Period | Trial |
|---|---|---:|---|---|
| genevieve_dogpark_standard_monthly | Standard Monthly | 14.99 | 1 month | 30 days |
| genevieve_dogpark_concession_monthly | Concession Monthly | 10.49 | 1 month | 30 days |
| genevieve_dogpark_standard_annual | Standard Annual | 119.99 | 1 year | 30 days |
| genevieve_dogpark_concession_annual | Concession Annual | 83.00 | 1 year | 30 days |

## Web / Vercel

1. Create one Stripe recurring product/price for each product above.
2. Create a Payment Link for each recurring price.
3. Verify the product name, AUD currency, recurrence, price, trial configuration, tax behaviour and cancellation/customer-portal route.
4. Enable/review Dynamic payment methods in Stripe. Compatible customers may then see Apple Pay or Google Pay on the hosted Stripe page.
5. Paste each verified link into the matching `stripePaymentLink` field in `config.js`.
6. Deploy to a Vercel preview and complete a Stripe test-mode purchase before switching to live links.
7. Configure secure webhooks and a backend before promising automatic premium activation across devices.

Previously supplied Stripe links are not mapped in this build because two were duplicated and their product/price/recurrence could not be verified from the URL alone. Guessing would risk charging the wrong amount.

## Google Play

1. Create the Android app record and final package/application ID.
2. Create one subscription using the product IDs above, or follow the current Play Console base-plan structure while retaining unambiguous product IDs.
3. Add monthly/annual base plans and 30-day eligible introductory offers as appropriate.
4. Integrate the current supported Google Play Billing Library in the native Android wrapper.
5. Add server-side purchase-token verification and real-time developer notifications.
6. Test with licence testers and a closed testing track.
7. Do not open Stripe web checkout from the Australian Google Play app for the premium digital subscription unless a current policy/program clearly permits the exact implementation.

## Apple

1. Complete Agreements, Tax and Banking in App Store Connect.
2. Create the subscription group **GENEVIEVE Dog Park Membership**.
3. Create the four auto-renewable subscription products with the exact product IDs above.
4. Add the introductory free-trial offer to each product where appropriate. Apple eligibility applies per subscription group.
5. Build StoreKit purchase and restore flows in the native iOS wrapper.
6. Test using Sandbox/TestFlight.
7. Do not show the Stripe web purchase call-to-action inside the Australian iOS app for premium digital functionality unless an applicable Apple entitlement/rule clearly permits it.

## Required pre-purchase wording

“30 days free for eligible new subscribers. Then [PRICE] every [MONTH/YEAR], automatically renewing until cancelled. Cancel before the trial ends to avoid the first charge. Manage or cancel through the same store or payment provider used to subscribe. Deleting the app does not cancel the subscription.”

## Still needed from Tracey

- exact public website/domain;
- public support email;
- verified mapping of all four Stripe links;
- confirmed final business/ABN details for public legal pages;
- decision and privacy process for concession eligibility;
- Google application ID/package name; and
- Apple bundle ID.
