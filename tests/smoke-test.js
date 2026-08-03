const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');
const html = read('index.html');
const css = read('styles.css');
const app = read('app.js');
const repair = read('repair.js');
const config = read('config.js');
const worker = read('service-worker.js');
let passed = 0;

function check(condition, message) {
  if (!condition) throw new Error(`FAIL: ${message}`);
  passed += 1;
  console.log(`PASS ${passed}: ${message}`);
}

check(html.includes('data:image/png;base64,'), 'official embedded GA header artwork remains present');
check(html.includes('genevieve-safety-from-roots-locked-2026-07-29.jpeg'), 'official roots/journey artwork remains present');
check(html.includes('2026.08.03.46'), 'launch build marker is current');
check(html.includes('8 August 2026'), 'planned launch date is visible');
check(html.includes('id="today"') && html.includes('class="screen active"'), 'Today remains the initial active screen');
check(html.includes('id="journey"'), 'Journey screen remains present');
check(html.includes('id="park-search"'), 'Parks screen remains present');
check(html.includes('id="dog-list"'), 'Dogs screen remains present');
check(html.includes('id="membership"'), 'Membership screen remains present');
check(html.includes('id="emergencyCallConfirm"'), 'emergency confirmation slider remains present');
check((html.match(/class="nav-emergency-button emergency-hold-button"/g) || []).length === 1, 'one persistent global emergency control is rendered');
check(/<\/nav>\s*<aside[^>]+persistent-emergency-dock/.test(html), 'emergency control is outside the mobile navigation');
check(css.includes('.persistent-emergency-dock'), 'persistent emergency layout is styled');
check(/grid-template-columns:\s*repeat\(5,\s*minmax\(0,\s*1fr\)\)\s*!important/.test(css), 'mobile navigation keeps five equal page controls');
check(app.includes('setPointerCapture'), 'emergency hold uses pointer capture');
check(app.includes("'pointercancel'") && app.includes("'lostpointercapture'"), 'emergency hold cancels safely on interrupted input');
check(/setTimeout\(completeEmergencyHold,\s*3000\)/.test(app), 'three-second emergency hold timer remains wired');
check(app.includes("source?.id==='emergencyPageHoldButton'"), 'global help hold and protected Triple Zero hold use separate outcomes');
check(app.includes('emergency_services_hub_opened') && app.includes('serviceToggle.open=true'), 'global hold opens the complete emergency services hub');
check(app.includes("tel:000"), 'confirmation action targets Triple Zero dialler');
check(html.includes('id="useEmergencyLocation"') && html.includes('id="emergencyLocationStatus"'), 'nearby-service location controls are present');
check(repair.includes('navigator.geolocation.getCurrentPosition'), 'current location is requested only after user action');
check(repair.includes('emergencySearchLocation') && repair.includes('near ${location}'), 'nearby service links use current coordinates when allowed');
check(html.includes('24 hour emergency veterinarian') && html.includes('council pound lost found animals'), 'nearby emergency vet and pound searches are present');
check(html.includes('RSPCA animal shelter') && html.includes('wildlife rescue hospital'), 'RSPCA and wildlife help searches are present');
check(config.includes('A$14.99') && config.includes('A$10.49'), 'monthly prices are unchanged');
check(config.includes('A$119.99') && config.includes('A$83.99'), 'annual prices are unchanged');
check((config.match(/stripePaymentLink:""/g) || []).length === 4, 'all unverified web payment links remain intentionally blank');
check(app.includes('stripePaymentLink') && app.includes('not configured'), 'web checkout refuses missing payment links');
check(config.includes('supabaseUrl: ""') && config.includes('supabaseAnonKey: ""'), 'unconfigured backend is not represented as live');
check(worker.includes('genevieve-dog-parks-2026-08-03-v46-emergency-services'), 'service-worker cache is bumped');

const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
check(new Set(ids).size === ids.length, 'HTML IDs are unique');
const screenIds = new Set([...html.matchAll(/<section[^>]+class="[^"]*screen[^"]*"[^>]+id="([^"]+)"/g)].map((match) => match[1]));
check(screenIds.size >= 31, 'full set of production screens remains present');
for (const target of new Set([...html.matchAll(/data-go="([^"]+)"/g)].map((match) => match[1]))) {
  check(ids.includes(target), `navigation target exists: #${target}`);
}

for (const file of ['privacy-policy.html','terms-of-use.html','safety-disclaimer.html','subscription-terms.html','refund-cancellation-policy.html','concession-pricing-policy.html','account-deletion.html','community-guidelines.html','support.html','ip-notice.html']) {
  check(fs.existsSync(path.join(root, 'legal', file)), `legal/${file} exists`);
}

const refs = [...html.matchAll(/(?:src|href)="(\.\/(?!#)[^"?]+)(?:\?[^"#]*)?(?:#[^"]*)?"/g)].map((match) => match[1]);
for (const ref of refs) {
  const target = path.join(root, ref.replace(/^\.\//, ''));
  check(fs.existsSync(target), `referenced file exists: ${ref}`);
}

const cacheList = worker.slice(worker.indexOf('const ASSETS=['), worker.indexOf('];', worker.indexOf('const ASSETS=[')));
const cached = [...cacheList.matchAll(/'\.\/([^'?]+)(?:\?[^']*)?'/g)].map((match) => match[1]).filter(Boolean);
for (const ref of cached) {
  const target = path.join(root, ref);
  check(fs.existsSync(target), `offline cache file exists: ./${ref}`);
}

console.log(`\n${passed} smoke checks passed.`);
