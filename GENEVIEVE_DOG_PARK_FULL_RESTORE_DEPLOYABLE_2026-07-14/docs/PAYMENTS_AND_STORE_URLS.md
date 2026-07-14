# Payment and Store URL Handoff

## Public URLs to enter after choosing the domain

- Website / marketing URL: `https://YOURDOMAIN.COM/`
- Support URL: `https://YOURDOMAIN.COM/legal/support.html`
- Privacy URL: `https://YOURDOMAIN.COM/legal/privacy-policy.html`
- Account deletion URL: `https://YOURDOMAIN.COM/legal/account-deletion.html`
- Terms URL: `https://YOURDOMAIN.COM/legal/terms-of-use.html`
- Refund/cancellation URL: `https://YOURDOMAIN.COM/legal/refund-cancellation-policy.html`

## Product catalogue

| Product ID | Display name | AUD target | Period | Trial |
|---|---|---:|---|---|
| genevieve_dogpark_standard_monthly | Standard Monthly | A$14.99 | month | 30 days |
| genevieve_dogpark_concession_monthly | Concession Monthly | A$10.49 | month | 30 days |
| genevieve_dogpark_standard_annual | Standard Annual | A$119.99 | year | 30 days |
| genevieve_dogpark_concession_annual | Concession Annual | A$83.00 | year | 30 days |

## Web

Web checkout uses only the exact verified Stripe Payment Link mapped to each product in `config.js`. The buttons remain disabled while links are blank.

## Apple

The iOS app must use Apple’s native purchase system for premium digital app functionality unless a current rule or entitlement expressly permits another route for the exact implementation. Create the subscription group, products, trial offers, purchase/restore flow, agreements, banking and tax records in App Store Connect.

## Google Play

The Android app must use Google Play Billing for premium digital app functionality unless a current policy/program expressly permits another route. Create the subscription/base plans/offers, licence testers, closed test and server-side purchase verification.

## Required disclosure

“30 days free for eligible new subscribers. Then [PRICE] every [MONTH/YEAR], automatically renewing until cancelled. Cancel before the trial ends to avoid the first charge. Manage or cancel through the same store or payment provider used to subscribe. Deleting the app does not cancel the subscription.”
