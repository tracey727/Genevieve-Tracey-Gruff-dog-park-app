# GENEVIEVE App™ Dog Park — Deployable Web/PWA Build

Version: 2026.07.14

## What this package is

A clean static web/PWA build that deploys from the repository root with no npm install, no Vite, no React build and no output directory. It includes the restored compatibility system, best-mate relationships, location-specific alert logic, adaptive outcome evidence, legal pages and a payment-channel router.

## GitHub upload

Upload the **contents of this folder** to the root of one repository. Do not upload the ZIP as the only repository file. The repository root must directly contain `index.html`, `styles.css`, `app.js` and `vercel.json`.

GitHub Pages can be enabled under **Settings → Pages → Source: GitHub Actions**. The included workflow publishes the static root.

## Vercel

- Import the GitHub repository.
- Framework preset: **Other**.
- Root directory: repository root.
- Build command: leave blank.
- Install command: leave blank.
- Output directory: leave blank.

## Current operating mode

The app is fully functional as a local-first demonstrator after deployment. Profiles, check-ins, relationships, compatibility records and evidence are stored in the user’s browser.

A true multi-user public service still needs:

1. a Supabase project and public URL/anon key;
2. authentication and production backend wiring;
3. verified council/location data;
4. store products in Google Play Console and App Store Connect;
5. server-side verification of purchases and entitlements;
6. mapped Stripe Payment Links for the web channel;
7. public support email and verified website/domain;
8. professional legal, privacy and patent review; and
9. beta testing.

The app’s **Launch Check** page intentionally identifies those missing facts instead of pretending they are complete.

## Payment channels

- `?channel=web` — uses only verified Stripe Payment Links in `config.js`.
- `?channel=apple` — external web purchase buttons are disabled and the native Apple billing bridge is required.
- `?channel=google` — external web purchase buttons are disabled and the native Google Play Billing bridge is required.

Never put Stripe secret keys, Supabase service-role keys, Apple secrets or Google service-account keys in this static repository.

## Official logo note

The package uses a neutral paw utility icon so deployment has no broken image. It does **not** recreate or alter Tracey’s locked official GENEVIEVE App™ logo. Replace the utility icons only with the exact approved master assets when those files are available in the deployment workspace.
