# GENEVIEVE App™ Dog Park — Stage 1 First Structure

Structure version: `first-structure-2026-08-18`

This stage establishes the nine-screen application shell and deployment foundation only. It deliberately does not claim live weather, tides, council verification, occupancy, GPS boundary monitoring, hazard broadcasting, billing, emergency dispatch, or secure profile persistence until those integrations are implemented and verified in later stages.

## Screen order
1. Today — core entry
2. Journey & Status — crowd/marine intelligence shell
3. Dog Profile Setup — identity/behavioural baseline shell
4. Handler Profile & Security — human command deck shell
5. Emergency Assistance Overlay — protected emergency shell
6. Regional Wildlife & Hazard Contribution — threat registry shell
7. Grey Nomad Navigation & Vet Routing — long-distance navigation shell
8. Active Supervision & Boundary Guard — on-site supervision shell
9. Community Etiquette & Moderation — governance shell

## Stage 1 release gates
- Today opens first.
- All nine screens are reachable without page reload.
- Emergency control requires a three-second hold before opening its overlay.
- No button falsely states that help, location, reports, live data, council verification or cloud persistence has occurred.
- Unknown/unconnected live information is shown as unknown, never safe.
- Mobile layout works at 320 CSS pixels and above.
- Keyboard focus is visible and screen switching preserves a single-page shell.
- Service worker does not cache API calls or exact location.
- No secrets are committed to source.
- `/api/health` stays healthy without a database secret and verifies the Stage 1 Neon foundation when `DATABASE_URL` is configured server-side.
