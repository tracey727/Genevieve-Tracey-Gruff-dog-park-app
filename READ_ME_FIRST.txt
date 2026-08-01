GENEVIEVE App™ DOG PARK
CORRECT REPOSITORY CONSOLIDATION TOOL

CORRECT REPOSITORY
tracey727/Genevieve-Tracey-Gruff-dog-park-app

DO NOT USE
tracey727/Genevieve-Animals-Dog-Parks-App
V37, V39 or V40 repair ZIPs as the master

WHAT THIS TOOL DOES
1. Finds or asks you to select the correct current repository folder.
2. Refuses the old similarly named repository.
3. Verifies the GitHub remote when Git is available.
4. Creates a complete safety-backup ZIP first.
5. Builds a separate clean V35 production repository copy.
6. Keeps the live production root, referenced files, approved assets, legal pages and GitHub workflows.
7. Leaves old nested deployment folders and one-off repair launchers out of the clean copy.
8. Aligns the install-manifest identifier with the current service-worker build in the COPY only.
9. Checks every file listed by the service worker.
10. scans the clean copy for exposed Stripe secrets, webhook secrets, Google API keys and private keys.
11. Produces a clean deployable ZIP, SHA-256 checksum, file manifest and consolidation report.

SAFETY
- The original repository is never deleted or overwritten.
- No automatic GitHub push or Vercel deployment occurs.
- The output is placed on your Desktop inside:
  GENEVIEVE_DOG_PARK_CONSOLIDATED_OUTPUT

HOW TO RUN IT
1. Extract this tool ZIP.
2. Double-click RUN_REPOSITORY_CONSOLIDATION.bat.
3. When a folder selector appears, choose only:
   Genevieve-Tracey-Gruff-dog-park-app
4. Let the tool finish. It opens the finished Desktop folder automatically.

WHAT TO SEND BACK TO GENEVIEVE
Send or upload CON​​SOLIDATION_REPORT.txt from the finished RUN folder. The report contains no secret key values.

IMPORTANT
The clean ZIP is not automatically pushed because this ChatGPT session has no authenticated GitHub write connection. After the report is checked, the clean master can be committed through GitHub Desktop to the existing correct repository and deployed to a Vercel Preview.
