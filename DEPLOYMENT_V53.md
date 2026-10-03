# GENEVIEVE App™ V53 — canonical deployment

The nine-screen safety framework, local-first protections, official GENEVIEVE assets, Neon-backed community data layer, Australia-wide route planner and PWA shell are maintained in this repository.

## Canonical stack

**GitHub + Cloudflare + Neon**

- Vite builds the browser application into `dist/`.
- Cloudflare Workers serves the SPA assets and executes `/api/*` plus `/health`.
- Neon provides authentication and the data API.
- Stripe and OpenRouteService credentials are Cloudflare Worker secrets.

## Verification

```bash
npm install
npm test
npm run build
npm run cf:check
```

See `docs/CLOUDFLARE_DEPLOYMENT.md` for the deployment procedure.
