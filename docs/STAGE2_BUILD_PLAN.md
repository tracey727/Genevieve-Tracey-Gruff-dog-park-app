# Stage 2 — User Experience & Interface Design

Build date: 18 August 2026

## Controlling rule
Stage 2 begins from the audited Stage 1 foundation. It must not remove, rename, bypass, or falsely activate any Stage 1 safety boundary or structural component.

## Chronological build order
1. Preserve and verify the nine-screen information architecture.
2. Refine the global visual system and responsive shell.
3. Refine Screen 01 — Today.
4. Refine Screen 02 — Journey & Status.
5. Refine Screen 03 — Dog Profile Setup.
6. Refine Screen 04 — Handler Profile & Security.
7. Refine Screen 05 — Emergency Assistance Overlay.
8. Refine Screen 06 — Regional Wildlife & Hazard Contribution.
9. Refine Screen 07 — Grey Nomad Navigation & Vet Routing.
10. Refine Screen 08 — Active Supervision & Boundary Guard.
11. Refine Screen 09 — Community Etiquette & Moderation.
12. Run Stage 1 compatibility, safety, secret, navigation, accessibility, responsive and deployment audits.
13. Promote only after all audits pass.

## Locked Stage 1 components
- Today
- Journey & Status
- Dog Profile Setup
- Handler Profile & Security
- Emergency Assistance Overlay
- Regional Wildlife & Hazard Contribution
- Grey Nomad Navigation & Vet Routing
- Active Supervision & Boundary Guard
- Community Etiquette & Moderation

## Stage 2 boundaries
- UX/UI refinement only.
- No false live-data claims.
- No exact GPS capture.
- No profile persistence until its later verified stage.
- No emergency dispatch claim.
- Call 000 remains the only active emergency call action in this stage.
- DATABASE_URL remains server-only.
- All unavailable functions must remain visibly unavailable rather than simulated.

## Release gate
Stage 2 is releasable only when every Stage 1 component remains present, the Stage 1 audit still passes, the Stage 2 audit passes, the Vercel build is clean, `/api/health` returns database connected, and production has no runtime errors.
