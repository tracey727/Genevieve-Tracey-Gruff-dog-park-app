# Production deploy trigger

Purpose: trigger a clean Vercel production build from the restored `main` branch after duplicate Git integrations were disconnected.

Target project: `genevieve-tracey-gruff-dog-park-app-59vc`
Canonical domain: `genevieve-tracey-gruff-dog-park-app-opal.vercel.app`

Final production refresh: load the newly added `STRIPE_WEBHOOK_SECRET` environment variable into the live serverless functions.

No application logic is changed by this file.
