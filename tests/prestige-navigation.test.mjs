import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const html = read('index.html');
const js = read('src/prestige-nav-enhancement.js');
const css = read('src/prestige-nav-enhancement.css');

test('prestige navigation enhancement is loaded after the app and payment layer', () => {
  assert.match(html, /src\/main\.jsx/);
  assert.match(html, /src\/payment-layer\.js/);
  assert.match(html, /src\/prestige-nav-enhancement\.js/);
  assert.ok(html.indexOf('prestige-nav-enhancement.js') > html.indexOf('payment-layer.js'));
});

test('all nine navigation controls receive plain-English purposes', () => {
  for (const purpose of [
    'Home & live safety', 'Park & conditions', 'Dog profile', 'My profile',
    'Emergency help', 'Report a hazard', 'Trip planning', 'GPS supervision', 'Conduct & rules'
  ]) assert.ok(js.includes(purpose), `${purpose} missing`);
});

test('screen changes reset viewport to top', () => {
  assert.match(js, /window\.scrollTo\(\{ top: 0, left: 0, behavior: 'auto' \}\)/);
  assert.match(js, /currentScreen !== lastScreen/);
  assert.match(js, /MutationObserver/);
});

test('mobile navigation is large, labelled and horizontally scrollable', () => {
  assert.match(css, /overflow-x: auto !important/);
  assert.match(css, /min-height: 78px !important/);
  assert.match(css, /min-width: 132px !important/);
  assert.match(css, /span:not\(\.nav-purpose\)/);
});

test('navigation colour contract is green inactive and gold active', () => {
  assert.match(css, /#1B4D2B/);
  assert.match(css, /button\.active[\s\S]*#C9A227/);
});
