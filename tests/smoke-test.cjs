'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const vm = require('vm');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const failures = [];
let checks = 0;

function check(condition, message) {
  checks += 1;
  if (!condition) failures.push(message);
}

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}


function immediatePromise(value, error = null) {
  return {
    then(onFulfilled, onRejected) {
      try {
        if (error) {
          return typeof onRejected === 'function'
            ? immediatePromise(onRejected(error))
            : immediatePromise(undefined, error);
        }

        return typeof onFulfilled === 'function'
          ? immediatePromise(onFulfilled(value))
          : immediatePromise(value);
      } catch (nextError) {
        return immediatePromise(undefined, nextError);
      }
    },
    catch(onRejected) {
      return this.then(undefined, onRejected);
    }
  };
}

function extractBalancedBlock(source, startIndex) {
  const openingBrace = source.indexOf('{', startIndex);
  if (openingBrace === -1) return '';

  let depth = 0;
  let quote = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let index = openingBrace; index < source.length; index += 1) {
    const character = source[index];
    const nextCharacter = source[index + 1];

    if (lineComment) {
      if (character === '\n') lineComment = false;
      continue;
    }

    if (blockComment) {
      if (character === '*' && nextCharacter === '/') {
        blockComment = false;
        index += 1;
      }
      continue;
    }

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (character === '\\') {
        escaped = true;
      } else if (character === quote) {
        quote = null;
      }
      continue;
    }

    if (character === '/' && nextCharacter === '/') {
      lineComment = true;
      index += 1;
      continue;
    }

    if (character === '/' && nextCharacter === '*') {
      blockComment = true;
      index += 1;
      continue;
    }

    if (character === "'" || character === '"' || character === '`') {
      quote = character;
      continue;
    }

    if (character === '{') {
      depth += 1;
    } else if (character === '}') {
      depth -= 1;
      if (depth === 0) {
        return source.slice(startIndex, index + 1);
      }
    }
  }

  return '';
}

function testServiceWorkerRegistration(source) {
  const marker = "if ('serviceWorker' in navigator) {";
  const startIndex = source.lastIndexOf(marker);

  check(startIndex !== -1, 'Service worker registration block is missing from app.js');
  if (startIndex === -1) return;

  const registrationSource = extractBalancedBlock(source, startIndex);
  check(Boolean(registrationSource), 'Service worker registration block could not be isolated');
  if (!registrationSource) return;

  const windowListeners = new Map();
  const serviceWorkerListeners = new Map();
  const registrationListeners = new Map();
  const workerListeners = new Map();

  const registerCalls = [];
  let updateCalls = 0;
  let reloadCalls = 0;
  let confirmMessage = '';

  const installingWorker = {
    state: 'installing',
    addEventListener(type, listener) {
      workerListeners.set(type, listener);
    }
  };

  const registration = {
    installing: installingWorker,
    addEventListener(type, listener) {
      registrationListeners.set(type, listener);
    },
    update() {
      updateCalls += 1;
      return immediatePromise();
    }
  };

  const serviceWorker = {
    controller: {},
    addEventListener(type, listener) {
      serviceWorkerListeners.set(type, listener);
    },
    register(scriptURL, options) {
      registerCalls.push({ scriptURL, options });
      return immediatePromise(registration);
    }
  };

  const mockWindow = {
    addEventListener(type, listener) {
      windowListeners.set(type, listener);
    },
    confirm(message) {
      confirmMessage = message;
      return true;
    },
    location: {
      reload() {
        reloadCalls += 1;
      }
    }
  };

  const context = vm.createContext({
    window: mockWindow,
    navigator: { serviceWorker },
    console
  });

  try {
    new vm.Script(registrationSource, {
      filename: 'app-service-worker-registration.js'
    }).runInContext(context);
    check(true, 'Service worker registration executes in a headless mock');
  } catch (error) {
    check(false, `Service worker registration failed in headless mock: ${error.message}`);
    return;
  }

  check(windowListeners.has('load'), 'Service worker registration is not deferred until window load');
  windowListeners.get('load')?.();

  check(registerCalls.length === 1, 'Service worker was not registered exactly once');
  check(registerCalls[0]?.scriptURL === '/service-worker.js', 'Service worker registration path is not /service-worker.js');
  check(registerCalls[0]?.options?.scope === '/', 'Service worker registration scope is not /');
  check(updateCalls === 1, 'Service worker update check was not requested');
  check(serviceWorkerListeners.has('controllerchange'), 'controllerchange update listener is missing');
  check(registrationListeners.has('updatefound'), 'updatefound listener is missing');

  registrationListeners.get('updatefound')?.();
  check(workerListeners.has('statechange'), 'Installing worker statechange listener is missing');

  installingWorker.state = 'installed';
  workerListeners.get('statechange')?.();

  check(/V52/i.test(confirmMessage), 'The V52 reload prompt is missing');
  check(reloadCalls === 0, 'Page reloaded before controllerchange');

  serviceWorkerListeners.get('controllerchange')?.();
  check(reloadCalls === 1, 'Page did not reload after approved controllerchange');

  serviceWorkerListeners.get('controllerchange')?.();
  check(reloadCalls === 1, 'Page reloaded more than once after controllerchange');

  let unsupportedLoadRegistrations = 0;
  const unsupportedContext = vm.createContext({
    navigator: {},
    window: {
      addEventListener() {
        unsupportedLoadRegistrations += 1;
      }
    },
    console
  });

  try {
    new vm.Script(registrationSource, {
      filename: 'app-service-worker-unsupported.js'
    }).runInContext(unsupportedContext);
    check(unsupportedLoadRegistrations === 0, 'Unsupported headless environment attempted service worker registration');
  } catch (error) {
    check(false, `Unsupported headless environment was not safely ignored: ${error.message}`);
  }
}


function testAccessibleFieldErrors(indexSource, appSource, styleSource) {
  check(appSource.includes('installAccessibleFormValidation()'), 'Accessible form validation installer is missing');
  check(appSource.includes("field.setAttribute('aria-invalid', 'true')"), 'aria-invalid is not applied to invalid fields');
  check(appSource.includes("field.setAttribute('aria-errormessage', id)"), 'aria-errormessage is not linked to field errors');
  check(appSource.includes('applied[0].focus({ preventScroll: false })'), 'First invalid field is not focused');
  check(appSource.includes("form.addEventListener('input', clearCorrectedError)"), 'Stale field errors are not cleared on correction');
  check(appSource.includes("form.addEventListener('change', clearCorrectedError)"), 'Stale select or checkbox errors are not cleared after correction');
  check(styleSource.includes('[aria-invalid="true"]'), 'Visible invalid-field styling is missing');
  check(styleSource.includes('.field-error'), 'Field-level error styling is missing');

  const arrivalIds = indexSource.match(/id="arrivalResult"/g) || [];
  check(arrivalIds.length === 1, 'arrivalResult must have exactly one unique ID');
  check(/id="compatForm"[\s\S]*?name="first"[^>]*required[\s\S]*?name="second"[^>]*required/.test(indexSource), 'Compatibility dog fields are not required');
  check(/id="bestMateForm"[\s\S]*?name="first"[^>]*required[\s\S]*?name="second"[^>]*required[\s\S]*?name="park"[^>]*required/.test(indexSource), 'Best-mate fields are not required');
}

const required = [
  'index.html', 'styles.css', 'config.js', 'app-logic.js', 'storage-adapter.js', 'app.js',
  'service-worker.js', 'manifest.webmanifest', 'vercel.json', 'package.json',
  'assets/ga-logo-192.png', 'assets/ga-logo-512.png', 'assets/apple-touch-icon.png',
  'assets/favicon-64.png', 'assets/genevieve-roots.jpg',
  'legal/index.html', 'legal/privacy-policy.html', 'legal/terms-of-use.html',
  'legal/safety-disclaimer.html', 'legal/subscription-terms.html',
  'legal/refund-cancellation-policy.html', 'legal/concession-policy.html',
  'legal/community-guidelines.html', 'legal/account-deletion.html',
  'legal/support.html', 'legal/ip-notice.html',
  'backend-client.js', '.env.example',
  'api/health.js', 'api/state.js', 'api/checkins.js', 'api/checkins/[id].js',
  'api/auth/register.js', 'api/auth/login.js', 'api/auth/logout.js', 'api/auth/me.js',
  'api/admin/metrics.js', 'api/internal/maintenance.js', 'api/parks/[id]/occupancy.js',
  'api/_lib/config.js', 'api/_lib/db.js', 'api/_lib/auth.js', 'api/_lib/crypto.js',
  'api/_lib/http.js', 'api/_lib/validation.js', 'api/_lib/idempotency.js',
  'api/_lib/rate-limit.js', 'api/_lib/audit.js', 'api/_lib/handler.js',
  'db/migrations/001_backend_infrastructure.sql', 'db/migrations/002_row_security.sql',
  'db/migrations/003_operational_views.sql', 'scripts/migrate.mjs',
  'scripts/grant-runtime.mjs', 'scripts/verify-audit.mjs', 'scripts/encrypt-backup.mjs',
  'scripts/backup.sh', 'scripts/verify-backup.sh', 'docs/BACKEND_DEPLOYMENT.md',
  'docs/ITEMS_140_152_IMPLEMENTATION.md', 'V52_BACKEND_PATCH_TEST_REPORT.md',
  '.github/workflows/v52-ci-security.yml', '.github/dependabot.yml', 'tests/storage-adapter-test.mjs'
];

for (const file of required) {
  const full = path.join(root, file);
  check(fs.existsSync(full) && fs.statSync(full).size > 0, `Missing or empty: ${file}`);
}

for (const file of ['manifest.webmanifest', 'vercel.json', 'package.json']) {
  try {
    JSON.parse(read(file));
    check(true, `Valid JSON: ${file}`);
  } catch (error) {
    check(false, `Invalid JSON: ${file}: ${error.message}`);
  }
}

const assetHashes = {
  'assets/ga-logo-192.png': '04f7ed571ba98335720b8fe1268061925c76e07b9565d05402e4c5ed33bbee90',
  'assets/ga-logo-512.png': '80a7a6770a5acef55803ade6c2fa3ac8925014729445e83157d26e66b043aa49',
  'assets/apple-touch-icon.png': 'e4d8409575bbab8e6bb76d3f706a96d17d32c08e94a2e66485dec695fe60f2fd',
  'assets/favicon-64.png': 'c2af08cc366686ebf4f89b264004112a1ffa1abed59ed380eda83a04edd148aa',
  'assets/genevieve-roots.jpg': 'c66a713a9ca6cf05f0af361923c3f17698b9b80bf79c8fb458400cc7ea82e1a6'
};

for (const [file, expected] of Object.entries(assetHashes)) {
  const actual = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex');
  check(actual === expected, `Official asset changed unexpectedly: ${file}`);
}

const html = read('index.html');
const css = read('styles.css');
const app = read('app.js');
const logic = read('app-logic.js');
const storageAdapter = read('storage-adapter.js');
const worker = read('service-worker.js');
const vercel = read('vercel.json');
const config = read('config.js');

for (const file of [
  'app.js', 'app-logic.js', 'storage-adapter.js', 'backend-client.js', 'config.js', 'service-worker.js',
  'api/health.js', 'api/state.js', 'api/checkins.js', 'api/checkins/[id].js',
  'api/auth/register.js', 'api/auth/login.js', 'api/auth/logout.js', 'api/auth/me.js',
  'api/admin/metrics.js', 'api/internal/maintenance.js', 'api/parks/[id]/occupancy.js',
  'api/_lib/config.js', 'api/_lib/db.js', 'api/_lib/auth.js', 'api/_lib/crypto.js',
  'api/_lib/http.js', 'api/_lib/validation.js', 'api/_lib/idempotency.js',
  'api/_lib/rate-limit.js', 'api/_lib/audit.js', 'api/_lib/handler.js',
  'scripts/migrate.mjs', 'scripts/grant-runtime.mjs', 'scripts/verify-audit.mjs',
  'scripts/encrypt-backup.mjs'
]) {
  const result = spawnSync(process.execPath, ['--check', path.join(root, file)], { encoding: 'utf8' });
  check(result.status === 0, `Invalid JavaScript: ${file}: ${(result.stderr || result.stdout || '').trim()}`);
}


const backendConfig = read('api/_lib/config.js');
const backendDb = read('api/_lib/db.js');
const backendAuth = read('api/_lib/auth.js');
const backendCrypto = read('api/_lib/crypto.js');
const backendHttp = read('api/_lib/http.js');
const backendState = read('api/state.js');
const backendCheckins = read('api/checkins.js');
const backendAudit = read('api/_lib/audit.js');
const migration1 = read('db/migrations/001_backend_infrastructure.sql');
const migration2 = read('db/migrations/002_row_security.sql');
const migration3 = read('db/migrations/003_operational_views.sql');
check(app.includes("from './backend-client.js'") && html.includes('id="accountPanel"'), 'Secure account client integration missing');
check(backendConfig.includes('REQUIRED_PRODUCTION_KEYS') && backendConfig.includes('CRON_SECRET'), 'Production secret validation missing');
check(backendDb.includes('assertRuntimeDatabaseSafety') && backendDb.includes('rolbypassrls') && backendDb.includes('owns_protected_table'), 'Unsafe runtime database role rejection missing');

check(backendConfig.includes("process.env.DATABASE_RUNTIME_URL || process.env.DATABASE_URL"), 'Restricted DATABASE_RUNTIME_URL precedence missing');
check(backendAuth.includes('HttpOnly') || backendAuth.includes('httpOnly: true'), 'HttpOnly session cookie missing');
check(backendCrypto.includes("createCipheriv('aes-256-gcm'") && backendCrypto.includes('scrypt'), 'Required state encryption or password hashing missing');
check(backendHttp.includes('unsafe_json_key') && backendHttp.includes('payload_too_large'), 'Safe JSON/body limit controls missing');
check(backendState.includes("isolationLevel: 'SERIALIZABLE'") && backendState.includes('expectedRevision'), 'Atomic state revision control missing');
check(backendCheckins.includes('runIdempotent') && backendCheckins.includes("isolationLevel: 'SERIALIZABLE'"), 'Check-in idempotency or serializable transaction missing');
check(backendAudit.includes('pg_advisory_xact_lock') && migration1.includes('audit_events_no_update'), 'Append-only serialized audit controls missing');
check(migration1.includes('checkins_one_active_dog_idx') && migration1.includes('idempotency_keys') && migration1.includes('api_rate_limits'), 'Database concurrency infrastructure missing');
check(migration2.includes('ENABLE ROW LEVEL SECURITY') && migration2.includes('app_current_user_id'), 'PostgreSQL row-level ownership policy missing');
check(migration3.includes('SECURITY DEFINER') && migration3.includes('get_park_live_occupancy'), 'Privacy-preserving aggregate functions missing');
check(read('scripts/backup.sh').includes('encrypt-backup.mjs') && read('scripts/verify-backup.sh').includes('pg_restore --list'), 'Encrypted backup verification path missing');

const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
check(ids.length === new Set(ids).size, 'Duplicate HTML id found');

const selectorIds = [...app.matchAll(/\$\('#([^']+)'\)/g)].map(match => match[1]);
for (const id of new Set(selectorIds)) check(ids.includes(id), `app.js references missing id: ${id}`);

const localReferences = [...html.matchAll(/(?:src|href)="(\.\/[^"?#]+)(?:[?#][^"]*)?"/g)].map(match => match[1]);
for (const reference of new Set(localReferences)) {
  const relative = reference.replace(/^\.\//, '');
  check(fs.existsSync(path.join(root, relative)), `Broken local reference in index.html: ${reference}`);
}

const navOrder = [...html.matchAll(/class="nav-button[^>]*data-screen="([^"]+)"/g)].map(match => match[1]);
check(JSON.stringify(navOrder) === JSON.stringify(['today', 'journey', 'parks', 'dogs', 'more']), 'Main navigation order is not Today, Journey, Parks, Dogs, More');
check(html.indexOf('data-screen="more"') < html.indexOf('id="emergencyHold"'), 'Emergency is not immediately after More');
check(css.includes('position: fixed') && css.includes('grid-template-columns: repeat(5, minmax(0, 1fr)) minmax(0, 2fr)'), 'Stationary 5 + double-width Emergency navigation layout missing');
check(app.includes("setTimeout(openEmergencyDialog, 3000)"), 'Three-second Emergency hold changed or is missing');
check(html.includes('id="emergencySlider"') && app.includes("window.location.href = 'tel:000'"), 'Separate final Emergency slide/dialler control missing');
check(html.includes('aria-labelledby="emergencyDialogTitle"') && app.includes('installDialogFocusTrap'), 'Emergency dialog labelling or focus trap missing');
check(app.includes("event.type === 'keydown'") && app.includes("['Enter', ' ']"), 'Keyboard emergency hold support missing');
check(!app.includes('localStorage') && !app.includes('indexedDB'), 'Storage side effects leaked back into app.js');
check(storageAdapter.includes('window.localStorage') && storageAdapter.includes('window.indexedDB'), 'Storage adapter is incomplete');
check(storageAdapter.includes('stateBackupKey') && storageAdapter.includes('_backup'), 'Corrupt-primary local state recovery is missing');
check(logic.includes('export {') && !logic.includes('globalThis') && !logic.includes('GenevieveLogic'), 'Pure logic module export is polluted or missing');
check(app.includes('safeText') && app.includes('safeUrl'), 'Required rendering sanitizers missing');
check(!logic.includes('Date.now(') && !logic.includes('Math.random('), 'Pure logic contains non-deterministic clock or random access');
check(app.includes('GL.calculateDogProfileRisk') && app.includes('GL.findBestMateCheckin'), 'Profile or relationship domain logic leaked into app.js');
check(css.includes('max-height: 90dvh') && css.includes('overscroll-behavior: contain'), 'Emergency dialog mobile overflow protection missing');
check(html.includes('id="globalLiveRegion"') && html.includes('id="emergencyLiveRegion"'), 'Persistent ARIA live regions missing');
check(!app.includes("newWorker.state === 'activated'"), 'Impossible nested service-worker activation branch remains');

const today = html.slice(html.indexOf('id="screen-today"'), html.indexOf('id="screen-journey"'));
const journey = html.slice(html.indexOf('id="screen-journey"'), html.indexOf('id="screen-parks"'));
const more = html.slice(html.indexOf('id="screen-more"'), html.indexOf('</main>'));
check(today.includes('id="todayParkQuery"') && today.includes('Is this dog park suitable for my dog right now?'), 'Today typed park-suitability decision is missing');
check(!today.includes('id="supervisionButton"'), 'Owner supervision is still incorrectly on Today');
check(journey.includes('id="owner-supervision"') && journey.includes('id="supervisionButton"'), 'Owner supervision is not on Journey');
check(more.includes('id="implementation-evidence"'), 'Implementation evidence is not on the More/back page');
check(more.includes('Ownership and IP boundary') && more.includes('Maintenance responsibility') && more.includes('Important safety boundary'), 'Ownership, maintenance or safety boundary is missing from the More/back page');
check(more.includes('id="evidenceForm"') && more.includes('name="attachment"'), 'Dated evidence form or attachment control missing');

check(html.includes('1–3') && html.includes('8–10') && !html.includes('0–24'), 'Risk display is not the locked 1 green to 10 red scale');
check(app.includes('GL.calculateParkSuitability') && app.includes('GL.calculateHeatRisk') && app.includes('GL.calculateCompatibilityRisk'), 'Shared 1–10 risk logic is not used across core checks');
check(!html.includes('name="breaks"'), 'Trip form still asks the person to guess a dog-break interval');
check(app.includes('GL.dogBreakIntervalMinutes') && app.includes('GL.requiredBreakStops'), 'Automatic dog-break calculation is missing');
check(html.includes('id="tripList"') && app.includes('renderTrips()'), 'Saved trips are missing');
check(html.includes('© OpenStreetMap contributors') && app.includes('nominatim.openstreetmap.org') && app.includes('router.project-osrm.org'), 'Australia-wide live place/route support or attribution is missing');
check(app.includes("document.documentElement.style.scrollBehavior = 'auto'") && app.includes('window.scrollTo(0, 0)'), 'Main pages are not explicitly forced to the top without smooth-scroll drift');
check(html.includes('data-persist') && app.includes('installFormPersistence()'), 'Form-draft persistence is missing');
check(html.includes('id="myDogArrived"') && html.includes('id="myDogLeft"') && html.includes('id="bestMateAlert"'), 'Obvious arrival/leave/best-mate controls are missing');

for (const price of ['A$14.99/month', 'A$10.49/month', 'A$119.99/year', 'A$83.99/year']) check(html.includes(price), `Approved price missing: ${price}`);
check(!/(?:^|[^A-Za-z0-9])(?:sk_(?:live|test)_|rk_live_|whsec_)/i.test([...required.filter(file => !/\.(png|jpg)$/.test(file)).map(read), app, logic, storageAdapter, config].join('\n')), 'Secret-looking payment credential found in deployment source');
check(config.includes("standardMonthly: ''") && app.includes('Checkout is not connected in this ZIP'), 'Safe payment launch gate missing');

check(worker.includes("const CACHE_NAME = 'dogpark-app-v52-green-gold-repair-20260805-1';"), 'Green/gold repair cache name missing');

for (const file of [
  "'/'",
  "'/index.html'",
  "'/404.html'",
  "'/styles.css'",
  "'/app.js'",
  "'/app-logic.js'",
  "'/storage-adapter.js'",
  "'/backend-client.js'",
  "'/config.js'",
  "'/manifest.webmanifest'",
  "'/assets/favicon-64.png'",
  "'/assets/ga-logo-192.png'",
  "'/assets/ga-logo-512.png'",
  "'/assets/apple-touch-icon.png'",
  "'/assets/genevieve-roots.jpg'"
]) {
  check(worker.includes(file), `Offline core cache omits ${file}`);
}

check(worker.includes("const OWNED_CACHE_PREFIXES = ['dogpark-app-', 'genevieve-dog-parks-'];"), 'Targeted legacy-cache prefixes are missing');
check(worker.includes('CORE_URLS.has(url.href)'), 'Core cache-first routing is missing');
check(worker.includes("event.request.mode === 'navigate'"), 'Navigation fallback routing is missing');
check(worker.includes('ignoreSearch: true'), 'Exact offline page matching is missing');
check(worker.includes("hasExtension ? '/404.html' : '/index.html'"), 'Offline 404/index fallback selection is missing');
check(worker.includes("event.request.headers.has('range')"), 'Range-request bypass is missing');
check(!worker.includes('?v='), 'Service worker contains prohibited version query strings');
check(!worker.includes("cache: 'no-store'"), 'Service worker contains prohibited no-store fetch options');
check(!worker.includes('navigationPreload'), 'Service worker contains prohibited navigation preload logic');

check(/id="heatResult"[^>]*role="status"[^>]*aria-atomic="true"/.test(html), 'Heat result status semantics are incomplete');
check(app.includes('fetchJson(url, 8000)'), 'OSRM route timeout is not bounded to the repair value');

testAccessibleFieldErrors(html, app, css);
testServiceWorkerRegistration(app);

check(vercel.includes('Content-Security-Policy') && vercel.includes('Permissions-Policy') && vercel.includes('no-store, max-age=0, must-revalidate'), 'Security or stale-service-worker headers missing');

const unwanted = [];
function walk(directory, relative = '') {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const next = path.join(relative, entry.name);
    if (/node_modules|\.vercel|legacy|repair-copy|old-build/i.test(next) || /\.zip$/i.test(next)) unwanted.push(next);
    if (entry.isDirectory()) walk(path.join(directory, entry.name), next);
  }
}
walk(root);
check(unwanted.length === 0, `Unwanted nested deployable or legacy files found: ${unwanted.join(', ')}`);

if (failures.length) {
  console.error(`GENEVIEVE Dog Parks V52 smoke test FAILED (${failures.length}/${checks})`);
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`GENEVIEVE Dog Parks V52 smoke test PASSED (${checks}/${checks} checks)`);
