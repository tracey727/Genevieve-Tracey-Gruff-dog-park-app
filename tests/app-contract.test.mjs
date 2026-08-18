import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { crowdSummary, safetyScore } from '../src/safety.mjs';

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const app = read('src/App.jsx');
const baseCss = read('src/styles.css');
const brandCss = read('src/brand-colour-override.css');
const indexHtml = read('index.html');
const checkout = read('api/create-checkout-session.js');
const stripeCore = read('server/stripe.js');
const privacy = read('src/privacy.mjs');

test('all nine production screens remain wired', () => {
  for (let i = 1; i <= 9; i += 1) {
    assert.match(app, new RegExp(`screen === ${i}`), `screen ${i} missing from App.jsx`);
  }
  for (const label of ['TodayScreen', 'JourneyScreen', 'DogScreen', 'HandlerScreen', 'EmergencyScreen', 'HazardScreen', 'TravelScreen', 'GuardScreen', 'ConductScreen']) {
    assert.match(app, new RegExp(label), `${label} missing`);
  }
});

test('emergency hold-and-slide safety contract is unchanged', () => {
  assert.match(app, /\/ 3000\) \* 100/);
  assert.match(app, /\}, 3000\);/);
  assert.match(app, />= 92/);
  assert.match(app, /EMERGENCY: HOLD 3 SECS & SLIDE/);
  assert.match(app, /ARMED — SLIDE TO OPEN/);
});

test('hazard reporting retains all four required threat categories and verification controls', () => {
  for (const id of ['snake', 'infrastructure', 'poison', 'incident']) {
    assert.match(app, new RegExp(`['\"]${id}['\"]`), `${id} hazard category missing`);
  }
  for (const asset of [
    'public/assets/hazard-snake-wildlife.svg',
    'public/assets/hazard-council-infrastructure.svg',
    'public/assets/hazard-bait-poison.svg',
    'public/assets/hazard-altercation-incident.svg'
  ]) {
    assert.equal(fs.existsSync(path.join(root, asset)), true, `${asset} missing`);
  }
  assert.match(app, /findDuplicateHazard/);
  assert.match(app, /Verified Hazard/);
  assert.match(app, /reportStrikes > 3/);
});

test('approved Genevieve tree and green-off gold-on toggle contract are locked', () => {
  assert.equal(fs.existsSync(path.join(root, 'public/assets/genevieve-roots-512.png')), true);
  assert.match(brandCss, /genevieve-roots-512\.png/);
  assert.match(brandCss, /Toggle contract: GREEN = off, GOLD = on/);
  assert.match(brandCss, /\.toggle \.switch[\s\S]*#2f6d4c/);
  assert.match(brandCss, /\.toggle input:checked \+ \.switch[\s\S]*#C9A227/i);
});

test('colour-alert selectors remain intact', () => {
  for (const selector of ['.alert-card.safe', '.alert-card.warn', '.crowd-warning.amber', '.crowd-warning.red', '.stat-pill.amber', '.stat-pill.red']) {
    assert.equal(baseCss.includes(selector), true, `${selector} colour alert selector missing`);
  }
  assert.match(app, /'warn' : 'safe'/);
  assert.match(app, /crowd-warning/);
});

test('payment layer and server-only Stripe secret contract remain present', () => {
  assert.match(indexHtml, /src\/payment-layer\.js/);
  assert.match(checkout, /stripePost/);
  assert.match(stripeCore, /process\.env\.STRIPE_SECRET_KEY/);
  assert.doesNotMatch(indexHtml, /sk_(?:test|live)_/);
});

test('handler privacy shields are enforced before attendance cloud sync', () => {
  assert.match(privacy, /ghost-mode/);
  assert.match(privacy, /pack-private/);
  assert.match(privacy, /ten-minute-delay/);
  assert.match(privacy, /night-ghosting/);
  assert.match(app, /Privacy shield · attendance local only/);
});

test('voluntary incident exchange includes insurance and vaccination fields without public publication', () => {
  assert.match(app, /insuranceProvider/);
  assert.match(app, /insurancePolicy/);
  assert.match(app, /vaccinationSummary/);
  assert.match(app, /misconduct-log/);
  assert.match(app, /Nothing was posted publicly/);
});

test('large crowd calculations remain bounded and correct for 5,000 concurrent sessions', () => {
  const created_at = new Date().toISOString();
  const events = Array.from({ length: 5000 }, (_, i) => ({
    session_token: `session-${i}`,
    event_type: 'checkin',
    energy: i % 10 < 3 ? 'zoomies' : (i % 2 ? 'playful' : 'calm'),
    created_at
  }));
  const summary = crowdSummary(events);
  assert.equal(summary.total, 5000);
  assert.equal(summary.calm + summary.playful + summary.zoomies, 5000);
  assert.equal(Number.isFinite(summary.highEnergyRatio), true);
});

test('safety score always stays inside 0-100 under extreme inputs', () => {
  const score = safetyScore({ weatherTempC: 55, heatSensitive: true, hazards: 5000, crowd: 5000, offGame: true });
  assert.equal(score >= 0 && score <= 100, true);
});
