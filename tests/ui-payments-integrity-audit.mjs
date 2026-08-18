import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');
const required=(p)=>{if(!fs.existsSync(path.join(root,p)))throw new Error(`Missing required file: ${p}`)};

for(const file of [
  'public/assets/genevieve-official-logo.jpeg',
  'public/assets/hazard-snake-wildlife.svg',
  'public/assets/hazard-council-infrastructure.svg',
  'public/assets/hazard-bait-poison.svg',
  'public/assets/hazard-altercation-incident.svg',
  'ui-enhancements.js',
  'ui-enhancements.css',
  'config.js',
  'docs/PROJECT_LOCK_2026-08-19.md'
]) required(file);

const app=read('app.js');
const stage5=read('stage5.js');
const ui=read('ui-enhancements.js');
const config=read('config.js');
const lock=read('docs/PROJECT_LOCK_2026-08-19.md');

if(!app.includes("const logoPath = '/assets/genevieve-official-logo.jpeg'")) throw new Error('Official logo is not locked into the app shell');
if(!stage5.includes("import('./ui-enhancements.js')")) throw new Error('Professional UI / Stripe enhancement layer is not linked from Stage 5');
for(const asset of ['hazard-snake-wildlife.svg','hazard-council-infrastructure.svg','hazard-bait-poison.svg','hazard-altercation-incident.svg']) if(!ui.includes(asset)) throw new Error(`Hazard asset is not linked: ${asset}`);
for(const glyph of ['🐍','🚧','🧪']) if(ui.includes(glyph)) throw new Error('Emoji hazard artwork reintroduced');
if(!config.includes('https://buy.stripe.com/3cI6oI3IadEnefWfQW1wY0h')) throw new Error('Standard Monthly verified Stripe link missing');
if(!config.includes('https://buy.stripe.com/5kQ7sMa6y7fZ4Fm48e1wY0d')) throw new Error('Concession Monthly verified Stripe link missing');
if(!/standardAnnual:\s*''/.test(config)||!/concessionAnnual:\s*''/.test(config)) throw new Error('Annual checkout must remain gated until exact Stripe objects are corrected');
if(/sk_(?:live|test)_/i.test(ui+config)) throw new Error('Stripe secret leaked into client code');
if(!ui.includes('A$119.99')||!ui.includes('A$83.00')) throw new Error('Approved annual prices are not preserved in the gated UI');
if(!lock.includes('Safety from roots to every journey.')||!lock.includes('12 API functions')) throw new Error('Project lock is incomplete');

const apiFiles=fs.readdirSync(path.join(root,'api')).filter(name=>name.endsWith('.js')).sort();
if(apiFiles.length!==12) throw new Error(`Expected exactly 12 Stage 1-5 API functions, found ${apiFiles.length}`);

console.log('UI / payments integrity audit PASS: official logo locked, four professional hazard assets linked without emoji artwork, two exact live Stripe monthly links connected, annual checkout safely gated, no client Stripe secret, and 12-function Stage 1-5 boundary preserved.');
