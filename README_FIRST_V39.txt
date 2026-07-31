GENEVIEVE APP™ DOG PARKS — FULL LIVE DEPLOYMENT V39
Build: 2026.07.31.39

THIS IS THE CLEAN LIVE DEPLOYMENT PACKAGE.

FIXED AND VERIFIED:
1. The app opens at the top of the Today page with the complete branded header.
2. The official GA logo is locked into the left white box.
3. The official Tree and Roots artwork remains in the right white box.
4. The full header appears on Today only.
5. Journey, Parks, Dogs and More open as separate pages without the full header.
6. The stale Version 32 cache-reset code is replaced by Version 39.
7. The service worker, manifest, runtime scripts and build markers all use Version 39.
8. The voluntary check-in saves correctly and check-out removes the active record.
9. Park search returns results and opens the selected map panel.
10. All 33 app screens were opened in the browser audit.

OFFICIAL LOCKED ASSETS:
- assets/genevieve-ga-logo-v35.png
- assets/genevieve-safety-from-roots-locked-2026-07-29.jpeg

VERCEL PHONE DEPLOYMENT:
1. Upload/select this ZIP in Vercel.
2. Project Name: genevieve-tracey-gruff-dog-park-live-v39
3. Application Preset: Other
4. Root Directory: ./
5. Leave Build and Output Settings unchanged.
6. Leave Environment Variables empty.
7. Tap Deploy.

If Vercel says the project name already exists, use:
genevieve-tracey-gruff-dog-park-live-v39a

The red error in the screenshot was a duplicate project-name error, not a failed app build.
