GENEVIEVE APP™ — GITHUB ACTIONS DEPLOYMENT
==========================================

THIS PACKAGE IS BUILT FOR GITHUB PAGES USING GITHUB ACTIONS.
There is no npm install and no Vercel build command.

IMPORTANT: EXTRACT THE ZIP FIRST.
Upload the CONTENTS inside the extracted folder to the TOP LEVEL of the repository.
Do not upload only the ZIP file and do not place everything inside another folder.

At the top level of the repository you must be able to see:
- index.html
- app.js
- styles.css
- privacy.html
- terms.html
- safety.html
- community.html
- assets folder
- .github folder
- .nojekyll file

GITHUB STEPS
------------
1. Open the new repository.
2. Choose Add file > Upload files.
3. Drag in ALL extracted contents together, including the hidden .github folder.
   On Windows, extracting the ZIP normally keeps this folder.
4. Commit the files to the main branch.
5. Open repository Settings > Pages.
6. Under Build and deployment, set Source to GitHub Actions.
7. Open the Actions tab.
8. Open "Deploy GENEVIEVE App to GitHub Pages".
9. The workflow must show a green tick for both jobs:
   - Validate and package site
   - Deploy site
10. The live address appears inside the completed deploy job and in Settings > Pages.

WHY THE EARLIER PACKAGE FAILED
------------------------------
The previous package did not contain a .github/workflows deployment file. A new
repository therefore had no GitHub Actions instructions to publish the static app.
This package includes the workflow and checks every essential file before deployment.

DO NOT SELECT "Deploy from a branch" FOR THIS PACKAGE.
Select "GitHub Actions" as the Pages source.

FINAL APPROVED VISUAL UPDATE
----------------------------
This build includes the supplied GA logo and roots/infinity tree logo. The full
bottom navigation bar is green, and every navigation icon and page label is white.
Tracey's photographs and Mr Gruff's avatar/profile photographs are preserved.
