# Cloudflare + Neon deployment

## Canonical platform

- GitHub: source control and CI
- Cloudflare Workers: SPA static assets and server API routes
- Neon: authentication and data API

Vercel is no longer the canonical deployment runtime.

## Build verification

```bash
npm install
npm test
npm run build
npm run cf:check
```

## Required Cloudflare secrets

Set server-side secrets directly on the Worker. Do not commit values:

```bash
npx wrangler secret put OPENROUTESERVICE_API_KEY
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler secret put STRIPE_WEBHOOK_SECRET
```

The browser-side Neon Auth/Data API endpoints are public service endpoints and remain in `src/neon.js`; Neon RLS/identity controls remain the data boundary.

## Deploy

```bash
npm run cf:deploy
```

The Worker runs first only for `/api/*` and `/health`. Vite output in `dist/` is served as Cloudflare static assets with SPA fallback.

Repository rule: pull requests to `main` must pass the V53 application tests, Vite build and Cloudflare Wrangler dry-run before merge.
