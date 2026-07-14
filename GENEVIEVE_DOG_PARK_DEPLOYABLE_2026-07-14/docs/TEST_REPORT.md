# Automated Test Report — 14 July 2026

Node.js syntax checks, JSON validation, local HTTP response checks, jsdom functional interaction test and static-link/file validation.

## Passed
- ✅ Root index loads and initial Today screen activates
- ✅ Compatibility calculation returns a scored result
- ✅ Dog check-in is stored and rendered
- ✅ One-way affinity link is created and preferred-park alert resolves
- ✅ All four unmapped web payment buttons remain disabled
- ✅ Launch checker blocks missing public support and payment configuration
- ✅ JavaScript files pass node --check
- ✅ manifest.webmanifest and vercel.json are valid JSON
- ✅ All local HTML/CSS/JS/image/legal links point to files present in the package

## Deliberate launch blocks
- ⚠️ Stripe Payment Links are blank until each supplied link is verified and mapped to the correct recurring product.
- ⚠️ Apple and Google store billing require native wrappers and secure server-side transaction verification.
- ⚠️ Supabase credentials and authentication are not configured.
- ⚠️ Public support email and verified website/domain are not configured.
- ⚠️ Legal pages remain drafts requiring final facts and professional review.
- ⚠️ Built-in park records are labelled demonstration records pending council verification.

The package is deployable as a static web/PWA build. These deliberate blocks prevent it from falsely presenting unverified payments, accounts, legal facts or park data as production-ready.
