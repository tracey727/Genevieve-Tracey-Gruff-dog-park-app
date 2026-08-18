import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const html = read('index.html');
const js = read('src/prestige-nav-enhancement.js');
const css = read('src/prestige-nav-enhancement.css');
const hazardCss = read('src/hazard-photo-cards.css');
const serviceWorker = read('public/sw.js');

test('prestige navigation enhancement is loaded after the app and payment layer', () => {
  assert.match(html, /src\/main\.jsx/);
  assert.match(html, /src\/payment-layer\.js/);
  assert.match(html, /src\/prestige-nav-enhancement\.js/);
  assert.ok(html.indexOf('prestige-nav-enhancement.js') > html.indexOf('payment-layer.js'));
});

test('mobile dock uses four primary destinations plus More instead of nine squeezed tabs', () => {
  for (const label of ['Today', 'Journey', 'Mate', 'Hazard']) assert.ok(js.includes(`label: '${label}'`));
  assert.match(js, /genevieve-more-tab/);
  assert.match(css, /grid-template-columns: repeat\(5/);
  assert.match(css, /nav-secondary \{ display: none/);
});

test('secondary destinations remain reachable from More with clear descriptions', () => {
  for (const label of ['Handler', 'Emergency', 'Travel', 'Guard', 'Conduct']) assert.ok(js.includes(`label: '${label}'`));
  assert.match(js, /genevieve-more-choice/);
});

test('screen changes aggressively reset every likely scroll container to top', () => {
  assert.match(js, /document\.scrollingElement/);
  assert.match(js, /window\.scrollTo\(\{ top: 0, left: 0, behavior: 'auto' \}\)/);
  assert.match(js, /scrollIntoView/);
  assert.match(js, /setTimeout\(hardResetToTop, 180\)/);
  assert.match(js, /screenSignature/);
  assert.match(js, /MutationObserver/);
});

test('navigation observer does not self-trigger by rewriting identical text', () => {
  assert.match(js, /function setTextIfChanged/);
  assert.match(js, /node\.textContent !== value/);
  assert.match(js, /observerFrame = requestAnimationFrame\(processNavigationMutation\)/);
  assert.doesNotMatch(js, /if \(label\) label\.textContent = meta\.label/);
  assert.doesNotMatch(js, /if \(current\) current\.textContent = secondaryActive/);
});

test('phone service worker cache is bumped for the repaired build', () => {
  assert.match(serviceWorker, /genevieve-master-v53-repair-20260818-1822/);
  assert.match(serviceWorker, /skipWaiting/);
  assert.match(serviceWorker, /clients\.claim/);
});

test('navigation colour contract remains green inactive and gold active', () => {
  assert.match(css, /#1B4D2B/);
  assert.match(css, /> button\.active[\s\S]*#C9A227/);
});

test('Option C hazard cards use real photographs with existing badge layer and readable text', () => {
  for (const id of ['_3Qd_aYQIew', 'JhYMMikexXs', 'YHaZboQ4UAw', 'YgtBbWeU2C0']) assert.ok(hazardCss.includes(id));
  assert.match(hazardCss, /Existing SVG artwork becomes the premium badge/);
  assert.match(hazardCss, /button i[\s\S]*background-color/);
  assert.match(hazardCss, /button:nth-child\(4\)::after/);
});
