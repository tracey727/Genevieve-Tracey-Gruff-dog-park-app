(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.GenevieveLogic = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const clampRisk = value => Math.max(1, Math.min(10, Math.round(Number(value) || 1)));

  function riskClass(value) {
    const score = clampRisk(value);
    if (score <= 3) return 'green';
    if (score <= 5) return 'yellow';
    if (score <= 7) return 'amber';
    return 'red';
  }

  function riskLabel(value) {
    const colour = riskClass(value);
    return {
      green: 'Lower risk — continue checking',
      yellow: 'Caution — add controls and recheck',
      amber: 'High concern — delay or choose another option',
      red: 'Highest concern — do not proceed now'
    }[colour];
  }

  function ageInYears(dateOfBirth, referenceDate = new Date()) {
    if (!dateOfBirth) return null;
    const born = new Date(`${dateOfBirth}T00:00:00`);
    const reference = new Date(referenceDate);
    if (Number.isNaN(born.getTime()) || born > reference) return null;
    let years = reference.getFullYear() - born.getFullYear();
    const beforeBirthday = reference.getMonth() < born.getMonth()
      || (reference.getMonth() === born.getMonth() && reference.getDate() < born.getDate());
    if (beforeBirthday) years -= 1;
    return years;
  }

  function dogBreakIntervalMinutes(dog = {}, travelCondition = 'standard', referenceDate = new Date()) {
    const age = ageInYears(dog.dob, referenceDate);
    const extraCare = travelCondition === 'extra-care'
      || age !== null && (age < 1 || age >= 8)
      || ['reactive', 'needs-space', 'unwell'].includes(dog.status);
    return extraCare ? 90 : 120;
  }

  function requiredBreakStops(durationMinutes, intervalMinutes) {
    const duration = Math.max(0, Number(durationMinutes) || 0);
    const interval = Math.max(30, Number(intervalMinutes) || 120);
    return Math.max(0, Math.ceil(duration / interval) - 1);
  }

  function requiredOvernightStops(durationMinutes, dailyDrivingLimitMinutes = 420) {
    const duration = Math.max(0, Number(durationMinutes) || 0);
    const limit = Math.max(60, Number(dailyDrivingLimitMinutes) || 420);
    return Math.max(0, Math.ceil(duration / limit) - 1);
  }

  function calculateParkSuitability(input = {}) {
    let score = 1;
    const status = input.status || 'calm';
    if (status === 'playful') score += 1;
    if (status === 'needs-space') score += 2;
    if (status === 'reactive') score += 5;
    if (status === 'unwell') score += 7;

    if (input.crowd === 'mixed') score += 1;
    if (input.crowd === 'busy') score += 3;
    if (input.crowd === 'escalating') score += 5;

    if (input.boundary === 'unknown') score += 2;
    if (input.boundary === 'unsafe') score += 5;
    if (input.gate === 'unknown') score += 1;
    if (input.gate === 'unsafe') score += 4;
    if (!input.water) score += 1;
    if (!input.shade) score += 1;
    if (input.hotSurface) score += 2;
    if (!input.canSupervise) score += 5;
    return clampRisk(score);
  }

  function calculateHeatRisk(input = {}) {
    const temp = Number(input.temp) || 0;
    const humidity = Number(input.humidity) || 0;
    const uv = Number(input.uv) || 0;
    let score = 1;
    if (temp >= 38) score += 7;
    else if (temp >= 34) score += 5;
    else if (temp >= 30) score += 3;
    else if (temp >= 26) score += 1;
    if (humidity >= 80) score += 1;
    if (uv >= 8) score += 1;
    if (input.sun) score += 1;
    if (input.hotSurface) score += 2;
    if (input.vulnerable) score += 2;
    if (input.shade) score -= 1;
    if (input.water) score -= 1;
    return clampRisk(score);
  }

  function calculateCompatibilityRisk(first = {}, second = {}, context = {}) {
    const reactivity = (Number(first.reactivity) || 0) + (Number(second.reactivity) || 0);
    const energyDifference = Math.abs((Number(first.energy) || 0) - (Number(second.energy) || 0));
    const averageTolerance = ((Number(first.tolerance) || 0) + (Number(second.tolerance) || 0)) / 2;
    let score = 1 + reactivity / 4 + energyDifference / 3 + Math.max(0, 7 - averageTolerance) / 2;
    const crowd = Number(context.crowd) || 0;
    if (crowd >= 20) score += 3;
    else if (crowd >= 10) score += 2;
    else if (crowd >= 5) score += 1;
    if (context.group === 'high') score += 3;
    if (context.group === 'calm') score -= 1;
    return clampRisk(score);
  }

  function haversineKm(a, b) {
    const toRad = value => Number(value) * Math.PI / 180;
    const lat1 = toRad(a[1]);
    const lat2 = toRad(b[1]);
    const dLat = lat2 - lat1;
    const dLon = toRad(b[0]) - toRad(a[0]);
    const h = Math.sin(dLat / 2) ** 2
      + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return 6371 * 2 * Math.asin(Math.sqrt(h));
  }

  function sampleRouteCoordinates(coordinates, count) {
    const points = Array.isArray(coordinates) ? coordinates.filter(point => Array.isArray(point) && point.length >= 2) : [];
    const wanted = Math.max(0, Math.floor(Number(count) || 0));
    if (wanted === 0 || points.length < 2) return [];
    const lengths = [0];
    for (let i = 1; i < points.length; i += 1) {
      lengths[i] = lengths[i - 1] + haversineKm(points[i - 1], points[i]);
    }
    const total = lengths[lengths.length - 1];
    if (!total) return Array.from({ length: wanted }, () => points[0].slice(0, 2));
    const samples = [];
    for (let n = 1; n <= wanted; n += 1) {
      const target = total * n / (wanted + 1);
      let index = 1;
      while (index < lengths.length && lengths[index] < target) index += 1;
      const before = points[index - 1];
      const after = points[Math.min(index, points.length - 1)];
      const segment = Math.max(0.000001, lengths[index] - lengths[index - 1]);
      const ratio = Math.max(0, Math.min(1, (target - lengths[index - 1]) / segment));
      samples.push([
        before[0] + (after[0] - before[0]) * ratio,
        before[1] + (after[1] - before[1]) * ratio
      ]);
    }
    return samples;
  }

  function estimateRoadRoute(fromCoordinates, toCoordinates) {
    const straightKm = haversineKm(fromCoordinates, toCoordinates);
    const distanceKm = Math.max(1, Math.round(straightKm * 1.28));
    const durationMinutes = Math.max(30, Math.round(distanceKm / 75 * 60));
    return { distanceKm, durationMinutes };
  }

  function crossesTasmania(fromText, toText) {
    const tasPattern = /\b(tas|tasmania|hobart|launceston|devonport|burnie)\b/i;
    return tasPattern.test(String(fromText || '')) !== tasPattern.test(String(toText || ''));
  }


  const EVIDENCE_ATTACHMENT_MAX_BYTES = 8 * 1024 * 1024;
  const COMMUNICATION_MESSAGE_MAX_LENGTH = 500;
  const EVIDENCE_ATTACHMENT_TYPES = Object.freeze({
    '.jpg': Object.freeze(['image/jpeg']),
    '.png': Object.freeze(['image/png']),
    '.gif': Object.freeze(['image/gif']),
    '.webp': Object.freeze(['image/webp']),
    '.pdf': Object.freeze(['application/pdf']),
    '.txt': Object.freeze(['text/plain']),
    '.csv': Object.freeze(['text/csv', 'application/csv'])
  });

  const trimText = value => String(value ?? '').trim();

  function validateEvidenceRecord(input = {}) {
    const errors = [];
    const observedDate = new Date(input.observedAt);
    const risk = Number(input.risk);
    const value = {
      location: trimText(input.location),
      role: trimText(input.role),
      category: trimText(input.category),
      observedAt: Number.isNaN(observedDate.getTime()) ? '' : observedDate.toISOString(),
      risk,
      observation: trimText(input.observation),
      action: trimText(input.action),
      outcome: trimText(input.outcome),
      deidentified: input.deidentified === true
    };

    if (!value.location) errors.push({ field: 'location', message: 'Enter the park or location.' });
    if (!value.role) errors.push({ field: 'role', message: 'Choose the observer role.' });
    if (!value.category) errors.push({ field: 'category', message: 'Choose the evidence category.' });
    if (!value.observedAt) errors.push({ field: 'observedAt', message: 'Enter a valid observed date and time.' });
    if (!Number.isInteger(risk) || risk < 1 || risk > 10) errors.push({ field: 'risk', message: 'Risk must be a whole number from 1 to 10.' });
    if (!value.observation) errors.push({ field: 'observation', message: 'Describe what was observed.' });
    if (!value.action) errors.push({ field: 'action', message: 'Describe what action was taken.' });
    if (!value.outcome) errors.push({ field: 'outcome', message: 'Describe what actually happened.' });
    if (!value.deidentified) errors.push({ field: 'deidentified', message: 'Confirm that unnecessary personal information has been removed.' });

    return { valid: errors.length === 0, errors, value };
  }

  function normaliseSettings(input = {}) {
    return {
      reduceMotion: input.reduceMotion === true,
      largeText: input.largeText === true,
      highContrast: input.highContrast === true,
      shareStatus: input.shareStatus === true
    };
  }

  function validateAttachmentMetadata(metadata) {
    if (!metadata) return { valid: true, errors: [], value: null };

    const errors = [];
    const name = trimText(metadata.name);
    const size = Number(metadata.size);
    const type = trimText(metadata.type).toLowerCase().split(';')[0];
    const extensionMatch = name.toLowerCase().match(/\.[a-z0-9]+$/);
    const extension = extensionMatch ? extensionMatch[0] : '';
    const acceptedTypes = EVIDENCE_ATTACHMENT_TYPES[extension];

    if (!name) errors.push({ field: 'attachment', message: 'The attachment must have a file name.' });
    if (!Number.isFinite(size) || size < 0) errors.push({ field: 'attachment', message: 'The attachment size is invalid.' });
    if (Number.isFinite(size) && size > EVIDENCE_ATTACHMENT_MAX_BYTES) {
      errors.push({ field: 'attachment', message: 'The attachment must be 8 MB or smaller.' });
    }
    if (!acceptedTypes) {
      errors.push({ field: 'attachment', message: 'Use a JPG, PNG, GIF, WEBP, PDF, TXT or CSV attachment.' });
    } else if (type && !acceptedTypes.includes(type)) {
      errors.push({ field: 'attachment', message: 'The attachment file type does not match its extension.' });
    }

    return {
      valid: errors.length === 0,
      errors,
      value: errors.length ? null : { name, size, type, extension }
    };
  }

  function normaliseCommunicationMessage(value, fallback = 'Please type your message.') {
    const fallbackText = trimText(fallback) || 'Please type your message.';
    const text = trimText(value) || fallbackText;
    return Array.from(text).slice(0, COMMUNICATION_MESSAGE_MAX_LENGTH).join('');
  }

  function resolveAtomicState(snapshot, optimisticState, committed) {
    const selected = committed ? optimisticState : snapshot;
    return JSON.parse(JSON.stringify(selected));
  }

  return {
    clampRisk,
    riskClass,
    riskLabel,
    ageInYears,
    dogBreakIntervalMinutes,
    requiredBreakStops,
    requiredOvernightStops,
    calculateParkSuitability,
    calculateHeatRisk,
    calculateCompatibilityRisk,
    haversineKm,
    sampleRouteCoordinates,
    estimateRoadRoute,
    crossesTasmania,
    validateEvidenceRecord,
    normaliseSettings,
    validateAttachmentMetadata,
    normaliseCommunicationMessage,
    resolveAtomicState,
    EVIDENCE_ATTACHMENT_MAX_BYTES,
    COMMUNICATION_MESSAGE_MAX_LENGTH
  };
});
