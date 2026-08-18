# GENEVIEVE App™ — Australia Master Consolidation Audit

Date: 18 August 2026 (Australia/Brisbane)
Protected production target: `genevieve-tracey-gruff-dog-park-app-59vc`
Protected production alias: `genevieve-tracey-gruff-dog-park-app-opal.vercel.app`
Canonical GitHub repository: `tracey727/Genevieve-Tracey-Gruff-dog-park-app`
Canonical live Neon project: `genevieve-dog-park-live` (`sweet-star-23844892`)
Source architecture: `Genevieve_App_Master_Blueprint.md`

## Non-negotiable consolidation rules

1. The uploaded nine-screen master blueprint remains the architecture authority.
2. Local-first safety and privacy controls must remain operational before cloud transmission.
3. Existing working production is protected until a candidate build passes code, preview, data and mobile checks.
4. No old repository, Vercel project or Neon project is deleted merely because its name is similar. Unique functionality is accounted for first.
5. No external feed, council verification, tide/water-quality result, offline map, route stop or emergency service is represented as verified when it is not actually verified.
6. Visual presentation remains the locked premium deep-green / sage / ivory / Genevieve gold system with the supplied Genevieve roots logo.
7. Audit occurs after each chronological section before the next section is promoted.

## Baseline inventory audit

### Canonical V53 production code

The Vite/React production entry points are `index.html`, `src/main.jsx`, `src/App.jsx`, `src/styles.css` and `src/brand-colour-override.css`, with server functions under `api/` and Stripe helpers under `server/`.

Historical repair scripts and older app copies still exist in the repository root. They are not imported by the V53 Vite entry point and are treated as historical material until consolidation is complete.

### Duplicate GitHub repositories identified

- `tracey727/Genevieve-Tracey-Gruff-dog-park-app` — canonical V53 master.
- `tracey727/genevieve-dog-park-clean` — older/private candidate.
- `tracey727/Genevieve-dog-park-app` — older multi-version candidate.
- `tracey727/Genevieve-Animals-Dog-Parks-App` — older candidate.
- `tracey727/Genevieve-Tracey-Animals-Dog-Park-App-Final-Deploy` — older V6/V7/V8 candidate.

Old V11 material contains travel emergency contacts, pet-friendly accommodation searches and a future boarding concept. Those items must be accounted for before any repository is retired.

### Live Neon audit

The V53 client is wired to the Neon project `genevieve-dog-park-live` (`sweet-star-23844892`). Public application tables are `attendance_events`, `conduct_acceptances`, `dog_profiles`, `handler_profiles` and `hazards`.

Row-level security is enabled on all five tables. Handler, dog and conduct data are owner-scoped. Anonymous attendance and hazard records are time-limited and constrained by insert policies. Hot-query indexes exist for attendance by location/time and session/time, dog profile owner lookup, and hazard location/time.

No database migration was required in the baseline pass.

## Chronological Section 1 — foundation, runtime and safety shell

### Audit before change

- V53 startup boundary, service-worker registration and local browser-storage fallback are present.
- AES-GCM device storage and privacy-before-cloud attendance logic are present.
- The official Genevieve roots asset is used by the locked brand layer.
- The premium palette remains deep forest `#1B4D2B`, deep green `#123D2C`, sage `#6BA86E`, Genevieve gold `#C9A227`, warm ivory/cream.
- The global emergency control retains the 3-second hold plus slide confirmation contract.
- `/api/bom` responds in production; a Node deprecation warning is present in runtime logs and is tracked separately from functional failures.
- `/api/trip-calculate` returned HTTP 500 in production before request validation, so the previously written national travel engine was not usable.

### Root cause repaired

`api/trip-calculate.js` used CommonJS (`require` / `module.exports`) inside the V53 project whose package is ES-module based. It was replaced with an ES-module-compatible V53 implementation preserving:

- Australia-only place validation;
- current authorised device-coordinate origin support;
- up to eight required route places;
- 1.5-hour or 2-hour dog break ceilings;
- eight-hour road-day overnight planning;
- Tasmania/Mainland ferry transitions via the Spirit of Tasmania terminals;
- live openrouteservice road geometry when configured;
- provider timeout and fail-closed error handling;
- calculated stop coordinates clearly marked as unverified stopping facilities;
- SHA-256 calculation evidence and a versioned calculation record.

Repair commit: `e2ccda82580b788d58913bf6d753475f9149dfd2` on branch `agent/australia-master-consolidation-2026-08-18`.

### Local pre-commit verification

- `node --check` passed on the repaired route function.
- Input normalisation helper passed a Brisbane → Sydney route case with a Coffs Harbour required place.
- Ten-hour route helper produced required dog breaks and an overnight boundary.
- Attention-level helper retained the red high-risk state.

### Gate before Section 2

The branch preview must build successfully and `/api/trip-calculate` must stop returning a function-invocation failure before the national travel UI is connected to it. If the provider key is absent, an explicit fail-closed `503 national_routing_not_configured` response is acceptable at this gate; a runtime crash is not.
