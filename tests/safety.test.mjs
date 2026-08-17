import test from 'node:test';
import assert from 'node:assert/strict';
import { haversineMeters, crowdSummary, crowdAlert, isDuplicateHazard, safetyScore } from '../src/safety.mjs';

test('distance calculation is sane', () => {
  assert.ok(haversineMeters(-27.94, 153.43, -27.9401, 153.4301) < 20);
});

test('crowd ratio triggers amber at 30 percent and red at 100 percent', () => {
  const now = new Date().toISOString();
  const events = Array.from({ length: 10 }, (_, i) => ({ session_token: `s${i}`, event_type: 'checkin', energy: i < 3 ? 'zoomies' : 'calm', created_at: now }));
  const summary = crowdSummary(events);
  assert.equal(summary.total, 10);
  assert.equal(summary.zoomies, 3);
  assert.equal(crowdAlert(true, summary).level, 'amber');
  const red = crowdSummary([{ session_token: 'r', event_type: 'checkin', energy: 'zoomies', created_at: now }]);
  assert.equal(crowdAlert(true, red).level, 'red');
});

test('hazard consolidation catches same threat inside 30 metres and 60 minutes', () => {
  const now = Date.now();
  const candidate = { threat_type: 'snake', latitude: -27.94, longitude: 153.43 };
  const existing = [{ threat_type: 'snake', latitude: -27.9401, longitude: 153.4301, seen_at: new Date(now - 10 * 60 * 1000).toISOString() }];
  assert.equal(isDuplicateHazard(candidate, existing, now), true);
});

test('safety score remains bounded and lowers for heat-sensitive dogs', () => {
  const normal = safetyScore({ weatherTempC: 29, heatSensitive: false, hazards: 0, crowd: 0, offGame: false });
  const sensitive = safetyScore({ weatherTempC: 29, heatSensitive: true, hazards: 0, crowd: 0, offGame: false });
  assert.ok(normal > sensitive);
  assert.ok(sensitive >= 0 && sensitive <= 100);
});
