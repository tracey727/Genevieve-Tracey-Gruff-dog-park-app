GENEVIEVE App™ DOG PARK — FULL V36 REPAIR
Prepared 30 July 2026

WHAT THIS REPAIRS
- Restores Tracey Ann Kennedy's exact archived GA master into the left white logo box.
- Restores the exact archived Tree & Roots safety mark into the right white logo box.
- Makes Journey open on its own Journey page instead of Travel or More.
- Keeps the large top header on Today only.
- Removes the large top header from Journey, Parks, Dogs and More.
- Returns every page to the top when opened.
- Synchronises index, JavaScript, manifest and service worker to V36.
- clears the stale V32/V35 application cache on the next load.
- Creates all missing PWA icon files from the exact GA master without redrawing it.
- Checks local file references, page targets, duplicate IDs and JavaScript syntax where Node.js is available.
- Creates a safety backup before changing anything.

RUN THIS ONE
Double-click: RUN_FULL_REPAIR_AND_DEPLOY.bat

Leave VS Code and GitHub Desktop open. The black window will show every step. Do not close it until it says DONE or STOPPED.

A STOPPED result does not mean files were lost. The untouched originals are copied into a folder named _BACKUP_BEFORE_V36_date_time inside the repository.

The script only stages the named Dog Park repair files. It does not delete dog records, API keys, legal documents or unrelated project files.
