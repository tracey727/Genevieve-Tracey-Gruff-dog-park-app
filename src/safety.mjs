export function haversineMeters(aLat, aLon, bLat, bLon) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const x = Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(x));
}

export function latestAttendance(events, now = Date.now()) {
  const latest = new Map();
  for (const event of events || []) {
    const t = Date.parse(event.created_at || event.createdAt || 0);
    if (!Number.isFinite(t) || t > now + 120000 || now - t > 8 * 60 * 60 * 1000) continue;
    const key = String(event.session_token || event.sessionToken || '');
    if (!key) continue;
    const previous = latest.get(key);
    if (!previous || t > previous.t) latest.set(key, { ...event, t });
  }
  return [...latest.values()].filter((e) => (e.event_type || e.eventType) === 'checkin');
}

export function crowdSummary(events) {
  const active = latestAttendance(events);
  const counts = { calm: 0, playful: 0, zoomies: 0, total: active.length };
  for (const e of active) {
    const energy = e.energy || 'playful';
    if (energy === 'calm') counts.calm += 1;
    else if (energy === 'zoomies') counts.zoomies += 1;
    else counts.playful += 1;
  }
  counts.highEnergyRatio = counts.total ? counts.zoomies / counts.total : 0;
  return counts;
}

export function crowdAlert(offGame, summary) {
  if (!offGame || !summary?.total) return null;
  if (summary.highEnergyRatio >= 1) return { level: 'red', message: 'The current crowd mix is entirely high-energy. Consider a quieter option.' };
  if (summary.highEnergyRatio >= 0.3) return { level: 'amber', message: 'The park is a bit high-energy right now. Perfect time for focused lead-work or a quiet corner.' };
  return null;
}

export function isDuplicateHazard(candidate, existing, now = Date.now()) {
  return (existing || []).some((hazard) => {
    if ((hazard.threat_type || hazard.threatType) !== candidate.threat_type) return false;
    const time = Date.parse(hazard.seen_at || hazard.seenAt || hazard.created_at || 0);
    if (!Number.isFinite(time) || Math.abs(now - time) > 60 * 60 * 1000) return false;
    if (![candidate.latitude, candidate.longitude, hazard.latitude, hazard.longitude].every(Number.isFinite)) return false;
    return haversineMeters(candidate.latitude, candidate.longitude, hazard.latitude, hazard.longitude) <= 30;
  });
}

export function safetyScore({ weatherTempC, heatSensitive = false, hazards = 0, crowd = 0, offGame = false }) {
  let score = 100;
  const threshold = heatSensitive ? 28 : 32;
  if (Number.isFinite(weatherTempC) && weatherTempC >= threshold) score -= Math.min(35, 10 + (weatherTempC - threshold) * 5);
  score -= Math.min(35, hazards * 12);
  if (crowd >= 20) score -= 12;
  else if (crowd >= 10) score -= 6;
  if (offGame) score -= 5;
  return Math.max(0, Math.round(score));
}
