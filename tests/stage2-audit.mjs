import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const failures = [];

const required = [
  'index.html',
  'styles.css',
  'app.js',
  'api/health.js',
  'sw.js',
  'vercel.json',
  'docs/STAGE1_STRUCTURE.md',
  'docs/STAGE2_BUILD_PLAN.md',
  'tests/audit.mjs'
];
for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) failures.push(`Missing ${file}`);
}

const html = read('index.html');
const css = read('styles.css');
const js = read('app.js');
const health = read('api/health.js');
const sw = read('sw.js');
const vercel = read('vercel.json');
const stage1Audit = read('tests/audit.mjs');
const combined = [html, css, js, health, sw, vercel, stage1Audit].join('\n');

const screens = ['today','journey','dog','handler','emergency','hazards','travel','supervision','community'];
let previousIndex = -1;
for (const screen of screens) {
  const marker = `data-screen="${screen}"`;
  const currentIndex = html.indexOf(marker);
  if (currentIndex < 0) failures.push(`Missing screen ${screen}`);
  if (currentIndex >= 0 && currentIndex <= previousIndex) failures.push(`Screen order broken at ${screen}`);
  previousIndex = currentIndex;
}

const screenTitles = [
  'Today',
  'Journey & Status',
  'Create Your Mate’s Profile',
  'Handler Profile & Security',
  'Emergency Assistance Overlay',
  'Report a Local Hazard or Wildlife Sighting',
  'Grey Nomad Highway & Veterinary Router',
  'Active Supervision & Boundary Guard',
  'Community Code of Conduct & Etiquette'
];
for (const title of screenTitles) if (!html.includes(title)) failures.push(`Missing Stage 1 component title: ${title}`);

if (!html.includes('Dog Park Stage 2')) failures.push('Stage 2 page identity missing');
if (!html.includes('STAGE 2 · UX/UI')) failures.push('Stage 2 visual stage badge missing');
if (!html.includes('Hold 3 seconds')) failures.push('Emergency hold instruction missing');
if (!js.includes('3000')) failures.push('Three-second emergency hold timing missing');
if (!html.includes('not</strong> transmitted your location')) failures.push('Emergency non-dispatch boundary missing');
if (!html.includes('does not dispatch help or transmit your location')) failures.push('Emergency pre-open boundary missing');
if (!html.includes('tel:000')) failures.push('Call 000 action missing');
if (!html.includes('UNKNOWN')) failures.push('Unknown-state treatment missing');
if (!html.includes('No coordinates are collected')) failures.push('No-location-capture boundary missing');

if (!css.includes('--green: #1B4D2B')) failures.push('Locked dark green token missing');
if (!css.includes('--gold: #C9A227')) failures.push('Locked gold token missing');
if (!css.includes('min-width: 320px')) failures.push('320px mobile floor missing');
if (!css.includes('safe-area-inset-bottom')) failures.push('Mobile safe-area handling missing');
if (!css.includes(':focus-visible')) failures.push('Keyboard focus treatment missing');
if (!css.includes('prefers-reduced-motion')) failures.push('Reduced-motion support missing');
if (!css.includes('.bottom-nav')) failures.push('Bottom navigation styling missing');
if (!css.includes('.emergency-hold')) failures.push('Emergency control styling missing');

if (!js.includes("serviceWorker.register('/sw.js')")) failures.push('Service worker registration missing');
if (!js.includes('history.replaceState')) failures.push('Screen URL state handling missing');
if (!health.includes('process.env.DATABASE_URL')) failures.push('Server-only DATABASE_URL binding missing');
if (health.includes('NEXT_PUBLIC_DATABASE_URL')) failures.push('Database URL would be client exposed');
if (!stage1Audit.includes('Stage 1 audit PASS')) failures.push('Stage 1 compatibility audit missing');

if (/postgres(?:ql)?:\/\/[^\s"']+:[^\s"']+@/i.test(combined)) failures.push('Possible database credential committed');
if (/sk_(live|test)_[A-Za-z0-9]/.test(combined)) failures.push('Possible Stripe credential committed');
if (/BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY/.test(combined)) failures.push('Private key committed');

if (failures.length) {
  console.error(`Stage 2 audit FAILED (${failures.length})`);
  failures.forEach(item => console.error(`- ${item}`));
  process.exit(1);
}

console.log(`Stage 2 audit PASS: ${screens.length} screens preserved in chronological order, Stage 1 safety boundaries retained, premium responsive UI tokens present, and secret scan clean.`);
