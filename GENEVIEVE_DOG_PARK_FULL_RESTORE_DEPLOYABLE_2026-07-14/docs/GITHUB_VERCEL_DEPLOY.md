# GitHub and Vercel Deployment Instructions

## Before uploading

- Extract the ZIP.
- Open the extracted folder and confirm `index.html` is visible immediately.
- Do not upload the unopened ZIP as the only repository file.
- Do not put the whole project inside an extra nested folder.

Correct repository root:

```
index.html
styles.css
logic.js
app.js
config.js
backend.js
native-billing-bridge.js
manifest.webmanifest
service-worker.js
vercel.json
404.html
assets/
legal/
docs/
store/
tests/
.github/
```

## GitHub

1. Create a new repository.
2. Add/upload all extracted files and folders.
3. Commit to the `main` branch.
4. Check that `.github/workflows/pages.yml` exists.
5. Optional backup deployment: Settings → Pages → GitHub Actions.

## Vercel

1. Import the GitHub repository.
2. Framework preset: Other.
3. Root directory: `./`.
4. Build command: leave blank.
5. Install command: leave blank.
6. Output directory: leave blank.
7. Deploy.

## After deployment

Test:

- `/`
- `/legal/privacy-policy.html`
- `/legal/terms-of-use.html`
- `/legal/support.html`
- `/legal/account-deletion.html`
- `/404.html`

Run the app’s **More → Launch Check** screen.

## Updating later

1. Change the files locally.
2. Commit/push to the `main` branch.
3. Vercel automatically creates a new production deployment.
4. Use a Vercel preview deployment for risky changes before promoting them.
