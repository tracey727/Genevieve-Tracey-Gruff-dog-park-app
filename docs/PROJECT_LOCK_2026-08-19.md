# GENEVIEVE App™ — Locked Preview Rules

Date: 19 August 2026
Scope: `stage1-5-preview-2026-08-19` until explicit production approval.

## Brand and presentation
- Use the exact supplied GENEVIEVE tree / infinity / roots logo.
- Screen 1 carries the full brand line: **Safety from roots to every journey.**
- Presentation remains premium Australian GENEVIEVE styling: deep forest green, cream, restrained metallic gold trim, refined typography and professional spacing.
- Hazard category artwork uses the four supplied/refined SVG assets. Emoji/cartoon hazard artwork must not be reintroduced.

## Nine-screen integrity
- Preserve exactly nine linked screens: Today, Journey, Mate, Handler, Emergency, Hazard, Travel, Guard, Code.
- The large GENEVIEVE masthead is Screen 1 only and non-sticky.
- The red emergency activation control is Screen 1 only.
- Emergency activation requires a continuous three-second hold and then a deliberate full slide; it must never imply automatic dispatch or automatic location transmission.
- Handler preserves Accessibility & communication and the Deaf / Auslan area. Auslan signs/content remain verification-gated; no signs may be invented.

## Stripe / membership
- Stripe account connection is for GENEVIEVE App™.
- Approved recurring prices: Standard Monthly A$14.99; Concession Monthly A$10.49; Standard Annual A$119.99; Concession Annual A$83.00.
- 30-day trial is the approved subscription structure for eligible new subscribers.
- Stripe-hosted checkout is preferred so payment card details do not enter GENEVIEVE client code.
- The verified live Standard Monthly and Concession Monthly Payment Links may be connected in Preview.
- Annual checkout stays gated until Stripe has an unrestricted A$119.99 annual link and an exact A$83.00 concession annual price/link. Never substitute A$83.99 for A$83.00.
- No Stripe secret or webhook secret may be committed to client code.
- Billing failure must never block emergency, hazard, private check-in, boundary or other safety functions.
- Automatic premium entitlement must not be claimed until the secure backend/webhook lifecycle is separately activated and tested.

## Deployment boundary
- Keep the current Stage 1–5 deployment at exactly 12 API functions on the Vercel Hobby Preview.
- Preserve Neon staging for Preview testing.
- Do not merge/promote to GitHub `main`, Neon main, or the real production deployment until the user explicitly approves promotion after phone testing.
