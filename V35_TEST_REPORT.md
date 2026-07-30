# GENEVIEVE App™ Dog Parks — V35 Journey Fix Test Report

Build: **2026.07.30.35**

## Fixed

- Both the top and bottom **Journey** buttons now target `#journey`.
- A dedicated Journey landing screen is present.
- The Grey Nomad whole-trip planner remains a separate `#travel` screen.
- The Grey Nomad planner no longer makes the **More** button active when the user taps **Journey**.
- An old broken address such as `?genevieveVersion=32#travel` migrates to `#journey` once.
- Service-worker, manifest, scripts and stylesheet versions were bumped to V35 to clear the stale iPhone cache.

## Verification completed

- JavaScript syntax: `app.js`, `repair.js`, and `service-worker.js` — **PASS**.
- JSON parsing: `manifest.webmanifest` and `vercel.json` — **PASS**.
- Journey navigation regression test — **PASS**.
- V35 deep-link migration test — **PASS**.
- All non-jsdom supplied Node tests — **PASS**.
- Static navigation audit: every `data-go` target has a matching page ID — **PASS**.
- Broken Journey target `data-go="travel" data-main="journey"` count — **0**.
- Correct Journey target `data-go="journey" data-main="journey"` count — **2**.

## Test limitation

The container could not launch a local browser page because local browser navigation is blocked by the environment administrator. The DOM tests that require the optional `jsdom` development dependency were not run because that dependency was not installed in the offline container. The navigation logic was instead checked through JavaScript syntax, static DOM inspection, target auditing and dedicated regression tests.
