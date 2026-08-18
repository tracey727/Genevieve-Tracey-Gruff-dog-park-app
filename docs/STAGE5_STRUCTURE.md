# GENEVIEVE Dog Park — Stage 5 structure

Stage 5 is the chronological successor to the sealed Stage 1–4 candidate. It adds private visit/presence controls and privacy safeguards without activating later alert, hazard, travel, weather, payment or production scope.

## Chronological link

1. V001 — Stage 1 foundation.
2. Stage 2 — nine-screen premium UX/UI shell; no schema migration.
3. V002 — Stage 3 private session + owner/dog/park source of truth.
4. V003 — Stage 4 gated suitability/heat/risk/compatibility evidence.
5. **V004 — Stage 5 private visits, owner duty, derived boundary decisions and privacy policy gates.**

V001–V003 are not rewritten. The Stage 4 migration audit received one controlled compatibility correction: it now protects the immutable V001→V002→V003 prefix while permitting chronological successor migrations. The exact pre-Stage-5 audit file is retained in `docs/audits/STAGE4_DATA_AUDIT_PRE_STAGE5.mjs`.

## Stage 5 active capabilities

- Voluntary private check-in and check-out.
- One active visit per dog, enforced by a partial unique database index.
- Idempotency keys for check-in/out retries.
- Owner-selected current visit state and PRIVATE / INCOGNITO mode.
- Owner Duty intervals of 5, 10, 15 or 20 minutes.
- “I’m still supervising” renewal and private due-state calculation.
- Owner position declarations: UNKNOWN, INSIDE, AT_GATE, OUTSIDE or LEFT.
- LEFT recommends checkout; it does not automatically create an accusation or unattended-dog report.
- One-shot foreground boundary decision only after explicit user action.
- Boundary persistence stores only the derived decision/reason/accuracy state and a hard `precise_location_stored=false` invariant.
- Park-local solar phase and Night Safety privacy response.
- Public attendance endpoint that fails closed and does not query private visits.

## Hard privacy invariants

- No continuous or background location tracking.
- No `watchPosition`.
- No precise device coordinates in Stage 5 database columns, browser storage, cache, audit detail, public response, URL or application log.
- A boundary decision is permitted only when the selected park contains a source-backed, verified Stage 5 boundary policy; otherwise the result is UNKNOWN.
- At night, public attendance is hidden server-side/API-side.
- During daylight, public attendance also remains hidden while the final delay/batching/minimum-threshold anti-inference policy is unresolved.
- No exact public counts, identities, “only person/last person” signal, recent-arrival list or Best Mate presence is emitted by Stage 5.

## Deliberately unresolved / gated

The blueprint leaves exact stale-visit auto-expiry and the public low/moderate attendance delay/threshold policy unresolved. Stage 5 therefore **does not invent either policy**. Supervision timers can mark private presence as requiring confirmation, while public attendance remains hidden. Exact stale expiry remains `PENDING` in `stage5.policy_state`.

Stage 6+ remains later: hazard/incident/evidence/Lost & Found/magpie/emergency expansion, followed by maps/Journey/Grey Nomad, live weather/tides, council, billing, resilience, full staging and production release.
