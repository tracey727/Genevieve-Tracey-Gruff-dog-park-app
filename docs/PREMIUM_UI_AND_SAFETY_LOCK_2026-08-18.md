# GENEVIEVE App™ Dog Park — Premium UI & Safety Lock

Approved: 18 August 2026

## Purpose
This file is the locked production brief for the current GENEVIEVE App™ Dog Park hardening pass. Future UI work must preserve these rules unless Tracey explicitly approves a change.

## Brand lock
- Use Tracey’s existing Genevieve tree / roots / infinity artwork from `genevieve-roots-512.png`. Do not substitute a generated tree, stock tree, emoji logo or recreated mock.
- Presentation is premium, sophisticated, calm and high-class.
- Core palette: deep forest green, warm Genevieve gold, ivory/cream and soft sage.
- Avoid large uninterrupted white areas. Background and panels need enough sage/cream tonal separation to reduce visual strain and improve focus.
- Do not use cartoonish, clip-art or novelty imagery in safety surfaces.

## Toggle lock
- OFF state = GREEN.
- ON state = GOLD.
- This convention applies to all switch-style toggles in the Dog Park app.
- Focus states must remain visible and accessible.

## Emergency control lock
- The primary emergency control is presented in premium Genevieve gold in its normal state.
- Safety behaviour is NOT cosmetic and must not be weakened:
  - hold continuously for 3 seconds to arm;
  - slide to at least the existing 92 threshold to open the emergency portal;
  - releasing early cancels the hold;
  - armed state remains visually distinct and urgent.
- Do not convert this to a one-tap emergency trigger.

## Colour-alert system lock
Existing operational colour-alert selectors and underlying safety calculations must remain intact. The current system includes green/safe, caution/warn/amber and red/high-risk states in the live UI. Presentation changes may refine borders, spacing and typography but must not flatten all alerts into the green/gold brand palette.

## Hazard artwork lock
The four hazard categories remain logically unchanged:
1. Snake / Wildlife (`snake`)
2. Council / Infrastructure (`infrastructure`)
3. Baiting / Poison Threat (`poison`)
4. Altercation / Incident (`incident`)

Their visual treatment must use the refined vector hazard artwork in `public/assets/` and must not revert to cartoon, clip-art or oversized emoji category images.

## Nine-screen application contract
The following screens must remain present and wired:
1. Today
2. Journey
3. Dog / Mate Profile
4. Handler / Security
5. Emergency
6. Hazard Registry
7. Travel / Grey Nomad Router
8. Active Supervision / Boundary Guard
9. Conduct / Governance

## Functional safety contract
Do not remove or silently weaken:
- local-first attendance and hazard capture;
- Neon live/cached community sync;
- duplicate hazard shield;
- safety score calculation and bounded 0–100 result;
- breed-sensitive heat thresholding;
- crowd mix calculation and off-game warning logic;
- emergency 3-second hold + slide gate;
- GPS boundary supervision and deadman checkout;
- encrypted device storage for private handler/dog data;
- optional RLS-protected Neon private backup;
- conduct/governance and voluntary QR exchange;
- BOM weather proxy and visible data freshness/fallback state;
- payment layer isolation from safety screens.

## Payment safety contract
- Stripe secrets remain server-side only in Vercel environment variables.
- Never place `sk_test_` or `sk_live_` values in browser code, `config.js`, GitHub source or chat transcripts.
- Stripe-hosted Checkout may expose Apple Pay and Google Pay only when supported by the customer device/browser/account.
- Payment failure must fail closed without disabling the safety app.
- Full production subscription entitlement still requires verified webhook/lifecycle handling before payments are described as complete production membership automation.

## Scale / concurrency contract
The app must not be described as proven for thousands of simultaneous users merely because the browser code renders correctly.

Already required in code/audit:
- bounded cloud attendance reads;
- bounded cloud hazard reads;
- bounded local persistence arrays;
- indexed location/time queries in Neon;
- stateless/cached public weather endpoint;
- provider timeouts and input limits for route calculations;
- synthetic 5,000-session regression coverage for crowd calculations.

Production launch requirement before claiming thousands-at-once capacity:
- real load test against the production-shaped stack;
- verify Vercel function/concurrency limits;
- verify Neon autoscaling/pooling capacity and latency;
- verify external provider quotas/rate limits (BOM/routing/Stripe as applicable);
- monitor p50/p95/p99 latency and write failure rate under target concurrency.

### Current launch blocker found 18 Aug 2026
The live `genevieve-dog-park-live` Neon compute endpoint is currently capped at 0.25 CU and located in `aws-us-east-2`. The database tables are correctly indexed for the live attendance/hazard query patterns and RLS is enabled, but this compute configuration must not be represented as validated for thousands of simultaneous Australian users without capacity changes and a load test.

## Known deliberately-unverified components
These must stay visibly honest rather than inventing data:
- tide feed: pending until verified live integration;
- water/algae feed: pending until verified live integration;
- regional tick/disease status: requires verified veterinary/public-health source;
- true turn-by-turn offline road navigation: requires installed downloadable map data.

## Deployment gate
No production deployment for this hardening pass until:
1. tests pass;
2. Vite production build passes;
3. nine-screen contract test passes;
4. emergency contract test passes;
5. colour-alert selectors remain present;
6. hazard assets resolve;
7. payment secret remains server-side;
8. preview is visually checked;
9. Tracey explicitly approves production promotion.
