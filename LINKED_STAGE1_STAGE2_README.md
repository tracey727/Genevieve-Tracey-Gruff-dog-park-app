# GENEVIEVE App™ Dog Park — Stage 1 + Stage 2 Linked Package

Package date: 18 August 2026
Source: audited GitHub `main` from `tracey727/Genevieve-App-Tracey-Gruff`

This ZIP contains the complete linked Stage 1 foundation and Stage 2 UX/UI layer.

## Linkage
- Stage 1 supplies the nine-screen structural shell, safety boundaries, Vercel configuration, Neon foundation migration and Stage 1 audit.
- Stage 2 sits on top of Stage 1 and preserves every Stage 1 screen and safety boundary while refining the responsive UX/UI, navigation accessibility, PWA identity and health-contract labelling.
- `npm test` runs the Stage 1 audit first and the Stage 2 audit second.
- `api/health.js` reports the app as Stage 2 while continuing to verify the Stage 1 Neon foundation.
- The real `DATABASE_URL` is intentionally NOT included. Set it server-side in Vercel Production.

## Safe deployment
1. Upload/import this folder to the intended GitHub repository.
2. Set Vercel Production environment variable `DATABASE_URL` to the intended Neon Stage 1 branch connection string.
3. Deploy.
4. Run `npm test`.
5. Verify `/api/health` returns `database: connected`.
6. Do not represent disabled later-stage functions as live.

## Included
Stage 1 structure, Stage 2 interface, Stage 1 and Stage 2 audit suites, GitHub Actions audit workflow, PWA files, Vercel headers, Neon Stage 1 migration, and server health endpoint.
