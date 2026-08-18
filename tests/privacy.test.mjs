import test from 'node:test';
import assert from 'node:assert/strict';
import { attendancePrivacyDecision, isNightForPrivacy, localSolarWindow } from '../src/privacy.mjs';

test('ghost and pack visibility never publish public attendance telemetry', () => {
  assert.equal(attendancePrivacyDecision({ visibility: 'ghost' }).action, 'local-only');
  assert.equal(attendancePrivacyDecision({ visibility: 'pack' }).action, 'local-only');
});

test('public fuzzy sync can be delayed by exactly ten minutes', () => {
  const decision = attendancePrivacyDecision({ visibility: 'public', delayCheckin: true, nightGhosting: false });
  assert.equal(decision.action, 'queue');
  assert.equal(decision.delayMs, 10 * 60 * 1000);
});

test('checkout only publishes if the anonymous session was previously public', () => {
  assert.equal(attendancePrivacyDecision({ visibility: 'ghost' }, { eventType: 'checkout', wasPublic: false }).action, 'local-only');
  assert.equal(attendancePrivacyDecision({ visibility: 'ghost' }, { eventType: 'checkout', wasPublic: true }).action, 'publish');
});

test('night ghosting uses an offline solar window when coordinates are present', () => {
  const midday = new Date('2026-08-18T12:00:00+10:00');
  const midnight = new Date('2026-08-18T00:30:00+10:00');
  const goldCoast = { latitude: -28.0167, longitude: 153.4 };
  const window = localSolarWindow(midday, goldCoast);
  assert.equal(window.source, 'solar-calculation');
  assert.equal(window.sunrise > 4 && window.sunrise < 8, true);
  assert.equal(window.sunset > 16 && window.sunset < 20, true);
  assert.equal(isNightForPrivacy(midday, goldCoast), false);
  assert.equal(isNightForPrivacy(midnight, goldCoast), true);
});
