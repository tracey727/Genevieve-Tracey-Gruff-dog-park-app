# GENEVIEVE Dog Parks V52 — Runtime database URL patch

**Date:** 5 August 2026  
**Patch version:** 52.1.2

## Purpose

Vercel's Neon integration manages `DATABASE_URL`, so it cannot be edited to use the restricted `genevieve_runtime` role. This patch makes the backend prefer the manually protected Preview variable `DATABASE_RUNTIME_URL`, while retaining `DATABASE_URL` as a compatibility fallback.

## Files changed

- `api/_lib/config.js`
- `api/_lib/db.js`
- `.env.example`
- `package.json`
- `tests/smoke-test.cjs`

No branding, UI, app logic, emergency controls, payments, routing, storage schema, SQL migrations or service-worker files were changed.

## Runtime behaviour

1. Use `DATABASE_RUNTIME_URL` when present.
2. Otherwise fall back to `DATABASE_URL`.
3. Existing runtime safety checks still reject superuser, BYPASSRLS or protected-table-owner credentials.
