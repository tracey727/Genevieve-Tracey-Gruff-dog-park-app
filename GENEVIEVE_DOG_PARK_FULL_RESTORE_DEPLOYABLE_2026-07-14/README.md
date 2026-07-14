# GENEVIEVE App™ Dog Park — Complete Restore Deployable Build

Version: **2026.07.14.3**

This package restores the full Dog Park structure into one clean static web/PWA repository that can be deployed directly to GitHub Pages or Vercel without npm, Vite, React or a build command.

## Main navigation

The public app deliberately shows only five main choices:

- Today
- Journey
- Parks
- Dogs
- More

The remaining operational pages stay under More so the complete feature set does not overload users.

## Included

- 31 functional screens;
- complete home-to-park-to-home journey;
- lead-on route and gate checklist;
- park search, details, live state and beaches;
- owner-controlled dog profiles and Mr Gruff’s date of birth;
- puppy and young-dog socialisation assessment;
- consistent interaction and heat risk engine;
- prospective companions and best-mate relationships;
- check-in/out, incognito, needs-space, on-lead and training states;
- Owner Duty and unattended-dog reports;
- etiquette/body-language prompts;
- hazards, travel, emergency, lost/found and incidents;
- park superintendent maintenance and public notices;
- notifications, membership, privacy and legal pages;
- local data and patent-evidence export;
- launch checker;
- GitHub Actions and Vercel configuration;
- PWA service worker;
- Supabase starting schema; and
- Node risk-engine tests.

## Risk scale

All risk percentages use one direction:

- 0–24: Green — lower risk
- 25–49: Yellow — moderate risk
- 50–74: Amber — high risk
- 75–100: Red — very high risk

The Today result uses the highest current risk component so a serious heat, interaction or crowding risk is not averaged away.

## Deployment

Read:

- `docs/SITE_SETUP_TODAY.md`
- `docs/GITHUB_VERCEL_DEPLOY.md`
- `docs/PAYMENTS_AND_STORE_URLS.md`
- `docs/TEST_REPORT.md`

## Current technical boundary

The site is fully deployable and its local functions work in the browser. Browser local storage holds profiles, plans, check-ins, relationships, predictions, reports and evidence.

A real multi-user public service still needs:

- final domain and public support details;
- secure authentication and production backend integration;
- verified official park/council data;
- push notifications;
- server-side subscription verification and entitlements;
- exact Stripe product-link mapping;
- Apple and Google native wrappers/billing;
- final privacy/data-safety declarations; and
- professional legal, privacy, veterinary-safety, insurance and patent review.

The Launch Check displays these as blockers rather than pretending they are complete.

## Official logo and photos

The exact approved GENEVIEVE App™ logo and approved Tracey/Mr Gruff photo assets were not mounted in the build workspace. The package therefore keeps a neutral paw utility icon and does not redraw or alter the locked logo. Replace the utility assets only with the exact approved master files.
