import crypto from 'node:crypto';

const APP_VERSION = '2026.08.18.53';
const RULE_VERSION = 'animal-trip-calculation-2026-08-18-v3';
const ORS_BASE = 'https://api.openrouteservice.org';
const MAX_REQUIRED_PLACES = 8;
const MAX_DRIVING_DAY_SECONDS = 8 * 60 * 60;
const PROVIDER_TIMEOUT_MS = 18000;

const FERRY = Object.freeze({
  geelongQuery: 'Spirit of Tasmania Quay, 136 Corio Quay Road, North Geelong VIC 3215, Australia',
  devonportQuery: 'Spirit of Tasmania, Esplanade, East Devonport TAS 7310, Australia',
  geelongTerminal: 'Spirit of Tasmania Quay, 136 Corio Quay Road, North Geelong VIC 3215',
  devonportTerminal: 'Spirit of Tasmania, Esplanade, East Devonport TAS 7310',
  crossingHours: 'approximately 9–11 hours',
  operatorUrl: 'https://www.spiritoftasmania.com.au/',
  petRulesUrl: 'https://www.spiritoftasmania.com.au/terms-and-conditions/pets-and-kennels/',
  scheduleUrl: 'https://www.spiritoftasmania.com.au/before-you-sail/sailing-schedule/'
});

class PublicError extends Error {
  constructor(status, code, message, details = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const rounded = (value, places = 1) => {
  const factor = 10 ** places;
  return Math.round(Number(value) * factor) / factor;
};

function cleanText(value, maximum = 180) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, maximum);
}

export function levelForScore(score) {
  const value = Math.max(1, Math.min(10, Number(score) || 1));
  if (value <= 2) return 'green';
  if (value <= 5) return 'yellow';
  if (value <= 7) return 'amber';
  return 'red';
}

function attention(score, label, meaning) {
  return { score, level: levelForScore(score), label, meaning };
}

function parseBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); }
    catch { throw new PublicError(400, 'invalid_json', 'The trip request was not valid JSON.'); }
  }
  return {};
}

function validCoordinatePair(value) {
  if (!value || typeof value !== 'object') return null;
  const latitude = Number(value.latitude);
  const longitude = Number(value.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (latitude < -55 || latitude > -8 || longitude < 95 || longitude > 169) return null;
  return { latitude, longitude };
}

export function normaliseInput(body = {}) {
  const from = cleanText(body.from);
  const to = cleanText(body.to);
  if (!from || !to) throw new PublicError(422, 'missing_locations', 'Enter both an Australian start and destination.');

  const requiredPlaces = Array.isArray(body.requiredPlaces)
    ? body.requiredPlaces.map((value) => cleanText(value)).filter(Boolean)
    : String(body.requiredPlaces || '').split(/\r?\n/).map((value) => cleanText(value)).filter(Boolean);
  const uniqueRequiredPlaces = [...new Set(requiredPlaces)];
  if (uniqueRequiredPlaces.length > MAX_REQUIRED_PLACES) {
    throw new PublicError(422, 'too_many_required_places', `Enter no more than ${MAX_REQUIRED_PLACES} required places for one calculation.`);
  }

  const dogBreakHours = Number(body.dogBreakHours);
  if (![1.5, 2].includes(dogBreakHours)) {
    throw new PublicError(422, 'invalid_break_policy', 'The dog-break rule must be the GENEVIEVE 1.5-hour or 2-hour planning ceiling.');
  }

  const routeStyle = ['fastest', 'coastal', 'inland', 'scenic'].includes(body.routeStyle) ? body.routeStyle : 'fastest';
  return {
    from,
    to,
    requiredPlaces: uniqueRequiredPlaces,
    fromCoordinates: validCoordinatePair(body.fromCoordinates),
    dogBreakHours,
    routeStyle
  };
}

async function providerJson(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const providerMessage = cleanText(payload?.error?.message || payload?.error || payload?.message, 240);
      throw new PublicError(
        response.status === 429 ? 503 : 502,
        response.status === 429 ? 'routing_provider_busy' : 'routing_provider_error',
        response.status === 429
          ? 'The Australia-wide route service is busy. Try the calculation again shortly.'
          : `The Australia-wide route service could not complete this request${providerMessage ? `: ${providerMessage}` : '.'}`
      );
    }
    return payload;
  } catch (error) {
    if (error instanceof PublicError) throw error;
    if (error?.name === 'AbortError') {
      throw new PublicError(504, 'routing_provider_timeout', 'The Australia-wide route calculation timed out. Try again.');
    }
    throw new PublicError(502, 'routing_provider_unavailable', 'The Australia-wide route service could not be reached. Try again when online.');
  } finally {
    clearTimeout(timeout);
  }
}

function providerCountryIsAustralia(properties = {}) {
  const values = [properties.country_a, properties.country_code, properties.country].map((value) => String(value || '').toUpperCase());
  return values.some((value) => ['AU', 'AUS', 'AUSTRALIA'].includes(value));
}

function regionFor(location) {
  const state = String(location.state || '').toUpperCase();
  const [longitude, latitude] = location.coordinates;
  if (state === 'TAS' || state.includes('TASMANIA')) return 'TAS';
  if (latitude < -39 && longitude > 143 && longitude < 150) return 'TAS';
  return 'MAINLAND_OR_AU_ISLAND';
}

async function geocode(query, apiKey, context = {}) {
  const url = new URL(`${ORS_BASE}/geocode/search`);
  url.searchParams.set('api_key', apiKey);
  url.searchParams.set('text', query);
  url.searchParams.set('boundary.country', 'AU');
  url.searchParams.set('size', '1');
  const payload = await providerJson(url);
  const feature = payload?.features?.[0];
  const coordinates = feature?.geometry?.coordinates;
  const properties = feature?.properties || {};
  if (!feature || !Array.isArray(coordinates) || coordinates.length < 2 || !providerCountryIsAustralia(properties)) {
    throw new PublicError(
      422,
      'location_not_found',
      `GENEVIEVE could not verify “${cleanText(context.originalQuery || query, 120)}” as an Australian road location. Check the spelling or enter a fuller address.`,
      { field: context.field || 'location' }
    );
  }
  const longitude = Number(coordinates[0]);
  const latitude = Number(coordinates[1]);
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
    throw new PublicError(422, 'location_not_found', `GENEVIEVE could not obtain road coordinates for “${cleanText(context.originalQuery || query, 120)}”.`, { field: context.field || 'location' });
  }
  const label = cleanText(properties.label || properties.name || context.originalQuery || query, 200);
  const location = {
    name: context.displayName || label,
    resolvedLabel: label,
    sourceQuery: cleanText(context.originalQuery || query, 180),
    mapQuery: `${latitude.toFixed(6)},${longitude.toFixed(6)}`,
    coordinates: [longitude, latitude],
    latitude: rounded(latitude, 6),
    longitude: rounded(longitude, 6),
    state: cleanText(properties.region_a || properties.region || properties.macroregion || '', 80),
    locality: cleanText(properties.locality || properties.localadmin || properties.county || '', 100),
    confidence: Number.isFinite(Number(properties.confidence)) ? rounded(properties.confidence, 3) : null,
    kind: context.kind || 'location',
    genericRegion: Boolean(context.genericRegion)
  };
  location.region = regionFor(location);
  return location;
}

function coordinateLocation(input, context = {}) {
  const latitude = input.latitude;
  const longitude = input.longitude;
  const location = {
    name: cleanText(context.displayName || 'Current location', 180),
    resolvedLabel: 'Current device location supplied by the user',
    sourceQuery: cleanText(context.originalQuery || 'Current location', 180),
    mapQuery: `${latitude.toFixed(6)},${longitude.toFixed(6)}`,
    coordinates: [longitude, latitude],
    latitude: rounded(latitude, 6),
    longitude: rounded(longitude, 6),
    state: '',
    locality: '',
    confidence: null,
    kind: context.kind || 'start',
    coordinateSource: 'user-authorised device location'
  };
  location.region = regionFor(location);
  return location;
}

async function resolveInputLocations(input, apiKey) {
  const genericTasmania = (value) => /^(tasmania|tas)$/i.test(String(value || '').trim());
  const tasks = [];
  if (input.fromCoordinates) {
    tasks.push(Promise.resolve(coordinateLocation(input.fromCoordinates, { displayName: input.from, originalQuery: input.from, kind: 'start' })));
  } else {
    const fromIsTasmania = genericTasmania(input.from);
    tasks.push(geocode(fromIsTasmania ? FERRY.devonportQuery : input.from, apiKey, {
      originalQuery: input.from,
      displayName: fromIsTasmania ? 'Devonport ferry terminal (Tasmania start)' : '',
      field: 'from',
      kind: 'start',
      genericRegion: fromIsTasmania
    }));
  }

  input.requiredPlaces.forEach((query, index) => {
    const requiredIsTasmania = genericTasmania(query);
    tasks.push(geocode(requiredIsTasmania ? FERRY.devonportQuery : query, apiKey, {
      originalQuery: query,
      displayName: requiredIsTasmania ? 'Devonport ferry terminal (required Tasmania place)' : '',
      field: `requiredPlaces[${index}]`,
      kind: 'required',
      genericRegion: requiredIsTasmania
    }));
  });

  const toIsTasmania = genericTasmania(input.to);
  tasks.push(geocode(toIsTasmania ? FERRY.devonportQuery : input.to, apiKey, {
    originalQuery: input.to,
    displayName: toIsTasmania ? 'Devonport ferry terminal (Tasmania destination)' : '',
    field: 'to',
    kind: 'destination',
    genericRegion: toIsTasmania
  }));
  return Promise.all(tasks);
}

function samePoint(a, b) {
  if (!a || !b) return false;
  return Math.abs(a.coordinates[0] - b.coordinates[0]) < 0.0001 && Math.abs(a.coordinates[1] - b.coordinates[1]) < 0.0001;
}

function appendRoad(steps, from, to) {
  if (samePoint(from, to)) return;
  const previous = steps.at(-1);
  if (previous?.type === 'road' && samePoint(previous.points.at(-1), from)) previous.points.push(to);
  else steps.push({ type: 'road', points: [from, to] });
}

async function buildTravelSteps(locations, apiKey) {
  const crossesTasmania = locations.some((location, index) => index && location.region !== locations[index - 1].region);
  let geelong = null;
  let devonport = null;
  if (crossesTasmania) {
    [geelong, devonport] = await Promise.all([
      geocode(FERRY.geelongQuery, apiKey, { originalQuery: FERRY.geelongQuery, displayName: 'Geelong VIC', field: 'ferry', kind: 'ferry-terminal' }),
      geocode(FERRY.devonportQuery, apiKey, { originalQuery: FERRY.devonportQuery, displayName: 'Devonport TAS', field: 'ferry', kind: 'ferry-terminal' })
    ]);
    geelong.region = 'MAINLAND_OR_AU_ISLAND';
    devonport.region = 'TAS';
  }

  const steps = [];
  for (let index = 1; index < locations.length; index += 1) {
    const from = locations[index - 1];
    const to = locations[index];
    if (from.region === to.region) {
      appendRoad(steps, from, to);
      continue;
    }
    if (from.region === 'TAS') {
      appendRoad(steps, from, devonport);
      steps.push({ type: 'ferry', from: devonport, to: geelong, direction: 'Devonport to Geelong' });
      appendRoad(steps, geelong, to);
    } else {
      appendRoad(steps, from, geelong);
      steps.push({ type: 'ferry', from: geelong, to: devonport, direction: 'Geelong to Devonport' });
      appendRoad(steps, devonport, to);
    }
  }

  if (!steps.some((step) => step.type === 'road')) {
    throw new PublicError(422, 'no_road_sections', 'No road section could be calculated from those places.');
  }
  return steps;
}

function haversineKm(a, b) {
  const [lon1, lat1] = a.map((value) => Number(value) * Math.PI / 180);
  const [lon2, lat2] = b.map((value) => Number(value) * Math.PI / 180);
  const deltaLat = lat2 - lat1;
  const deltaLon = lon2 - lon1;
  const value = Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function coordinateAlong(coordinates, startIndex, endIndex, fraction) {
  const first = Math.max(0, Math.min(coordinates.length - 1, Number(startIndex) || 0));
  const last = Math.max(first, Math.min(coordinates.length - 1, Number(endIndex) || first));
  const points = coordinates.slice(first, last + 1);
  if (points.length < 2) return coordinates[first] || coordinates[0];
  const distances = [];
  let total = 0;
  for (let index = 1; index < points.length; index += 1) {
    const distance = haversineKm(points[index - 1], points[index]);
    distances.push(distance);
    total += distance;
  }
  if (!total) return points[0];
  const target = total * Math.max(0, Math.min(1, fraction));
  let travelled = 0;
  for (let index = 0; index < distances.length; index += 1) {
    if (travelled + distances[index] >= target) {
      const local = distances[index] ? (target - travelled) / distances[index] : 0;
      return [
        points[index][0] + (points[index + 1][0] - points[index][0]) * local,
        points[index][1] + (points[index + 1][1] - points[index][1]) * local
      ];
    }
    travelled += distances[index];
  }
  return points.at(-1);
}

export function coordinateAtSeconds(feature, targetSeconds) {
  const coordinates = feature?.geometry?.coordinates || [];
  const summarySeconds = Number(feature?.properties?.summary?.duration) || 0;
  const segments = feature?.properties?.segments || [];
  let elapsed = 0;
  for (const segment of segments) {
    for (const step of segment.steps || []) {
      const duration = Math.max(0, Number(step.duration) || 0);
      if (targetSeconds <= elapsed + duration || (segment === segments.at(-1) && step === (segment.steps || []).at(-1))) {
        const fraction = duration ? (targetSeconds - elapsed) / duration : 0;
        return coordinateAlong(coordinates, step.way_points?.[0], step.way_points?.[1], fraction);
      }
      elapsed += duration;
    }
  }
  return coordinateAlong(coordinates, 0, coordinates.length - 1, summarySeconds ? targetSeconds / summarySeconds : 0);
}

export function stopSchedule(totalSeconds, dogBreakHours) {
  const intervalSeconds = dogBreakHours * 60 * 60;
  const scheduled = [];
  let dayStart = 0;
  let roadDay = 1;
  while (dayStart < totalSeconds - 1) {
    const remaining = totalSeconds - dayStart;
    const dayDuration = Math.min(MAX_DRIVING_DAY_SECONDS, remaining);
    const hasAnotherRoadDay = remaining > MAX_DRIVING_DAY_SECONDS + 60;
    const internalCount = Math.max(0, Math.ceil(dayDuration / intervalSeconds) - 1);
    for (let index = 1; index <= internalCount; index += 1) {
      scheduled.push({ seconds: dayStart + dayDuration * index / (internalCount + 1), overnight: false, roadDay });
    }
    if (hasAnotherRoadDay) scheduled.push({ seconds: dayStart + dayDuration, overnight: true, roadDay });
    dayStart += dayDuration;
    roadDay += 1;
  }
  return scheduled.sort((a, b) => a.seconds - b.seconds);
}

function cumulativeWaypointHours(points, segments) {
  const values = [];
  let seconds = 0;
  for (let index = 0; index < points.length - 1; index += 1) {
    seconds += Number(segments[index]?.duration) || 0;
    const point = points[index + 1];
    if (index + 1 < points.length - 1 && point.kind === 'required') {
      values.push({ name: point.name, resolvedLabel: point.resolvedLabel, mapQuery: point.mapQuery, plannedHour: rounded(seconds / 3600, 1), kind: 'required-place' });
    }
  }
  return values;
}

async function calculateRoad(step, apiKey, preference) {
  const response = await providerJson(`${ORS_BASE}/v2/directions/driving-car/geojson`, {
    method: 'POST',
    headers: { Authorization: apiKey, 'Content-Type': 'application/json', Accept: 'application/geo+json, application/json' },
    body: JSON.stringify({ coordinates: step.points.map((point) => point.coordinates), preference, instructions: true, elevation: false })
  });
  const feature = response?.features?.[0];
  const summary = feature?.properties?.summary;
  if (!feature || !Array.isArray(feature?.geometry?.coordinates) || feature.geometry.coordinates.length < 2 || !Number.isFinite(Number(summary?.duration)) || !Number.isFinite(Number(summary?.distance))) {
    throw new PublicError(502, 'invalid_route_response', 'The Australia-wide route service returned an incomplete road calculation.');
  }
  return { feature, summary };
}

function publicRoadPart(step, result, dogBreakHours, sectionIndex) {
  const totalSeconds = Number(result.summary.duration);
  const scheduled = stopSchedule(totalSeconds, dogBreakHours);
  let previousSeconds = 0;
  const stops = scheduled.map((item) => {
    const coordinate = coordinateAtSeconds(result.feature, item.seconds);
    const longitude = Number(coordinate?.[0]);
    const latitude = Number(coordinate?.[1]);
    if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
      throw new PublicError(502, 'invalid_stop_coordinate', 'The route service could not provide a usable dog-break position. No stop count was saved.');
    }
    const mapQuery = `${latitude.toFixed(6)},${longitude.toFixed(6)}`;
    const score = item.overnight ? 7 : 6;
    const stop = {
      name: item.overnight ? `Required road overnight near the ${rounded(item.seconds / 3600, 1)}-hour route mark` : `Required dog break near the ${rounded(item.seconds / 3600, 1)}-hour route mark`,
      mapQuery,
      searchLocation: mapQuery,
      latitude: rounded(latitude, 6),
      longitude: rounded(longitude, 6),
      sectionIndex,
      plannedHour: rounded(item.seconds / 3600, 1),
      hoursFromPrevious: rounded((item.seconds - previousSeconds) / 3600, 1),
      roadDay: item.roadDay,
      overnight: item.overnight,
      routeCoordinateCalculated: true,
      stoppingFacilityVerified: false,
      attention: attention(
        score,
        item.overnight ? 'Overnight place must be verified' : 'Safe stopping place must be verified',
        item.overnight
          ? 'The route position is calculated, but pet-friendly accommodation, access, security and availability are not confirmed.'
          : 'The route position is calculated, but it is not confirmation that the exact point is a lawful or safe place to stop. Choose an earlier signed place if needed.'
      )
    };
    previousSeconds = item.seconds;
    return stop;
  });
  const segments = result.feature?.properties?.segments || [];
  return {
    type: 'road',
    sectionIndex,
    start: step.points[0],
    end: step.points.at(-1),
    roadKm: rounded(Number(result.summary.distance) / 1000, 0),
    driveHours: rounded(totalSeconds / 3600, 1),
    roadDays: Math.max(1, Math.ceil(totalSeconds / MAX_DRIVING_DAY_SECONDS)),
    overnightCount: stops.filter((stop) => stop.overnight).length,
    breakCount: stops.length,
    stops,
    requiredWaypoints: cumulativeWaypointHours(step.points, segments),
    routeCoordinateSource: 'openrouteservice driving-car GeoJSON'
  };
}

function publicFerryPart(step) {
  return {
    type: 'ferry',
    from: step.from,
    to: step.to,
    direction: step.direction,
    ...FERRY,
    attention: attention(7, 'Ferry and pet space need confirmation', 'Sailing, check-in time, fares and the selected pet transport arrangement must be confirmed with the operator.')
  };
}

export function canonicalCalculationRecord(input, locations, selected, calculatedAt) {
  return {
    recordType: 'GENEVIEVE Animal trip calculation',
    appVersion: APP_VERSION,
    ruleVersion: RULE_VERSION,
    calculatedAt,
    inputs: {
      from: input.from,
      to: input.to,
      requiredPlaces: input.requiredPlaces,
      dogBreakHours: input.dogBreakHours,
      routeStyleRequested: input.routeStyle,
      currentLocationUsed: Boolean(input.fromCoordinates)
    },
    resolvedLocations: locations.map((location) => ({
      kind: location.kind,
      sourceQuery: location.sourceQuery,
      resolvedLabel: location.resolvedLabel,
      latitude: location.latitude,
      longitude: location.longitude,
      state: location.state,
      genericRegion: Boolean(location.genericRegion)
    })),
    outputs: {
      roadKm: selected.roadKm,
      driveHours: selected.driveHours,
      requiredBreaks: selected.requiredBreaks,
      roadOvernights: selected.roadOvernights,
      roadDays: selected.roadDays,
      ferryRequired: selected.hasFerry,
      ferryCrossings: selected.ferryCount,
      stops: selected.stops.map((stop) => ({
        sectionIndex: stop.sectionIndex,
        plannedHour: stop.plannedHour,
        roadDay: stop.roadDay,
        overnight: stop.overnight,
        latitude: stop.latitude,
        longitude: stop.longitude,
        attentionScore: stop.attention.score
      }))
    }
  };
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, code: 'method_not_allowed', message: 'Use POST for a trip calculation.' });
  }
  const contentLength = Number(req.headers?.['content-length']) || 0;
  if (contentLength > 24000) return res.status(413).json({ ok: false, code: 'request_too_large', message: 'The trip request is too large.' });

  try {
    const apiKey = cleanText(process.env.OPENROUTESERVICE_API_KEY, 300);
    if (!apiKey) {
      throw new PublicError(503, 'national_routing_not_configured', 'Australia-wide live routing is not configured for this deployment. GENEVIEVE will not guess an unknown route.');
    }
    const input = normaliseInput(parseBody(req));
    const locations = await resolveInputLocations(input, apiKey);
    const steps = await buildTravelSteps(locations, apiKey);
    const preference = input.routeStyle === 'fastest' ? 'fastest' : 'recommended';
    const roadSteps = steps.filter((step) => step.type === 'road');
    const roadResults = await Promise.all(roadSteps.map((step) => calculateRoad(step, apiKey, preference)));
    let roadIndex = 0;
    let sectionIndex = 0;
    const parts = steps.map((step) => step.type === 'ferry'
      ? publicFerryPart(step)
      : publicRoadPart(step, roadResults[roadIndex++], input.dogBreakHours, sectionIndex++));

    let stopNumber = 0;
    parts.filter((part) => part.type === 'road').forEach((part) => part.stops.forEach((stop) => {
      stopNumber += 1;
      stop.sequence = stopNumber;
    }));

    const roadParts = parts.filter((part) => part.type === 'road');
    const stops = roadParts.flatMap((part) => part.stops);
    const selected = {
      style: 'national-live',
      label: 'Australia-wide calculated road route',
      calculable: true,
      recommended: true,
      parts,
      stops,
      requiredBreaks: stops.length,
      roadOvernights: roadParts.reduce((total, part) => total + part.overnightCount, 0),
      roadDays: roadParts.reduce((total, part) => total + part.roadDays, 0),
      roadKm: roadParts.reduce((total, part) => total + part.roadKm, 0),
      driveHours: rounded(roadParts.reduce((total, part) => total + part.driveHours, 0), 1),
      hasFerry: parts.some((part) => part.type === 'ferry'),
      ferryCount: parts.filter((part) => part.type === 'ferry').length,
      summaryTowns: locations.filter((location) => location.kind === 'required').map((location) => location.name),
      start: locations[0],
      end: locations.at(-1),
      attention: attention(2, 'Australian road geometry calculated', 'The configured provider resolved the places and calculated road geometry. This colour covers calculation status only, not current road, weather or stopping-place safety.'),
      providerPreference: preference,
      routeStyleNotice: input.routeStyle === 'fastest'
        ? 'Fastest routing preference requested from the provider.'
        : 'Coastal, inland and scenic labels are not guessed nationally. The provider used its recommended road route; add required places to shape the route and compare live map alternatives.'
    };

    const calculatedAt = new Date().toISOString();
    const record = canonicalCalculationRecord(input, locations, selected, calculatedAt);
    const calculationHash = crypto.createHash('sha256').update(JSON.stringify(record)).digest('hex');
    const policy = {
      hours: input.dogBreakHours,
      minutes: input.dogBreakHours * 60,
      explanation: `Road-day sections are divided so no calculated interval exceeds ${input.dogBreakHours} hours. Road driving is capped at eight hours before an overnight stop.`
    };

    return res.status(200).json({
      ok: true,
      calculable: true,
      liveRoadCalculation: true,
      provider: 'openrouteservice',
      providerAttribution: 'Routing by openrouteservice.org · Map data © OpenStreetMap contributors',
      policy,
      selected,
      options: [selected],
      resolvedLocations: locations,
      attention: selected.attention,
      evidence: {
        recordType: record.recordType,
        appVersion: APP_VERSION,
        ruleVersion: RULE_VERSION,
        calculatedAt,
        algorithm: 'SHA-256',
        calculationHash,
        calculationRecord: record,
        provider: 'openrouteservice',
        mapData: 'OpenStreetMap contributors'
      }
    });
  } catch (error) {
    const status = error instanceof PublicError ? error.status : 500;
    const code = error instanceof PublicError ? error.code : 'trip_calculation_failed';
    const message = error instanceof PublicError ? error.message : 'The trip calculation could not be completed.';
    return res.status(status).json({
      ok: false,
      calculable: false,
      code,
      message,
      details: error instanceof PublicError ? error.details : {},
      attention: attention(9, 'Route not calculated', 'GENEVIEVE has not produced a stop count for an unverified route.')
    });
  }
}
