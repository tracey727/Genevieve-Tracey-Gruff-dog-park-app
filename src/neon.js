import { createClient } from '@neondatabase/neon-js';
import { BetterAuthReactAdapter } from '@neondatabase/neon-js/auth/react/adapters';

export const NEON_AUTH_URL = 'https://ep-crimson-fog-ay6e3ium.neonauth.c-5.us-east-2.aws.neon.tech/neondb/auth';
export const NEON_DATA_API_URL = 'https://ep-crimson-fog-ay6e3ium.apirest.c-5.us-east-2.aws.neon.tech/neondb/rest/v1';

export const neon = createClient({
  auth: { url: NEON_AUTH_URL, adapter: BetterAuthReactAdapter() },
  dataApi: { url: NEON_DATA_API_URL }
});

export async function cloudAttendance(locationKey) {
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
  const { error } = await neon.from('attendance_events').insert(event);
  if (error) throw error;
}

export async function postHazard(hazard) {
  const { error } = await neon.from('hazards').insert(hazard);
  if (error) throw error;
}
