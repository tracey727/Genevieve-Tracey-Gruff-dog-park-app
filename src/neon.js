import { createClient } from '@neondatabase/neon-js';
import { BetterAuthReactAdapter } from '@neondatabase/neon-js/auth/react/adapters';
import { secureGet, secureSet } from './secureStore.js';
import { attendancePrivacyDecision, isNightForPrivacy } from './privacy.mjs';

export const NEON_AUTH_URL = 'https://ep-crimson-fog-ay6e3ium.neonauth.c-5.us-east-2.aws.neon.tech/neondb/auth';
export const NEON_DATA_API_URL = 'https://ep-crimson-fog-ay6e3ium.apirest.c-5.us-east-2.aws.neon.tech/neondb/rest/v1';

export const neon = createClient({
  auth: { url: NEON_AUTH_URL, adapter: BetterAuthReactAdapter() },
  dataApi: { url: NEON_DATA_API_URL }
});

const ATTENDANCE_OUTBOX_KEY = 'attendance-outbox';
const PUBLIC_SESSION_KEY = 'genevieve:attendance:public-sessions';
let flushTimer = null;

function browserStorage() {
  return typeof localStorage === 'undefined' ? null : localStorage;
}

function publicSessions() {
  try {
    return JSON.parse(browserStorage()?.getItem(PUBLIC_SESSION_KEY) || '{}') || {};
  } catch {
    return {};
  }
}

function wasPublic(sessionToken) {
  return Boolean(publicSessions()[sessionToken]);
}

function markPublic(sessionToken, value) {
  const storage = browserStorage();
  if (!storage || !sessionToken) return;
  const next = publicSessions();
  if (value) next[sessionToken] = true;
  else delete next[sessionToken];
  storage.setItem(PUBLIC_SESSION_KEY, JSON.stringify(next));
}

function currentCoords(maximumAge = 120000) {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 3500, maximumAge }
    );
  });
}

async function insertAttendance(event) {
  const { error } = await neon.from('attendance_events').insert(event);
  if (error) throw error;
}

async function readOutbox() {
  const value = await secureGet(ATTENDANCE_OUTBOX_KEY, []);
  return Array.isArray(value) ? value : [];
}

async function writeOutbox(items) {
  await secureSet(ATTENDANCE_OUTBOX_KEY, items.slice(-100));
}

function scheduleOutboxFlush(delayMs = 1000) {
  if (typeof window === 'undefined') return;
  clearTimeout(flushTimer);
  flushTimer = setTimeout(() => {
    flushAttendanceOutbox().catch(() => {});
  }, Math.max(250, Math.min(delayMs, 10 * 60 * 1000)));
}

async function queueAttendance(event, delayMs) {
  const queue = await readOutbox();
  const withoutSameSession = queue.filter((item) => item?.event?.session_token !== event.session_token);
  const publishAt = Date.now() + delayMs;
  withoutSameSession.push({ event, publishAt, attempts: 0 });
  await writeOutbox(withoutSameSession);
  scheduleOutboxFlush(delayMs + 250);
}

async function cancelQueuedAttendance(sessionToken) {
  const queue = await readOutbox();
  const next = queue.filter((item) => item?.event?.session_token !== sessionToken);
  if (next.length !== queue.length) await writeOutbox(next);
}

export async function flushAttendanceOutbox() {
  const queue = await readOutbox();
  if (!queue.length) return { published: 0, remaining: 0 };

  const now = Date.now();
  const profile = await secureGet('handler', {});
  const coords = profile?.nightGhosting ? await currentCoords() : null;
  const remaining = [];
  let published = 0;

  for (const item of queue) {
    if (!item?.event?.session_token) continue;
    if (Number(item.publishAt) > now) {
      remaining.push(item);
      continue;
    }

    const event = item.event;
    const blocked = profile?.visibility !== 'public' || (profile?.nightGhosting && isNightForPrivacy(new Date(), coords));
    if (blocked) continue;

    try {
      await insertAttendance(event);
      markPublic(event.session_token, true);
      published += 1;
    } catch {
      remaining.push({ ...item, attempts: Number(item.attempts || 0) + 1, publishAt: Date.now() + 60000 });
    }
  }

  await writeOutbox(remaining);
  if (remaining.length) {
    const nextAt = Math.min(...remaining.map((item) => Number(item.publishAt) || (Date.now() + 60000)));
    scheduleOutboxFlush(Math.max(1000, nextAt - Date.now()));
  }
  return { published, remaining: remaining.length };
}

export async function cloudAttendance(locationKey) {
  await flushAttendanceOutbox().catch(() => {});
  const since = new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString();
  const { data, error } = await neon
    .from('attendance_events')
    .select('session_token,location_key,location_name,energy,mood,event_type,created_at')
    .eq('location_key', locationKey)
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) throw error;
  return data || [];
}

export async function cloudHazards(locationKey) {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await neon
    .from('hazards')
    .select('id,threat_type,location_key,location_name,latitude,longitude,seen_at,details,verification_count,verified,created_at')
    .eq('location_key', locationKey)
    .gte('seen_at', since)
    .order('seen_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  return data || [];
}

export async function postAttendance(event) {
  const profile = await secureGet('handler', {});

  if (event.event_type === 'checkout') {
    await cancelQueuedAttendance(event.session_token);
    const decision = attendancePrivacyDecision(profile, {
      eventType: 'checkout',
      wasPublic: wasPublic(event.session_token)
    });
    if (decision.action !== 'publish') return { localOnly: true, reason: decision.reason };
    await insertAttendance(event);
    markPublic(event.session_token, false);
    return { published: true, reason: decision.reason };
  }

  const coords = profile?.nightGhosting ? await currentCoords() : null;
  const decision = attendancePrivacyDecision(profile, {
    eventType: event.event_type,
    date: new Date(),
    coords,
    wasPublic: wasPublic(event.session_token)
  });

  if (decision.action === 'local-only') {
    return { localOnly: true, reason: decision.reason };
  }
  if (decision.action === 'queue') {
    await queueAttendance(event, decision.delayMs);
    const error = new Error('attendance_queued');
    error.code = 'attendance_queued';
    throw error;
  }

  await insertAttendance(event);
  markPublic(event.session_token, true);
  return { published: true, reason: decision.reason };
}

export async function postHazard(hazard) {
  const { error } = await neon.from('hazards').insert(hazard);
  if (error) throw error;
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => scheduleOutboxFlush(500));
  scheduleOutboxFlush(1500);
}
