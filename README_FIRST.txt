GENEVIEVE DOG PARK APP — V33 REPAIR
Prepared 29 July 2026 for Tracey Ann Kennedy

WHAT THIS FIX DOES
1. The app opens on Today at the top of the page so the full header is visible.
2. It restores the approved GA logo and the “Safety from roots to every journey” artwork using the exact filenames the app expects.
3. Journey opens on its own dedicated page.
4. Grey Nomad Trip Planner remains separate inside Journey instead of hijacking the Journey button.
5. It bumps the cache from V32 to V33 so an iPhone/PWA does not keep serving the broken files.
6. It checks static navigation targets, required assets and JavaScript syntax when Node.js is available.
7. It creates a timestamped backup before changing anything.

HOW TO APPLY IT
A. Extract this ZIP.
B. Double-click APPLY_FIX.bat.
C. The repair looks for the correct GENEVIEVE repository. When more than one copy is found, choose the V32 repository connected to the live Vercel app.
D. Wait for the green PASS message.
E. Open GitHub Desktop. Check the changed files. Use commit message:
   Fix V33 first screen logos and Journey page
F. Click Push origin.
G. Wait for Vercel to finish deploying.
H. On iPhone, open the Vercel link in Safari once. V33 clears the old Genevieve cache and opens #today.

IMPORTANT
- Do not upload the repair ZIP itself to Vercel.
- Do not delete your repository.
- The script makes a folder named _backup_before_v33_DATE-TIME before editing.
- ROLLBACK_FIX.bat restores the newest text-file backup if needed.

EXPECTED LIVE LINK AFTER DEPLOYMENT
The old link ending in #travel should correct itself to #today on a normal launch unless an explicit ?open=screen parameter is supplied.
