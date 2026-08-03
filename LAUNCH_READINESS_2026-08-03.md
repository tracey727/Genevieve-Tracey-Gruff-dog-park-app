# GENEVIEVE Dog Parks launch readiness

Build: `2026.08.03.46`  
Planned launch: **8 August 2026**

## Current decision

| Launch type | Status | Reason |
|---|---|---|
| Free/local-first web or PWA pilot | **Code-ready after upload and real-device UAT** | Production files, branding, navigation, offline assets and legal links are complete in this delivery. |
| Paid web launch | **Blocked** | All four Stripe payment links are blank; entitlement, webhook and customer-portal operation are not configured. |
| Apple App Store / Google Play paid launch | **Blocked** | This repository is a PWA. Signed native builds, store products, restore, server notifications and sandbox/store review are still required. |
| Shared accounts/community launch | **Blocked** | Supabase URL and anonymous key are blank; authenticated backend, row-level security, moderation and deletion are not configured. |

The safe 8 August option is a free/local-first pilot unless the paid and shared-service blockers below are completed and independently tested first.

## Completed in this build

- Kept the full existing production app and official GA and roots/journey branding.
- Preserved the colour system: timber `#042d1b`, deep green `#06391f`, gold `#c9a227`, emergency red `#f10b0b`, field `#dcefe4`.
- Repaired every missing icon/legal reference that could stop PWA installation.
- Moved Emergency from the cramped sixth navigation slot into a persistent separate dock visible on every screen.
- The global three-second hold now opens the complete nearby-services hub without calling anyone.
- Added manual-place and explicitly requested current-location searches for emergency vets, vets open now, council animal management/ranger, pounds/shelters, RSPCA, rescues, wildlife help and police.
- Kept Triple Zero behind its own second three-second hold and deliberate confirmation slide.
- Kept the four advertised AUD prices and 30-day eligible-new-subscriber trial wording.
- Added a visible payment launch gate; unconfigured checkout remains disabled.
- Updated app/legal/cache versions and launch date.
- Added Privacy, Terms, Safety, Subscription, Refund, Concession, Deletion, Community, Support and IP documents.
- Added Vercel cache controls and basic security/privacy headers.

## Jobs Tracey still needs to complete

### Must do before any 8 August public pilot

1. **Upload and deploy this exact build.** Put the extracted contents in the GitHub repository root, then confirm Vercel production is built from `main`.
2. **Real-device acceptance test.** Test iPhone/Safari and Android/Chrome, including navigation, the moved Emergency control, offline refresh, location/weather, map hand-off, check-in expiry, export and delete.
3. **Verify the public contact points.** Confirm `https://genevieveapp.com.au` loads and `tracey@genevieveapp.com.au` is monitored. Publish an expected response time.
4. **Complete the legal identity fields.** Add the verified service/business address and ABN/ACN if applicable. Confirm the operator wording and trade mark/application wording are factually correct.
5. **Obtain Australian legal review.** Have a qualified Australian lawyer review all ten documents against the actual entity, vendors, data flows, pricing, consumer remedies and Queensland terms. These files are operational drafts, not legal advice.
6. **Professional safety review.** Have a veterinarian/qualified animal behaviour professional review the heat, risk and compatibility logic; have an accessibility reviewer check communication features.
7. **Carefully test Emergency on phones.** Do not make an unnecessary 000 call. Confirm the dialler opens only after hold plus slide, Cancel works, and the app never claims it dispatched help or sent location.

### Required before enabling web billing

1. Create and verify the four recurring Stripe products/payment links matching:
   - Standard Monthly — A$14.99/month
   - Concession Monthly — A$10.49/month
   - Standard Annual — A$119.99/year
   - Concession Annual — A$83.99/year
2. Configure the 30-day trial only for eligible new subscribers and verify the hosted checkout shows the exact price, renewal interval, trial end and cancellation terms before purchase.
3. Put only the verified public payment-link URLs into `config.js`; never place Stripe secret keys in the repository.
4. Configure a secure Stripe customer portal, webhooks and server-side entitlement records. Test successful purchase, cancellation, refund, failed payment, trial conversion and entitlement removal in test mode.
5. Finalise concession eligibility, evidence minimisation, verification, appeals, retention/deletion and staff access before selling concession products.
6. Reconcile invoices, tax/GST treatment, refund authority and business records with an accountant/lawyer.

### Required before Apple/Google launch

1. Create signed native iOS and Android wrappers/builds and developer accounts.
2. Create store products whose IDs match the app configuration; configure trials and localised prices in each store.
3. Implement native purchase, restore, entitlement verification and store server notifications.
4. Complete Apple privacy nutrition labels, Google Data safety, store listings, screenshots, support/privacy/deletion URLs and review notes.
5. Run sandbox/test purchases on real devices, then submit and pass store review.

### Required before accounts or shared community data

1. Configure a production backend and public Supabase credentials; keep the service-role key server-side only.
2. Implement authentication, row-level security, consent, audit logs, encrypted transport, retention, export/correction and authenticated account deletion.
3. Add reporting, blocking, moderation, appeals, abuse response and administrator controls before community sync.
4. Update Privacy/Terms to name every final backend, analytics, crash, messaging and overseas-processing provider before activation.

## Release-day checks

1. Confirm live build marker `2026.08.03.46` and legal version `2026-08-03`.
2. Run `npm test` from the repository root.
3. Open every legal URL directly and verify HTTP 200.
4. Install the PWA once, refresh, then test offline reload.
5. Check browser console/network for errors and 404s.
6. Confirm checkout stays disabled unless the intended provider configuration has passed end-to-end test mode.
7. Keep a copy of the prior deployment and this ZIP/checksum for rollback.
