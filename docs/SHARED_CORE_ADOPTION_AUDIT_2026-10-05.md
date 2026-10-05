# GENEVIEVE Shared Core Adoption Audit — Dog Park

Date: 2026-10-05

Status: **CANONICAL PRODUCT / PARTIAL SHARED CORE ADOPTION**

## Existing strengths

- GitHub + Cloudflare + Neon canonical platform.
- Neon RLS and owner-scoped member/dog/conduct data.
- local-first encrypted device storage.
- privacy-before-cloud attendance logic.
- fail-closed national routing/provider behaviour.
- explicit unverified-data labelling.
- human-confirmed emergency control.
- safety score and operational attention states.

## Important vocabulary boundary

The Dog Park UI currently uses green/amber/red safety tones and the word “hold” for the physical **press-and-hold emergency gesture**. That gesture is not the GENEVIEVE HOLD alert state and must not be renamed or conflated.

Shared Core adoption rule:
- operational/data state may use GREEN / AMBER / RED / HOLD;
- emergency gesture wording may continue to say “hold 3 seconds” because it describes an interaction, not an alert colour;
- unavailable/unverified evidence should map to operational HOLD where a shared status is exposed.

## External / product-specific boundaries

- Do not copy Kennels facility operations into Dog Park.
- Do not weaken RLS or local-first privacy.
- Do not expose Stripe/routing credentials client-side.
- Do not restore Vercel as a deployment target.
- No council/weather/route result may be called verified unless its source is verified.

## Adoption conclusion

Dog Park should consume Shared Core concepts selectively. Its existing product-specific safety/privacy controls are stronger than a forced generic rewrite. No runtime rewrite is justified in this pass.
