# Stage 4 Structure — Suitability / Heat / Risk / Compatibility

## Chronological link
Stage 4 depends on and follows Stage 3. It reuses the Stage 3 automatic private session, stable dog profiles and privately selected source-backed park. It does not bypass Stage 3 or create a second identity/source-of-truth system.

## What Stage 4 activates
1. A Today-screen suitability review using the selected dog, selected park, source verification/freshness, static park facilities and current owner observations.
2. The controlled risk vocabulary: 1–3 Green, 4–5 Yellow, 6–7 Amber, 8–10 Red.
3. Explainable output fields: reasons, source state, unknowns, practical controls and policy version.
4. A heat-information object that exposes recorded shade/water facts and explicitly reports live-weather / surface-heat gates.
5. Pair and group compatibility review using owner-entered behaviour, play, tolerance, reactivity, care and life-stage context. Breed is not loaded into the Stage 4 comparison engine and is never used as a verdict.
6. Persistent Stage 4 assessment evidence linked only to the private Stage 3 session.

## Deliberate gates
- `numeric_scoring_enabled = false`
- `surface_heat_estimate_enabled = false`
- `live_weather_enabled = false`
- `expert_review_status = PENDING`

The numeric vocabulary is available for a future approved policy, but this build does not invent veterinary or behaviour weights. Therefore current candidate assessments return `score: null`, `band: UNKNOWN`, reasons, uncertainty and controls.

## Privacy boundaries
Stage 4 does not query `stage3.dog_private_details`. Microchip, council registration, vaccination documents, medical conditions, allergies, medications, veterinarian details and emergency notes do not enter Stage 4 assessment records. Precise user GPS is not collected or stored.

## Still later
Stage 5 check-in/out, presence, occupancy and GPS boundary; Stage 6 live hazards/incidents; Stage 7 routing; Stage 8 live weather/tides/marine feeds; later council, payment, resilience and production stages remain gated.
