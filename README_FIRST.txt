GENEVIEVE APP™ DOG PARKS — CANONICAL V53
Build 2026.08.18.53

CANONICAL PLATFORM
- GitHub: source control and CI
- Cloudflare Workers: web/API runtime
- Cloudflare static assets: built Vite SPA
- Neon: authentication and data API
- Vercel: historical only; not a deployment target

CURRENT PRODUCT BOUNDARY
- React/Vite nine-screen Dog Park application remains canonical.
- Australia-wide Journey planner from the audited V53 candidate is included.
- Australia-only route validation, 1.5/2-hour dog-break ceilings, 8-hour road-day overnights, Tasmania ferry handling and fail-closed route behaviour are retained.
- Neon remains local-first/RLS-protected for cloud-backed animal/member data.
- Stripe and routing credentials remain server-side Cloudflare Worker secrets.
- Unknown routes, unavailable providers and insufficient evidence are not guessed.

VERIFY
1. npm install
2. npm test
3. npm run build
4. npm run cf:check

LOCAL CLOUDFLARE
npm run cf:dev

DEPLOY
See docs/CLOUDFLARE_DEPLOYMENT.md.

HISTORICAL MATERIAL
V33–V40 repair packages and superseded July deployment snapshots were used during earlier recovery work. They are not canonical runtime source and are removed from the active tree during the V53 consolidation; Git history retains them.
