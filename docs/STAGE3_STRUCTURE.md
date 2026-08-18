# GENEVIEVE App™ Dog Park — Stage 3 Source-of-Truth Structure

**Control date:** 18 August 2026 (Australia/Brisbane)  
**Foundation:** user-supplied `Stage 1,2.zip`  
**Rule:** extend the protected Stage 1 + Stage 2 app; do not restart, shrink or replace it.

## Stage 3 scope
Stage 3 chronologically links: (1) automatic private device session, (2) owner profile/privacy choice, (3) stable dog profiles with restricted information physically separated, (4) park records with provenance/verification/freshness, (5) source-backed park search, and (6) one privately selected park carried from Today into Journey.

It does **not** activate later phases: risk/compatibility, check-in/out, GPS boundary, occupancy/Night Safety, hazards/incidents, map routing/Grey Nomad, live weather/tides, council operations, payments or production release.

## Linkage
- Existing nine-screen order remains unchanged.
- Existing `app.js` router and emergency hold logic remain; `app.js` imports `stage3.js`.
- `V002_stage3_source_of_truth.sql` follows `V001_stage1_foundation.sql`.
- `/api/health` verifies both `stage1.app_foundation` and `stage3.build_state`.
- Stage 1 and Stage 2 audits run before every Stage 3 audit.
- PWA cache adds `stage3.js`; `/api/` responses remain excluded from service-worker caching.

## Data
`device_sessions` stores only a SHA-256 token hash. The browser receives the raw token only in an HttpOnly, Secure, SameSite=Lax cookie.

`owner_profiles` stores owner-controlled contact, emergency contact, accessibility/private notes and visibility mode (`GHOST`, `PACK_ONLY`, `PUBLIC_FUZZY`). There is no public owner-profile API in Stage 3.

`dog_profiles` stores stable profile information: name, breed/mix, birth/age, size, weight, sex/desexed state, energy/play/social/approach preferences, likes/dislikes/triggers, sociability/reactivity/tolerance/play intensity, resource-sharing/guarding, extra-care needs, swimming/mobility, favourite toys, exercise/confidence and visibility. Temporary “how my dog feels today” status is deliberately excluded.

`dog_private_details` physically separates microchip, council registration, vaccination/documents, medical conditions, allergies, medications, veterinarian and emergency notes. These are returned only to the owning session.

`park_sources`, `parks` and immutable `park_source_snapshots` provide source, attribution, verification and freshness. `selected_parks` carries the owner’s chosen park across screens. No fake park rows are seeded: an empty source database returns no results rather than invented data.

## Park facts supported
Park records can hold size/area, fencing/double gates, separate dog areas, beach/water access, puppy area, shade, dog/tap water, toilets, seating, lighting, agility, training, accessibility, parking/caravan parking, cafés, BBQ/picnic, bins/bags, official rules, opening hours and off-leash schedule, plus source coordinates/time zone for later governed modules.

## APIs
- `POST/GET /api/session` — automatic private session.
- `GET/PUT /api/profile` — current owner only.
- `GET/POST/PUT/DELETE /api/dogs` — current owner only; delete is archive.
- `GET /api/parks?q=...` — source-backed search with verification/freshness.
- `GET /api/parks?id=...` — park + provenance.
- `POST /api/parks` — save selected park to current session.
- `GET /api/parks?selected=1` — retrieve same selected park.

All mutations require the session plus `X-Genevieve-Stage3: 1`; API responses are no-store.

## Database deployment order
1. Verify/apply `db/V001_stage1_foundation.sql`.
2. Apply `db/V002_stage3_source_of_truth.sql` once to a non-production target first.
3. Set `DATABASE_URL` only as a server-side Vercel environment variable.
4. Verify `/api/health` sees Stage 1 and Stage 3.
5. Run `npm test` before Preview deployment.
6. Do not overwrite production without separate production approval and rollback evidence.
