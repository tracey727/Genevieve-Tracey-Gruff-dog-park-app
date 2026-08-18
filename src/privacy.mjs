const DEG = Math.PI / 180;

function normaliseDegrees(value) {
  return ((value % 360) + 360) % 360;
}

function normaliseHours(value) {
  return ((value % 24) + 24) % 24;
}

function dayOfYear(date) {
  const start = Date.UTC(date.getFullYear(), 0, 0);
  const current = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.floor((current - start) / 86400000);
}

function solarUtcHour(date, latitude, longitude, sunrise) {
  const n = dayOfYear(date);
  const lngHour = longitude / 15;
  const t = n + (((sunrise ? 6 : 18) - lngHour) / 24);
  const m = (0.9856 * t) - 3.289;
  let l = m + (1.916 * Math.sin(m * DEG)) + (0.020 * Math.sin(2 * m * DEG)) + 282.634;
  l = normaliseDegrees(l);

  let ra = Math.atan(0.91764 * Math.tan(l * DEG)) / DEG;
  ra = normaliseDegrees(ra);
  const lQuadrant = Math.floor(l / 90) * 90;
  const raQuadrant = Math.floor(ra / 90) * 90;
  ra = (ra + (lQuadrant - raQuadrant)) / 15;

  const sinDec = 0.39782 * Math.sin(l * DEG);
  const cosDec = Math.cos(Math.asin(sinDec));
  const zenith = 90.833 * DEG;
  const cosH = (Math.cos(zenith) - (sinDec * Math.sin(latitude * DEG))) /
    (cosDec * Math.cos(latitude * DEG));

  if (cosH > 1) return { polarNight: true };
  if (cosH < -1) return { polarDay: true };

  let h = sunrise ? 360 - (Math.acos(cosH) / DEG) : Math.acos(cosH) / DEG;
  h /= 15;
  const localMeanTime = h + ra - (0.06571 * t) - 6.622;
  return { utcHour: normaliseHours(localMeanTime - lngHour) };
}

export function localSolarWindow(date = new Date(), coords = null) {
  const latitude = Number(coords?.latitude);
  const longitude = Number(coords?.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return { sunrise: 6, sunset: 18, source: 'conservative-fallback' };
  }

  const rise = solarUtcHour(date, latitude, longitude, true);
  const set = solarUtcHour(date, latitude, longitude, false);
  if (rise.polarNight || set.polarNight) return { sunrise: 12, sunset: 12, source: 'polar-night' };
  if (rise.polarDay || set.polarDay) return { sunrise: 0, sunset: 24, source: 'polar-day' };

  const offsetHours = -date.getTimezoneOffset() / 60;
  return {
    sunrise: normaliseHours(rise.utcHour + offsetHours),
    sunset: normaliseHours(set.utcHour + offsetHours),
    source: 'solar-calculation'
  };
}

export function isNightForPrivacy(date = new Date(), coords = null) {
  const window = localSolarWindow(date, coords);
  if (window.source === 'polar-night') return true;
  if (window.source === 'polar-day') return false;
  const hour = date.getHours() + (date.getMinutes() / 60) + (date.getSeconds() / 3600);
  return hour < window.sunrise || hour >= window.sunset;
}

export function attendancePrivacyDecision(profile = {}, {
  eventType = 'checkin',
  date = new Date(),
  coords = null,
  wasPublic = false
} = {}) {
  if (eventType === 'checkout') {
    return wasPublic
      ? { action: 'publish', reason: 'close-public-session' }
      : { action: 'local-only', reason: 'no-public-session' };
  }

  if (profile.visibility !== 'public') {
    return { action: 'local-only', reason: profile.visibility === 'pack' ? 'pack-private' : 'ghost-mode' };
  }
  if (profile.nightGhosting && isNightForPrivacy(date, coords)) {
    return { action: 'local-only', reason: 'night-ghosting' };
  }
  if (profile.delayCheckin) {
    return { action: 'queue', delayMs: 10 * 60 * 1000, reason: 'ten-minute-delay' };
  }
  return { action: 'publish', reason: 'public-fuzzy-sync' };
}
