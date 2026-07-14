# GENEVIEVE App™ Dog Park — Site Setup to Complete Today

This file tells Tracey exactly what must be decided or created outside the app package before the site and store records can be finalised.

## 1. Choose one public domain

Use one domain consistently for:

- the main website;
- Google Play developer and app records;
- Apple App Store support and privacy URLs;
- Stripe domain registration;
- support, privacy, terms, refund and deletion pages.

Recommended structure after deployment:

- Main website: `https://YOURDOMAIN.COM/`
- App: `https://YOURDOMAIN.COM/` or `https://app.YOURDOMAIN.COM/`
- Privacy: `https://YOURDOMAIN.COM/legal/privacy-policy.html`
- Terms: `https://YOURDOMAIN.COM/legal/terms-of-use.html`
- Safety: `https://YOURDOMAIN.COM/legal/safety-disclaimer.html`
- Subscription terms: `https://YOURDOMAIN.COM/legal/subscription-terms.html`
- Refund/cancellation: `https://YOURDOMAIN.COM/legal/refund-cancellation-policy.html`
- Account deletion: `https://YOURDOMAIN.COM/legal/account-deletion.html`
- Support: `https://YOURDOMAIN.COM/legal/support.html`

Use the explicit `.html` URLs above because they work on both Vercel and GitHub Pages.

## 2. Choose the public support details

Decide what may appear publicly:

- support email;
- optional support phone;
- business/postal address required by the relevant account or law;
- legal operator/business wording;
- expected support response time.

Recommended support email pattern:

- `support@YOURDOMAIN.COM`
- or `help@YOURDOMAIN.COM`

Do not publish a private residential address unless it is legally required and you have deliberately chosen to do so.

## 3. Put the details into the app

Open `config.js` and complete:

```js
publicSupportEmail: "support@YOURDOMAIN.COM",
publicWebsiteUrl: "https://YOURDOMAIN.COM",
publicSupportPhone: "",
publicBusinessAddress: "",
```

Then replace the square-bracket placeholders in every file inside `/legal/` with the same public details.

The Launch Check deliberately remains BLOCKED while the website or support email is blank.

## 4. Deploy the repository to Vercel

1. Extract the ZIP.
2. Create one clean GitHub repository.
3. Upload the contents of the extracted folder to the repository root. The root must directly contain `index.html`, `styles.css`, `app.js`, `logic.js`, `config.js` and `vercel.json`.
4. In Vercel, choose **Add New → Project** and import the GitHub repository.
5. Framework preset: **Other**.
6. Root directory: repository root.
7. Build command: blank.
8. Install command: blank.
9. Output directory: blank.
10. Deploy.
11. Open the generated Vercel URL and test every main tab, legal URL and payment button.
12. In the Vercel project, open **Settings → Domains → Add Domain**.
13. Enter the chosen domain and follow the exact DNS instructions Vercel displays.
14. Wait until Vercel shows the domain as valid and HTTPS is active.

Official Vercel references:

- https://vercel.com/docs/git/vercel-for-github
- https://vercel.com/docs/domains/working-with-domains/add-a-domain

## 5. Keep GitHub Pages only as a backup or preview

The included GitHub Actions workflow can deploy the same static root.

1. GitHub repository → **Settings → Pages**.
2. Source: **GitHub Actions**.
3. Open the Actions tab and confirm the deploy workflow passes.

Do not use two different public production domains in Google, Apple and Stripe records. Pick one production domain.

## 6. Confirm these URLs publicly work before store entry

Open each URL in a private/incognito browser window:

- home page;
- privacy policy;
- terms;
- safety disclaimer;
- subscription terms;
- refund/cancellation;
- account deletion;
- support.

There must be no login wall, 404, geographic block, editable shared-document link or PDF-only privacy policy.

Google states that the privacy policy must be on an active, publicly accessible, non-geofenced URL and not a PDF. If the app allows account creation, Google also requires an in-app deletion path and a public web resource where deletion can be requested.

Official Google references:

- https://support.google.com/googleplay/android-developer/answer/10144311
- https://support.google.com/googleplay/android-developer/answer/13327111

Apple requires a privacy policy URL for apps and requires working privacy and support links.

Official Apple references:

- https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy/
- https://developer.apple.com/app-store/review/guidelines/
- https://developer.apple.com/distribute/app-review/

## 7. Stripe website setup

For the web subscription channel:

1. Create and verify the four recurring Stripe products/prices.
2. Create one Payment Link for each exact recurring price.
3. Map the correct link to the correct product in `config.js`.
4. Enable appropriate payment methods in Stripe.
5. Register/verify the production domain where required for wallet methods.
6. Test in Stripe test mode before inserting live links.
7. Set up a secure backend webhook before promising automatic premium activation across devices.

Official Stripe references:

- https://docs.stripe.com/payments/payment-methods/pmd-registration
- https://docs.stripe.com/payments/payment-methods/integration-options
- https://docs.stripe.com/testing/wallets

Wallet buttons depend on the customer device, browser, wallet setup, country and Stripe configuration. The app must not promise that every customer will see Apple Pay or Google Pay.

## 8. Send these details back for the final patch

Provide:

1. chosen domain;
2. public support email;
3. optional public phone;
4. public business address wording, if any;
5. which Stripe Payment Link belongs to each of the four products;
6. final Google Android application/package ID;
7. final Apple bundle ID;
8. whether concession verification will launch now or remain disabled.

After those details are known, the remaining placeholders can be replaced consistently in one pass.
