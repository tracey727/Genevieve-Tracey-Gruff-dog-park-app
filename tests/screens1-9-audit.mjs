import fs from 'node:fs';

const html = fs.readFileSync('index.html', 'utf8');
const js = fs.readFileSync('app.js', 'utf8');
const failures = [];
const expected = ['today','journey','dog','handler','emergency','hazards','travel','supervision','community'];

const screenMatches = [...html.matchAll(/<section\b[^>]*\bdata-screen="([^"]+)"/g)].map(match => match[1]);
if (screenMatches.length !== 9) failures.push(`Expected exactly 9 screen sections, found ${screenMatches.length}`);
if (new Set(screenMatches).size !== 9) failures.push('Screen identifiers are not unique');
if (screenMatches.join('|') !== expected.join('|')) failures.push(`Screen order/identity mismatch: ${screenMatches.join(', ')}`);

const runtimeNav = [...js.matchAll(/data-screen-target="([^"]+)"/g)].map(match => match[1]);
if (runtimeNav.length !== 9) failures.push(`Expected exactly 9 runtime navigation toggles, found ${runtimeNav.length}`);
if (new Set(runtimeNav).size !== 9) failures.push('Runtime navigation contains duplicate targets');
for (const screen of expected) {
  if (!runtimeNav.includes(screen)) failures.push(`Navigation toggle missing target ${screen}`);
}

const internalTargets = [...html.matchAll(/data-open-screen="([^"]+)"/g)].map(match => match[1]);
for (const target of internalTargets) {
  if (!expected.includes(target)) failures.push(`Internal screen link points to missing screen ${target}`);
}

if (!js.includes("const target = screens.find(screen => screen.dataset.screen === name) ?? screens[0];")) failures.push('Router target fallback missing');
if (!js.includes("history.replaceState(null, '', `#${targetName}`)")) failures.push('Router URL state update missing');
if (!js.includes("button.addEventListener('click', () => showScreen(button.dataset.screenTarget))")) failures.push('Navigation click linkage missing');
if (!js.includes("button.addEventListener('click', () => showScreen(button.dataset.openScreen))")) failures.push('Internal screen-link click linkage missing');

const emergencyCount = (html.match(/class="emergency-wrap"/g) || []).length;
if (emergencyCount !== 1) failures.push(`Expected one emergency control shell, found ${emergencyCount}`);
if (!js.includes("const today = document.querySelector('[data-screen=\"today\"]');")) failures.push('Screen 1 emergency ownership lookup missing');
if (!js.includes("heading.insertAdjacentElement('afterend', emergencyWrap)")) failures.push('Emergency control is not moved into Screen 1 at runtime');
if (!js.includes("emergencyWrap.dataset.screenOneOnly = 'true'")) failures.push('Screen 1 emergency-only marker missing');

if (!js.includes('setTimeout(armEmergency, 3000)')) failures.push('Emergency three-second hold gate missing');
if (!js.includes("type=\"range\" min=\"0\" max=\"100\"")) failures.push('Emergency slide control missing');
if (!js.includes('Number(emergencySlider.value) >= 95')) failures.push('Emergency slide completion threshold missing');
if (!js.includes('dialog?.showModal()')) failures.push('Protected emergency dialog open action missing');
if (!js.includes("if (destination && destination !== 'today') resetEmergencyControl();")) failures.push('Emergency gesture is not disarmed when leaving Screen 1');
if (!html.includes('tel:000')) failures.push('Call 000 action missing from emergency assistance');
if (!html.includes('does not dispatch help or transmit your location')) failures.push('Emergency non-dispatch boundary missing');

if (!js.includes('Accessibility & communication')) failures.push('Accessibility section missing');
if (!js.includes('Deaf / Auslan communication')) failures.push('Deaf / Auslan section missing');

if (failures.length) {
  console.error(`Screens 1–9 audit FAILED (${failures.length})`);
  failures.forEach(item => console.error(`- ${item}`));
  process.exit(1);
}

console.log(`Screens 1–9 audit PASS: 9 unique screens, 9 linked navigation toggles, ${internalTargets.length} valid internal links, Screen 1-only emergency control, 3-second hold + slide gate, and accessibility/Deaf section preserved.`);
