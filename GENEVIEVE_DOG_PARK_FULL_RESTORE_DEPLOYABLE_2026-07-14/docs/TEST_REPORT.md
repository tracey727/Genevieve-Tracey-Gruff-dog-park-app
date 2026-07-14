# GENEVIEVE App™ Dog Park — Test Report

Version: **2026.07.14.3**  
Test date: **14 July 2026**

## Passed automated checks

- JavaScript syntax passed for `app.js`, `logic.js`, `config.js`, `backend.js`, `native-billing-bridge.js` and `service-worker.js`.
- `manifest.webmanifest` and `vercel.json` parsed as valid JSON.
- Static HTML check found **31 screens**.
- Static HTML check found **23 forms**, all with submit handlers.
- Every `data-go` navigation target has a matching screen.
- All local HTML, CSS, JavaScript, image and legal-page links resolve to files in the package.
- All required root deployment files are present.
- All ten legal pages are present.
- Exactly four payment-link mapping fields are present.
- Local HTTP server returned HTTP 200 for the home page, manifest, 404 page, privacy policy, support page and account-deletion page.

## Risk-engine tests

- Risk colours: 0–24 green, 25–49 yellow, 50–74 amber, 75–100 red.
- Similar dogs in calm/low-density conditions: **0% interaction risk — Green**.
- Highly mismatched dogs in overcrowded/high-energy/hot conditions: **100% interaction risk — Red**.
- Cool shaded weather with water: **2% heat risk — Green**.
- Extreme heat, humidity, UV, direct sun, no shade/water, hot surface and vulnerable dog: **100% heat risk — Red**.
- Controlled puppy-class plan with clearance and calm adult mentor: **0% — Green**.
- No clearance plus busy dog park and unknown group: **100% — Red**.
- Missing departure controls plus reactive status: Red.
- Complete calm departure plan: Green.

## Functional coverage implemented

- Full journey and lead/gate checklist.
- Park search, details, live state and beach search.
- Dog profiles, Mr Gruff, restricted emergency data and document reminders.
- Puppy socialisation assessment.
- Interaction-risk calculation and outcome learning.
- Companion ranking and best-mate relationships.
- Check-in/out and supervision confirmations.
- Owner Duty and unattended-dog report workflow.
- Etiquette assessment and break actions.
- Heat/weather and hazard reporting.
- Travel, emergency, lost/found and incidents.
- Council/operator notices and maintenance.
- Notifications, privacy, membership, legal, data and launch checks.

## External launch items not testable inside the package

The following require real external accounts or final business information:

- final public domain and DNS;
- public support details;
- approved logo and photos;
- Supabase authentication and production backend;
- real multi-user live park data;
- push notifications;
- verified council data;
- exact Stripe product/link mapping and webhook;
- Apple in-app purchase products and TestFlight;
- Google Play Billing products and closed testing;
- final legal/privacy/store review.

The in-app Launch Check marks these as blocked or not connected rather than presenting them as complete.
