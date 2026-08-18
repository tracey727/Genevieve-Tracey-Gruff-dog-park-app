import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { levelForScore, normaliseInput, stopSchedule } from '../api/trip-calculate.js';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const index = read('index.html');
const travel = read('src/national-travel-enhancement.js');
const css = read('src/national-travel.css');
const api = read('api/trip-calculate.js');

test('Screen 7 national planner is wired into the V53 shell', () => {
  assert.match(index, /src\/national-travel-enhancement\.js/);
  assert.match(travel, /\/api\/trip-calculate/);
  assert.match(travel, /method: 'POST'/);
  assert.match(travel, /dogBreakHours/);
  assert.match(travel, /requiredPlaces/);
  assert.match(travel, /routeStyle/);
});

test('national route endpoint uses project ES-module runtime and Australia-only inputs', () => {
  assert.match(api, /import crypto from 'node:crypto'/);
  assert.match(api, /export default async function handler/);
  assert.doesNotMatch(api, /module\.exports|require\('node:crypto'\)/);
  assert.match(api, /boundary\.country/);
  assert.match(api, /'AU'/);
  const input = normaliseInput({
    from: 'Brisbane QLD',
    to: 'Sydney NSW',
    requiredPlaces: ['Coffs Harbour NSW'],
    dogBreakHours: 2,
    routeStyle: 'fastest'
  });
  assert.equal(input.requiredPlaces.length, 1);
  assert.equal(input.dogBreakHours, 2);
});

test('dog breaks and road-day overnight planning remain bounded', () => {
  const tenHourTrip = stopSchedule(10 * 60 * 60, 2);
  assert.equal(tenHourTrip.some((stop) => stop.overnight), true);
  assert.equal(tenHourTrip.every((stop) => Number.isFinite(stop.seconds)), true);
  assert.equal(levelForScore(9), 'red');
});

test('travel UI preserves earlier accommodation tools without fabricating availability', () => {
  for (const phrase of [
    'Pet-friendly accommodation',
    'Dog-friendly caravan park',
    'Pet-friendly Airbnb search',
    'Emergency vet',
    'Genevieve Boarding Match · planned module'
  ]) assert.equal(travel.includes(phrase), true, `${phrase} missing`);
  assert.match(travel, /availability, pet acceptance and safety are not claimed/);
  assert.match(travel, /not activated until verified providers/);
});

test('national planner retains the locked premium green and Genevieve gold presentation', () => {
  assert.match(css, /#123d2c/i);
  assert.match(css, /#1b4d2b/i);
  assert.match(css, /#c9a227/i);
  assert.match(css, /@media \(max-width: 760px\)/);
});
