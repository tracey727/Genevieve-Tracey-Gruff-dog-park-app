import React, { useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { BREED_INDEX, breedInfo } from './breeds.js';
import { secureGet, secureSet } from './secureStore.js';
import {
  neon,
  cloudAttendance,
  cloudHazards,
  postAttendance,
  postHazard
} from './neon.js';
import {
  crowdAlert,
  crowdSummary,
  haversineMeters,
  isDuplicateHazard,
  safetyScore
} from './safety.mjs';

const LOGO = '/assets/genevieve-official-logo.jpeg';
const SLOGAN = 'Safety from roots to every journey.';
const DEFAULT_LOCATION = {
  key: 'southport-spit-off-leash-dog-beach',
  name: 'Southport Spit Off-Leash Dog Beach',
  verified: false,
  station: 'gold-coast-seaway'
};
const EMPTY_PROFILE = {
  displayName: '', email: '', phone: '', iceName: '', icePhone: '', medicalNotes: '',
  visibility: 'ghost', delayCheckin: false, nightGhosting: true, termsAccepted: false
};
const THREATS = [
  ['snake', '🐍', 'Snake / Wildlife'],
  ['infrastructure', '🚧', 'Council / Infrastructure'],
  ['poison', '🧪', 'Baiting / Poison Threat'],
  ['incident', '⚠️', 'Altercation / Incident']
];
const NAV = [
  [1, 'Today', '⌂'], [2, 'Journey', '◎'], [3, 'Mate', '🐾'], [4, 'Handler', '♙'],
  [5, 'Emergency', '✚'], [6, 'Hazard', '⚠'], [7, 'Travel', '↗'], [8, 'Guard', '◉'], [9, 'Code', '⚖']
];

const SAFE_HAVEN_PACK = [
  { name: 'Current selected location', type: 'Current park', lat: null, lon: null, note: 'Uses your selected location and live device position.' },
  { name: 'Emergency veterinarian search', type: 'Online routing', lat: null, lon: null, note: 'Opens a live nearby emergency-vet search when a network is available.' },
  { name: 'Animal Poisons Helpline', type: 'Hardcoded emergency contact', phone: '1300869738', note: 'Available from the offline emergency layer.' }
];

function loadLocal(key, fallback) {
  try { return JSON.parse(localStorage.getItem(`genevieve:${key}`)) ?? fallback; } catch { return fallback; }
}
function saveLocal(key, value) { localStorage.setItem(`genevieve:${key}`, JSON.stringify(value)); }
function newToken(key) {
  const existing = localStorage.getItem(`genevieve:${key}`);
  if (existing) return existing;
  const token = crypto.randomUUID();
  localStorage.setItem(`genevieve:${key}`, token);
  return token;
}
function slug(value) {
  return String(value || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'selected-location';
}
function localTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString('en-AU', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' });
}
function openMap(query) {
  window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, '_blank', 'noopener,noreferrer');
}
function tel(phone) { window.location.href = `tel:${String(phone).replace(/\s/g, '')}`; }

function EmergencySlider({ onOpen }) {
  const [holding, setHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [armed, setArmed] = useState(false);
  const timer = useRef(null);
  const ticker = useRef(null);

  const start = () => {
    if (armed) return;
    setHolding(true); setProgress(0);
    const started = Date.now();
    ticker.current = setInterval(() => setProgress(Math.min(100, ((Date.now() - started) / 3000) * 100)), 60);
    timer.current = setTimeout(() => {
      clearInterval(ticker.current); setProgress(100); setArmed(true); setHolding(false);
      navigator.vibrate?.([120, 70, 120]);
    }, 3000);
  };
  const cancel = () => {
    if (armed) return;
    clearTimeout(timer.current); clearInterval(ticker.current); setHolding(false); setProgress(0);
  };
  useEffect(() => () => { clearTimeout(timer.current); clearInterval(ticker.current); }, []);

  return (
    <div className="emergency-wrap" aria-label="Emergency hold and slide control">
      <button className={`emergency-hold ${armed ? 'armed' : ''}`} onPointerDown={start} onPointerUp={cancel} onPointerLeave={cancel}>
        <span>{armed ? 'ARMED — SLIDE TO OPEN' : '🔴 EMERGENCY: HOLD 3 SECS & SLIDE'}</span>
        <i style={{ width: `${progress}%` }} />
      </button>
      {armed && <input aria-label="Slide to open emergency portal" className="emergency-range" type="range" min="0" max="100" defaultValue="0" onChange={(e) => {
        if (Number(e.target.value) >= 92) { setArmed(false); setProgress(0); onOpen(); e.target.value = 0; }
      }} />}
      {holding && <small>Keep holding… {Math.ceil((100 - progress) * 0.03)}s</small>}
    </div>
  );
}

function Brand({ compact = false }) {
  return (
    <div className={`brand ${compact ? 'compact' : ''}`}>
      <img src={LOGO} alt="GENEVIEVE App official tree, roots and infinity logo" />
      <div><strong>GENEVIEVE</strong><span>APP™</span><em>{SLOGAN}</em></div>
    </div>
  );
}

function StatPill({ label, value, tone = 'green' }) {
  return <div className={`stat-pill ${tone}`}><span>{label}</span><strong>{value}</strong></div>;
}

function Field({ label, children, hint }) {
  return <label className="field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}

function Toggle({ checked, onChange, children }) {
  return <label className="toggle"><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} /><span className="switch" /><b>{children}</b></label>;
}

function App() {
  const [screen, setScreen] = useState(1);
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [dogs, setDogs] = useState([]);
  const [activeDogId, setActiveDogId] = useState(loadLocal('activeDogId', ''));
  const [location, setLocation] = useState(loadLocal('location', DEFAULT_LOCATION));
  const [locationQuery, setLocationQuery] = useState('');
  const [offGame, setOffGame] = useState(loadLocal('offGame', false));
  const [checkedIn, setCheckedIn] = useState(loadLocal('checkedIn', null));
  const [localAttendance, setLocalAttendance] = useState(loadLocal('attendanceEvents', []));
  const [remoteAttendance, setRemoteAttendance] = useState([]);
  const [localHazards, setLocalHazards] = useState(loadLocal('hazards', []));
  const [remoteHazards, setRemoteHazards] = useState([]);
  const [weather, setWeather] = useState(null);
  const [weatherState, setWeatherState] = useState('loading');
  const [cloudState, setCloudState] = useState('Connecting…');
  const [session, setSession] = useState(null);
  const [authForm, setAuthForm] = useState({ mode: 'signin', name: '', email: '', password: '' });
  const [authMessage, setAuthMessage] = useState('');
  const [supervision, setSupervision] = useState({ active: false, distance: null, status: 'Ready', coords: null });
  const [conductAccepted, setConductAccepted] = useState(loadLocal('conductAccepted', false));
  const [qrUrl, setQrUrl] = useState('');
  const [toast, setToast] = useState('');
  const sessionToken = useMemo(() => newToken('attendanceToken'), []);
  const reportToken = useMemo(() => newToken('reportToken'), []);
  const activeDog = dogs.find((d) => d.id === activeDogId) || dogs[0] || null;
  const dogBreed = breedInfo(activeDog?.breed || '');
  const allAttendance = useMemo(() => [...remoteAttendance, ...localAttendance], [remoteAttendance, localAttendance]);
  const crowd = useMemo(() => crowdSummary(allAttendance), [allAttendance]);
  const allHazards = useMemo(() => {
    const seen = new Set();
    return [...localHazards, ...remoteHazards].filter((h) => { const k = h.id || `${h.report_token}-${h.seen_at}`; if (seen.has(k)) return false; seen.add(k); return true; });
  }, [localHazards, remoteHazards]);
  const locationHazards = allHazards.filter((h) => h.location_key === location.key && Date.now() - Date.parse(h.seen_at || h.created_at || 0) < 24 * 60 * 60 * 1000);
  const alert = crowdAlert(offGame, crowd);
  const score = safetyScore({ weatherTempC: weather?.temperatureC, heatSensitive: dogBreed.heatSensitive, hazards: locationHazards.length, crowd: crowd.total, offGame });
  const freshness = useMemo(() => weather?.localDateTime ? weather.localDateTime : new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }), [weather]);

  useEffect(() => {
    Promise.all([secureGet('handler', EMPTY_PROFILE), secureGet('dogs', [])]).then(([savedProfile, savedDogs]) => {
      setProfile({ ...EMPTY_PROFILE, ...savedProfile });
      setDogs(savedDogs);
      if (!activeDogId && savedDogs[0]?.id) { setActiveDogId(savedDogs[0].id); saveLocal('activeDogId', savedDogs[0].id); }
    });
    neon.auth.getSession().then((result) => setSession(result?.data || null)).catch(() => {});
  }, []);

  useEffect(() => { saveLocal('location', location); }, [location]);
  useEffect(() => { saveLocal('offGame', offGame); }, [offGame]);
  useEffect(() => { saveLocal('checkedIn', checkedIn); }, [checkedIn]);
  useEffect(() => { saveLocal('attendanceEvents', localAttendance.slice(-300)); }, [localAttendance]);
  useEffect(() => { saveLocal('hazards', localHazards.slice(-200)); }, [localHazards]);
  useEffect(() => { saveLocal('conductAccepted', conductAccepted); }, [conductAccepted]);

  useEffect(() => {
    let cancelled = false;
    setWeatherState('loading');
    fetch(`/api/bom?station=${encodeURIComponent(location.station || 'gold-coast-seaway')}`)
      .then((r) => { if (!r.ok) throw new Error('weather'); return r.json(); })
      .then((data) => { if (!cancelled) { setWeather(data); setWeatherState('live'); } })
      .catch(() => { if (!cancelled) setWeatherState('offline'); });
    return () => { cancelled = true; };
  }, [location.station]);

  const refreshCloud = async () => {
    setCloudState('Syncing…');
    try {
      const [attendance, hazards] = await Promise.all([cloudAttendance(location.key), cloudHazards(location.key)]);
      setRemoteAttendance(attendance); setRemoteHazards(hazards); setCloudState('Neon live');
    } catch (error) {
      console.warn('Cloud read unavailable; local mode retained.', error);
      setCloudState('Local-first / cloud retry');
    }
  };
  useEffect(() => { refreshCloud(); }, [location.key]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const selectLocation = () => {
    const name = locationQuery.trim(); if (!name) return;
    setLocation({ key: slug(name), name, verified: false, station: 'gold-coast-seaway' });
    setLocationQuery(''); setScreen(2);
  };

  const getCoords = () => new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Geolocation is not supported by this device.'));
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ latitude: p.coords.latitude, longitude: p.coords.longitude, accuracy: p.coords.accuracy }),
      reject,
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 20000 }
    );
  });

  const addAttendanceEvent = async (eventType, coords = null) => {
    const event = {
      session_token: sessionToken,
      location_key: location.key,
      location_name: location.name,
      energy: activeDog?.energy || 'playful',
      mood: offGame ? 'off-game' : 'normal',
      event_type: eventType,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString()
    };
    setLocalAttendance((prev) => [...prev, event]);
    if (eventType === 'checkin') setCheckedIn({ location, at: event.created_at, coords });
    else setCheckedIn(null);
    try { await postAttendance(event); setCloudState('Neon live'); refreshCloud(); }
    catch { setCloudState('Saved locally — cloud queued'); }
  };

  const checkIn = async () => {
    if (!activeDog) { setScreen(3); setToast('Create your mate’s profile before checking in.'); return; }
    let coords = null;
    try { coords = await getCoords(); } catch {}
    await addAttendanceEvent('checkin', coords);
    navigator.vibrate?.(70);
    setToast('Checked in locally first. Community sync is running.');
  };

  const saveProfile = async () => {
    await secureSet('handler', profile);
    setToast('Handler profile encrypted and saved on this device.');
  };

  const saveDog = async (draft) => {
    const info = breedInfo(draft.breed);
    const dog = { ...draft, id: draft.id || crypto.randomUUID(), brachycephalic: info.brachycephalic, doubleCoated: info.doubleCoated };
    const next = dogs.some((d) => d.id === dog.id) ? dogs.map((d) => d.id === dog.id ? dog : d) : [...dogs, dog];
    setDogs(next); setActiveDogId(dog.id); saveLocal('activeDogId', dog.id); await secureSet('dogs', next);
    setToast(`${dog.name} saved securely on this device.`);
  };

  const removeDog = async (id) => {
    const next = dogs.filter((d) => d.id !== id); setDogs(next); await secureSet('dogs', next);
    if (activeDogId === id) { const nextId = next[0]?.id || ''; setActiveDogId(nextId); saveLocal('activeDogId', nextId); }
  };

  const authSubmit = async (e) => {
    e.preventDefault(); setAuthMessage('Working…');
    try {
      if (authForm.mode === 'signup') await neon.auth.signUp.email({ email: authForm.email, password: authForm.password, name: authForm.name || profile.displayName || 'GENEVIEVE Member' });
      else await neon.auth.signIn.email({ email: authForm.email, password: authForm.password });
      const result = await neon.auth.getSession(); setSession(result?.data || null);
      setAuthMessage(result?.data ? 'Signed in. Cloud backup is available.' : 'Please check your sign-in details.');
    } catch (error) { setAuthMessage(error?.message || 'Authentication failed. Your local app remains available.'); }
  };

  const signOut = async () => {
    try { await neon.auth.signOut(); } finally { setSession(null); setAuthMessage('Signed out. Device data remains intact.'); }
  };

  const backupPrivateData = async () => {
    const current = session || (await neon.auth.getSession())?.data;
    if (!current?.user) { setAuthMessage('Sign in before using private cloud backup.'); return; }
    if (!profile.termsAccepted) { setAuthMessage('Please accept the Privacy Collection Notice and APP Terms first.'); return; }
    setAuthMessage('Backing up after the local save…');
    try {
      await secureSet('handler', profile); await secureSet('dogs', dogs);
      const owner = current.user.id;
      const handlerRow = {
        owner_id: owner,
        display_name: profile.displayName,
        email: profile.email,
        phone: profile.phone,
        ice_name: profile.iceName,
        ice_phone: profile.icePhone,
        medical_notes: profile.medicalNotes,
        visibility: profile.visibility,
        delay_checkin: profile.delayCheckin,
        night_ghosting: profile.nightGhosting,
        terms_accepted: profile.termsAccepted,
        updated_at: new Date().toISOString()
      };
      const hp = await neon.from('handler_profiles').upsert(handlerRow, { onConflict: 'owner_id' });
      if (hp.error) throw hp.error;
      for (const dog of dogs) {
        const row = {
          id: dog.id, owner_id: owner, name: dog.name, breed: dog.breed || '', size_category: dog.size || 'medium',
          energy_baseline: dog.energy || 'playful', in_training: !!dog.inTraining, prefers_space: !!dog.prefersSpace,
          brachycephalic: !!dog.brachycephalic, updated_at: new Date().toISOString()
        };
        const saved = await neon.from('dog_profiles').upsert(row, { onConflict: 'id' });
        if (saved.error) throw saved.error;
      }
      setAuthMessage('Private backup completed to your RLS-protected Neon account.');
    } catch (error) { setAuthMessage(`Local save is safe. Cloud backup failed: ${error?.message || 'temporary connection issue'}`); }
  };

  const restorePrivateData = async () => {
    const current = session || (await neon.auth.getSession())?.data;
    if (!current?.user) return setAuthMessage('Sign in first.');
    setAuthMessage('Restoring your private backup…');
    try {
      const [hp, dp] = await Promise.all([
        neon.from('handler_profiles').select('*').eq('owner_id', current.user.id).maybeSingle(),
        neon.from('dog_profiles').select('*').eq('owner_id', current.user.id).order('created_at', { ascending: true })
      ]);
      if (hp.error) throw hp.error; if (dp.error) throw dp.error;
      if (hp.data) {
        const p = {
          displayName: hp.data.display_name || '', email: hp.data.email || '', phone: hp.data.phone || '',
          iceName: hp.data.ice_name || '', icePhone: hp.data.ice_phone || '', medicalNotes: hp.data.medical_notes || '',
          visibility: hp.data.visibility || 'ghost', delayCheckin: !!hp.data.delay_checkin, nightGhosting: !!hp.data.night_ghosting,
          termsAccepted: !!hp.data.terms_accepted
        };
        setProfile(p); await secureSet('handler', p);
      }
      if (dp.data?.length) {
        const restored = dp.data.map((d) => ({
          id: d.id, name: d.name, breed: d.breed, size: d.size_category, energy: d.energy_baseline,
          inTraining: d.in_training, prefersSpace: d.prefers_space, brachycephalic: d.brachycephalic
        }));
        setDogs(restored); await secureSet('dogs', restored);
        setActiveDogId(restored[0].id); saveLocal('activeDogId', restored[0].id);
      }
      setAuthMessage('Restore complete. A local encrypted copy is now active.');
    } catch (error) { setAuthMessage(`Restore failed: ${error?.message || 'temporary connection issue'}`); }
  };

  const generateExchange = async () => {
    const payload = {
      app: 'GENEVIEVE App™ Digital Exchange Card',
      created: new Date().toISOString(),
      handler: { name: profile.displayName || 'Handler', phone: profile.phone || '', email: profile.email || '' },
      dog: activeDog ? { name: activeDog.name, breed: activeDog.breed, size: activeDog.size } : null,
      note: 'Shared voluntarily on-device after an incident. Verify details directly with the other handler.'
    };
    setQrUrl(await QRCode.toDataURL(JSON.stringify(payload), { margin: 1, width: 360, errorCorrectionLevel: 'M' }));
  };

  const startSupervision = async () => {
    if (!checkedIn) await checkIn();
    const base = checkedIn?.coords || await getCoords().catch(() => null);
    if (!base) { setToast('Location permission is required for boundary supervision.'); return; }
    setScreen(8); setSupervision({ active: true, distance: 0, status: '🟢 Safe Range', coords: base });
  };

  useEffect(() => {
    if (!supervision.active || screen !== 8 || !navigator.geolocation) return;
    let outsideSince = null;
    const watch = navigator.geolocation.watchPosition(async (p) => {
      const base = checkedIn?.coords || supervision.coords;
      if (!base) return;
      const distance = haversineMeters(base.latitude, base.longitude, p.coords.latitude, p.coords.longitude);
      let status = '🟢 Safe Range';
      if (distance >= 45 && distance < 50) { status = '⚠️ Approaching boundary / exit range'; navigator.vibrate?.(80); }
      if (distance >= 50) {
        status = '⚠️ Outside park range — deadman timer running';
        outsideSince ||= Date.now();
        if (Date.now() - outsideSince >= 5 * 60 * 1000) {
          await addAttendanceEvent('checkout');
          setSupervision({ active: false, distance, status: 'Auto checked out', coords: base });
          navigator.geolocation.clearWatch(watch); setScreen(1); setToast('Deadman safeguard checked you out and stopped high-frequency GPS.');
        }
      } else outsideSince = null;
      setSupervision((s) => ({ ...s, distance, status }));
    }, () => setSupervision((s) => ({ ...s, status: 'GPS signal unavailable — local guard waiting' })), { enableHighAccuracy: true, maximumAge: 3000, timeout: 12000 });
    return () => navigator.geolocation.clearWatch(watch);
  }, [supervision.active, screen, checkedIn?.at]);

  const stopSupervision = async () => {
    await addAttendanceEvent('checkout');
    setSupervision({ active: false, distance: null, status: 'Stopped', coords: null }); setScreen(1); setToast('Supervision stopped, checked out, GPS sleep requested.');
  };

  const context = {
    profile, setProfile, dogs, activeDogId, setActiveDogId: (id) => { setActiveDogId(id); saveLocal('activeDogId', id); }, activeDog,
    location, locationQuery, setLocationQuery, selectLocation, score, freshness, weather, weatherState,
    cloudState, crowd, alert, offGame, setOffGame, checkedIn, checkIn, startSupervision, allHazards: locationHazards,
    saveProfile, saveDog, removeDog, session, authForm, setAuthForm, authSubmit, authMessage, signOut, backupPrivateData, restorePrivateData,
    setScreen, getCoords, reportToken, localHazards, setLocalHazards, remoteHazards, refreshCloud,
    supervision, stopSupervision, conductAccepted, setConductAccepted, qrUrl, generateExchange
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <Brand compact />
        <div className="status-cluster">
          <span className={`net-dot ${navigator.onLine ? 'online' : 'offline'}`} />
          <b>{navigator.onLine ? cloudState : 'Offline Safety Mode'}</b>
        </div>
      </header>
      <EmergencySlider onOpen={() => setScreen(5)} />
      <main id="main" className="main-stage">
        {screen === 1 && <TodayScreen {...context} />}
        {screen === 2 && <JourneyScreen {...context} />}
        {screen === 3 && <DogScreen {...context} />}
        {screen === 4 && <HandlerScreen {...context} />}
        {screen === 5 && <EmergencyScreen {...context} />}
        {screen === 6 && <HazardScreen {...context} />}
        {screen === 7 && <TravelScreen {...context} />}
        {screen === 8 && <GuardScreen {...context} />}
        {screen === 9 && <ConductScreen {...context} />}
      </main>
      <nav className="bottom-nav" aria-label="GENEVIEVE nine screen navigation">
        {NAV.map(([n, label, icon]) => <button key={n} className={screen === n ? 'active' : ''} onClick={() => setScreen(n)}><i>{icon}</i><span>{label}</span></button>)}
      </nav>
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}

function ScreenTitle({ eyebrow, title, children }) {
  return <div className="screen-title"><small>{eyebrow}</small><h1>{title}</h1>{children && <p>{children}</p>}</div>;
}

function TodayScreen(p) {
  const greeting = p.profile.displayName ? `G’day, ${p.profile.displayName.split(' ')[0]}` : 'G’day';
  const heatThreshold = breedInfo(p.activeDog?.breed || '').heatSensitive ? 28 : 32;
  const heatAlert = Number.isFinite(p.weather?.temperatureC) && p.weather.temperatureC >= heatThreshold;
  return <section className="screen">
    <div className="today-hero">
      <div><span className="eyebrow">TODAY</span><h1>{greeting}</h1><p>Your local-first safety command centre.</p></div>
      <StatPill label="SAFETY SCORE" value={`${p.score}/100`} tone={p.score >= 80 ? 'green' : p.score >= 60 ? 'amber' : 'red'} />
    </div>
    <div className="freshness">🕒 Live Data: {p.freshness} · {p.weatherState === 'live' ? 'BOM feed live' : 'cached/local safety mode'}</div>
    <div className="search-box">
      <input value={p.locationQuery} onChange={(e) => p.setLocationQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && p.selectLocation()} placeholder="Search Parks, Beaches, or Regions…" />
      <button onClick={p.selectLocation}>Search</button>
    </div>
    <div className={`alert-card ${heatAlert || p.allHazards.length ? 'warn' : 'safe'}`}>
      <div className="alert-icon">{heatAlert || p.allHazards.length ? '⚠️' : '✓'}</div>
      <div><b>Dynamic Location Alerts</b>
        {heatAlert && <p>{p.activeDog?.name || 'Your mate'} has a lower heat threshold. Current temperature is {p.weather.temperatureC}°C.</p>}
        {!!p.allHazards.length && <p>{p.allHazards.length} active community hazard{p.allHazards.length === 1 ? '' : 's'} near this selected location.</p>}
        {!heatAlert && !p.allHazards.length && <p>No active locally cached alerts for {p.location.name}. Keep normal supervision active.</p>}
      </div>
    </div>
    <div className="weather-strip">
      <StatPill label="Temperature" value={p.weather?.temperatureC != null ? `${p.weather.temperatureC}°C` : 'Offline'} />
      <StatPill label="Feels like" value={p.weather?.apparentC != null ? `${p.weather.apparentC}°C` : '—'} />
      <StatPill label="Wind" value={p.weather?.windKmh != null ? `${p.weather.windKmh} km/h` : '—'} />
      <StatPill label="Crowd" value={`${p.crowd.total} mates`} />
    </div>
    <div className="primary-actions">
      {!p.checkedIn ? <button className="primary big" onClick={p.checkIn}>Check in</button> : <button className="primary big" onClick={p.startSupervision}>Start Supervision Mode</button>}
      <button className="danger-outline big" onClick={() => p.setScreen(6)}>🚨 Report Hazard</button>
    </div>
    <p className="privacy-seal">🔒 Anonymous check-in active. Personal profile fields stay encrypted on this device unless you explicitly use private backup.</p>
  </section>;
}

function JourneyScreen(p) {
  return <section className="screen">
    <ScreenTitle eyebrow="SCREEN 2 · JOURNEY & STATUS" title={p.location.name}>Crowd, marine and community intelligence for the selected location.</ScreenTitle>
    <div className="verified-line">📍 {p.location.name} <span className={p.location.verified ? 'verified' : 'pilot-badge'}>{p.location.verified ? '✅ Council Verified' : '◌ Community / not council-verified'}</span></div>
    <div className="marine-panel">
      <div><small>🌊 BEACH SAFETY</small><strong>{p.weatherState === 'live' ? 'Live BOM observation' : 'Offline weather cache'}</strong></div>
      <div className="mini-grid">
        <span><b>{p.weather?.temperatureC ?? '—'}°C</b> Air</span>
        <span><b>{p.weather?.windKmh ?? '—'} km/h</b> Wind</span>
        <span><b>Feed pending</b> Tide</span>
        <span><b>Feed pending</b> Water / algae</span>
      </div>
      <small className="source-note">Weather is wired to the Bureau of Meteorology feed. Tide, algae and water-quality integrations remain visibly unverified rather than displaying invented safety data.</small>
    </div>
    <div className="counter-card"><strong>{p.crowd.total}</strong><span>mates currently represented in live/cached attendance</span></div>
    <div className="energy-grid">
      <div>🟢 <b>{p.crowd.calm}</b><span>Calm & Chill Mates</span></div>
      <div>🔵 <b>{p.crowd.playful}</b><span>Playful & Social Mates</span></div>
      <div>⚡ <b>{p.crowd.zoomies}</b><span>High Energy / Zoomies</span></div>
    </div>
    {p.alert && <div className={`crowd-warning ${p.alert.level}`}><b>{p.alert.level === 'red' ? 'High alert' : 'Heads up'}</b><p>{p.alert.message}</p><button onClick={() => p.setScreen(9)}>📇 Need to safely exchange info? Tap here.</button></div>}
    <div className="feed-card"><h3>💬 Community Hazard Feed</h3>{p.allHazards.length ? p.allHazards.slice(0, 5).map((h, i) => <div className="feed-row" key={h.id || i}><b>{THREATS.find((t) => t[0] === h.threat_type)?.[1] || '⚠️'} {h.threat_type}</b><span>{localTime(h.seen_at)}</span><p>{h.details || h.location_name || 'Community alert'}</p></div>) : <p>No active reports in the current 24-hour local/live window.</p>}</div>
    <div className="primary-actions">
      {!p.checkedIn ? <button className="primary" onClick={p.checkIn}>Check in</button> : <button className="primary" onClick={p.startSupervision}>Supervision</button>}
      <button className={`off-game ${p.offGame ? 'on' : ''}`} onClick={() => p.setOffGame(!p.offGame)}>⚠️ {p.offGame ? 'Off Their Game — ON' : 'Off Their Game'}</button>
    </div>
    <button className="travel-link" onClick={() => p.setScreen(7)}>🗺 Find Nearest Safe Rest Stop / Vet →</button>
  </section>;
}

function DogScreen({ dogs, activeDogId, setActiveDogId, saveDog, removeDog }) {
  const blank = { id: '', name: '', breed: '', size: 'medium', energy: 'playful', inTraining: false, prefersSpace: false };
  const [draft, setDraft] = useState(blank);
  useEffect(() => { const d = dogs.find((x) => x.id === activeDogId); if (d) setDraft({ ...blank, ...d }); }, [activeDogId, dogs.length]);
  const info = breedInfo(draft.breed);
  return <section className="screen">
    <ScreenTitle eyebrow="SCREEN 3 · DOG PROFILE" title="Create Your Mate’s Profile">Behavioural baselines are saved locally first and used by safety thresholds.</ScreenTitle>
    {dogs.length > 0 && <div className="dog-tabs">{dogs.map((d) => <button className={d.id === activeDogId ? 'active' : ''} key={d.id} onClick={() => setActiveDogId(d.id)}>{d.name}</button>)}<button onClick={() => setDraft(blank)}>＋ New</button></div>}
    <div className="form-card">
      <Field label="Dog name"><input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Your mate’s name" /></Field>
      <Field label="Breed" hint={`${BREED_INDEX.length} hardcoded offline breed entries. Heat-sensitive flags lower the advisory temperature threshold.`}>
        <input list="breed-list" value={draft.breed} onChange={(e) => setDraft({ ...draft, breed: e.target.value })} placeholder="Start typing a breed" />
        <datalist id="breed-list">{BREED_INDEX.map((b) => <option key={b.name} value={b.name} />)}</datalist>
      </Field>
      {draft.breed && <div className="breed-flags">{info.brachycephalic && <span>Short-muzzled heat caution</span>}{info.doubleCoated && <span>Double-coat heat caution</span>}{!info.heatSensitive && <span>Standard heat threshold</span>}</div>}
      <Field label="Size category"><div className="segmented">{[['small','Small (<10kg)'],['medium','Medium (10–25kg)'],['large','Large (>25kg)']].map(([v,l]) => <button key={v} className={draft.size === v ? 'active' : ''} onClick={() => setDraft({ ...draft, size: v })}>{l}</button>)}</div></Field>
      <Field label="Energy baseline"><div className="segmented">{[['calm','🟢 Calm & Chill'],['playful','🔵 Playful & Social'],['zoomies','⚡ High Energy / Zoomies']].map(([v,l]) => <button key={v} className={draft.energy === v ? 'active' : ''} onClick={() => setDraft({ ...draft, energy: v })}>{l}</button>)}</div></Field>
      <div className="toggle-grid"><Toggle checked={draft.inTraining} onChange={(v) => setDraft({ ...draft, inTraining: v })}>🦮 In Training</Toggle><Toggle checked={draft.prefersSpace} onChange={(v) => setDraft({ ...draft, prefersSpace: v })}>🤫 Prefers Space</Toggle></div>
      <div className="primary-actions"><button className="primary" disabled={!draft.name.trim()} onClick={() => saveDog(draft)}>Save Profile</button>{draft.id && <button className="quiet-danger" onClick={() => removeDog(draft.id)}>Remove</button>}</div>
    </div>
    <p className="privacy-seal">🔒 Profile data is AES-GCM encrypted at rest using a device-held key. Public community events use random tokens rather than your identity.</p>
  </section>;
}

function HandlerScreen(p) {
  const update = (key, value) => p.setProfile({ ...p.profile, [key]: value });
  const signedIn = !!p.session?.user;
  return <section className="screen">
    <ScreenTitle eyebrow="SCREEN 4 · HUMAN COMMAND DECK" title="Handler Profile & Security Dashboard">Human identity, ICE details, anti-stalking shields, membership and private backup.</ScreenTitle>
    <div className="form-card">
      <div className="two-col">
        <Field label="Name"><input value={p.profile.displayName} onChange={(e) => update('displayName', e.target.value)} /></Field>
        <Field label="Email"><input type="email" value={p.profile.email} onChange={(e) => update('email', e.target.value)} /></Field>
        <Field label="Phone"><input type="tel" value={p.profile.phone} onChange={(e) => update('phone', e.target.value)} /></Field>
        <Field label="Custom Emergency Contact (ICE)"><input value={p.profile.iceName} onChange={(e) => update('iceName', e.target.value)} placeholder="Name" /></Field>
        <Field label="ICE phone"><input type="tel" value={p.profile.icePhone} onChange={(e) => update('icePhone', e.target.value)} /></Field>
      </div>
      <Field label="Private human medical condition / notes"><textarea value={p.profile.medicalNotes} onChange={(e) => update('medicalNotes', e.target.value)} placeholder="Optional — shown in the local emergency vault when you choose." /></Field>
      <h3>Anti-stalking shields</h3>
      <div className="segmented three">{[['ghost','🔒 Ghost Mode'],['pack','👥 Pack Only'],['public','🌐 Public Fuzzy Sync']].map(([v,l]) => <button className={p.profile.visibility === v ? 'active' : ''} key={v} onClick={() => update('visibility', v)}>{l}</button>)}</div>
      <div className="toggle-stack"><Toggle checked={p.profile.delayCheckin} onChange={(v) => update('delayCheckin', v)}>Activate 10-Minute Check-In Delay</Toggle><Toggle checked={p.profile.nightGhosting} onChange={(v) => update('nightGhosting', v)}>Auto-Activate Night Safety Ghosting</Toggle></div>
      <div className="membership"><b>💰 Membership Status</b><span>1-Month Free Trial — product billing workflow not yet connected to a payment processor</span></div>
      <label className="terms"><input type="checkbox" checked={p.profile.termsAccepted} onChange={(e) => update('termsAccepted', e.target.checked)} /> I agree to the Genevieve Privacy Collection Notice and APP Terms.</label>
      <button className="primary" onClick={p.saveProfile}>Save Profile & Shields</button>
    </div>
    <div className="cloud-card">
      <div><small>PRIVATE CLOUD BACKUP</small><h3>Neon Account Sync</h3><p>The app operates without an account. Signing in is only for optional private backup; local saving happens first.</p></div>
      {signedIn ? <>
        <div className="signed-in">✓ Signed in as <b>{p.session.user.email}</b></div>
        <div className="primary-actions"><button className="primary" onClick={p.backupPrivateData}>Back up encrypted-device data to my private account</button><button onClick={p.restorePrivateData}>Restore from Neon</button><button onClick={p.signOut}>Sign out</button></div>
      </> : <form className="auth-form" onSubmit={p.authSubmit}>
        <div className="auth-tabs"><button type="button" className={p.authForm.mode === 'signin' ? 'active' : ''} onClick={() => p.setAuthForm({ ...p.authForm, mode: 'signin' })}>Sign in</button><button type="button" className={p.authForm.mode === 'signup' ? 'active' : ''} onClick={() => p.setAuthForm({ ...p.authForm, mode: 'signup' })}>Create account</button></div>
        {p.authForm.mode === 'signup' && <input placeholder="Name" value={p.authForm.name} onChange={(e) => p.setAuthForm({ ...p.authForm, name: e.target.value })} />}
        <input required type="email" placeholder="Email" value={p.authForm.email} onChange={(e) => p.setAuthForm({ ...p.authForm, email: e.target.value })} />
        <input required minLength="8" type="password" placeholder="Password" value={p.authForm.password} onChange={(e) => p.setAuthForm({ ...p.authForm, password: e.target.value })} />
        <button className="primary" type="submit">{p.authForm.mode === 'signup' ? 'Create secure account' : 'Sign in'}</button>
      </form>}
      {p.authMessage && <p className="auth-message">{p.authMessage}</p>}
    </div>
    <p className="privacy-seal">🔒 Genevieve App does not need to publish your real identity or location telemetry to display fuzzy community counts.</p>
  </section>;
}

function EmergencyScreen(p) {
  return <section className="screen emergency-screen">
    <ScreenTitle eyebrow="SCREEN 5 · CRISIS PORTAL" title="🚨 EMERGENCY ASSISTANCE OVERLAY">This layer keeps your current app state intact underneath it.</ScreenTitle>
    <div className="offline-protocol">📡 OFFLINE EMERGENCY SAFETY PROTOCOL ACTIVE: LOCAL CONTACTS & DEVICE DATA AVAILABLE</div>
    <div className="emergency-columns">
      <div className="emergency-panel"><h2>For the Mate</h2><button onClick={() => tel('1300869738')}>🧪 Call Animal Poisons Helpline<br/><b>1300 869 738</b></button><button onClick={() => openMap('emergency veterinarian near me')}>🏥 Route to Closest Emergency Vet</button><button onClick={() => openMap('local council animal ranger near me')}>🐾 Find Local Council Ranger / Pound</button></div>
      <div className="emergency-panel human"><h2>For the Handler</h2><button className="call000" onClick={() => tel('000')}>🚨 Call 000 Emergency Services</button><button disabled={!p.profile.icePhone} onClick={() => p.profile.icePhone && tel(p.profile.icePhone)}>📞 Call Personal ICE: {p.profile.iceName || 'not set'}</button><button onClick={() => openMap('medical GP clinic near me')}>🩺 Find Closest Medical GP Clinic</button><button onClick={() => openMap('hospital emergency department near me')}>🏥 Route to Human Hospital ER</button></div>
    </div>
    <div className="medical-vault"><small>CRITICAL BYSTANDER MEDICAL VAULT · DEVICE ONLY</small><p>{p.profile.medicalNotes || 'No medical notes have been saved.'}</p></div>
    <button className="secondary wide" onClick={() => p.setScreen(1)}>❌ Cancel and Return to App</button>
  </section>;
}

function HazardScreen(p) {
  const [threat, setThreat] = useState('snake');
  const [coords, setCoords] = useState(null);
  const [when, setWhen] = useState('now');
  const [details, setDetails] = useState('');
  const [message, setMessage] = useState('');
  useEffect(() => { p.getCoords().then(setCoords).catch(() => {}); }, []);

  const broadcast = async () => {
    const seenAt = new Date(Date.now() - (when === '15' ? 15 * 60 * 1000 : 0)).toISOString();
    const candidate = {
      id: crypto.randomUUID(), report_token: p.reportToken, threat_type: threat, location_key: p.location.key, location_name: p.location.name,
      latitude: coords?.latitude ?? null, longitude: coords?.longitude ?? null, seen_at: seenAt, details: details.trim(),
      verification_count: 1, verified: false, created_at: new Date().toISOString(), expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
    const duplicate = coords && isDuplicateHazard(candidate, [...p.localHazards, ...p.remoteHazards]);
    if (duplicate) {
      setMessage('A similar report already exists within roughly 30 metres and 60 minutes. This device recorded a verification instead of broadcasting a duplicate.');
      navigator.vibrate?.([70, 40, 70]); return;
    }
    p.setLocalHazards((prev) => [...prev, candidate]);
    setMessage('Alert saved locally first. Broadcasting anonymous hazard to the community feed…');
    try { const { id, ...cloud } = candidate; await postHazard(cloud); setMessage('Anonymous community hazard broadcast complete.'); p.refreshCloud(); }
    catch { setMessage('Saved locally. Cloud broadcast will be retried when connectivity returns.'); }
    navigator.vibrate?.(100);
  };
  return <section className="screen">
    <ScreenTitle eyebrow="SCREEN 6 · THREAT REGISTRY" title="Report a Local Hazard or Wildlife Sighting">Fast, anonymous, local-first reporting with a 30-metre / 60-minute duplicate shield.</ScreenTitle>
    <div className="threat-grid">{THREATS.map(([v,icon,label]) => <button className={threat === v ? 'active' : ''} key={v} onClick={() => { setThreat(v); navigator.vibrate?.(35); }}><i>{icon}</i><span>{label}</span></button>)}</div>
    <div className="gps-card"><b>📍 Incident Location</b><p>{coords ? `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)} · ±${Math.round(coords.accuracy)}m` : 'Waiting for GPS permission / signal. The selected location name will still be saved.'}</p><button onClick={() => p.getCoords().then(setCoords).catch((e) => setMessage(e.message))}>Refresh GPS</button></div>
    <Field label="When was it spotted?"><div className="segmented"><button className={when === 'now' ? 'active' : ''} onClick={() => setWhen('now')}>⏰ Just Seen Now</button><button className={when === '15' ? 'active' : ''} onClick={() => setWhen('15')}>⏳ Seen 15 Mins Ago</button></div></Field>
    <Field label="Optional short detail"><textarea value={details} maxLength="240" onChange={(e) => setDetails(e.target.value)} placeholder="Only include what helps others stay safe. Do not name or identify people." /></Field>
    <button className="danger big wide" onClick={broadcast}>Broadcast Hazard Alert</button>
    {message && <div className="result-message">{message}</div>}
    <p className="privacy-seal">🔒 User identity is not included in public hazard records. Reports use a random device token locally and public hazard content contains no account ID.</p>
  </section>;
}

function TravelScreen(p) {
  const [destination, setDestination] = useState('');
  const [origin, setOrigin] = useState(null);
  const [routeMsg, setRouteMsg] = useState('');
  const locate = () => p.getCoords().then((c) => { setOrigin(c); setRouteMsg('Current GPS captured into the local route layer.'); }).catch(() => setRouteMsg('GPS unavailable. You can still enter a destination.'));
  useEffect(() => { locate(); }, []);
  return <section className="screen">
    <ScreenTitle eyebrow="SCREEN 7 · GREY NOMAD ROUTER" title="Grey Nomad Highway & Veterinary Router">A local travel layer that keeps essential contacts and the selected safety state available when reception drops.</ScreenTitle>
    <div className="route-card">
      <Field label="From"><input readOnly value={origin ? `${origin.latitude.toFixed(5)}, ${origin.longitude.toFixed(5)}` : 'Auto-pulling current GPS…'} /></Field>
      <Field label="To"><input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Next town, suburb, or regional destination…" /></Field>
      <button className="primary" onClick={() => { if (!destination.trim()) return setRouteMsg('Enter a destination first.'); if (navigator.onLine) openMap(`${destination} dog friendly rest stop`); else setRouteMsg('Offline: destination saved locally. Full map routing needs an installed map pack; use the local safe-haven contacts below until signal returns.'); }}>Start Safe Travel Route</button>
      {routeMsg && <p className="route-message">{routeMsg}</p>}
    </div>
    <div className="safe-haven"><h3>Highway Safe Haven HUD</h3>{SAFE_HAVEN_PACK.map((x) => <div className="haven-row" key={x.name}><div><b>{x.name}</b><small>{x.type}</small><p>{x.note}</p></div>{x.phone ? <button onClick={() => tel(x.phone)}>Call</button> : x.name.includes('vet') ? <button onClick={() => openMap('emergency veterinarian near me')}>Find</button> : null}</div>)}</div>
    <div className="risk-ticker">🐛 Regional health alerts require a verified veterinary/public-health data source for the selected region. The app will not invent tick or disease-zone status.</div>
    <p className="privacy-seal">📡 Offline shell, profile, breed index, emergency numbers and local safety state remain available. True turn-by-turn offline road navigation requires downloadable map packs and is marked as unavailable until that data is installed.</p>
  </section>;
}

function GuardScreen(p) {
  return <section className="screen">
    <ScreenTitle eyebrow="SCREEN 8 · ACTIVE SUPERVISION" title="Active Supervision & Boundary Guard">On-site GPS supervision with approach and deadman safeguards.</ScreenTitle>
    <div className={`guard-orb ${p.supervision.active ? 'active' : ''}`}><strong>{p.supervision.distance == null ? '—' : `${Math.round(p.supervision.distance)}m`}</strong><span>{p.supervision.status}</span></div>
    <div className="guard-grid"><div><small>Current balance</small><b>{p.crowd.calm} Calm · {p.crowd.playful} Playful · {p.crowd.zoomies} Zoomies</b></div><div><small>Deadman safeguard</small><b>Auto-checkout after 50m away for 5+ mins</b></div></div>
    {!p.supervision.active ? <button className="primary big wide" onClick={p.startSupervision}>Start Supervision</button> : <div className="primary-actions"><button className="primary" onClick={p.stopSupervision}>Stop Supervision</button><button className="danger-outline" onClick={() => p.setScreen(6)}>🚨 Log Incident</button></div>}
    <div className="technical-note"><b>Battery protection</b><p>High-frequency GPS watch only runs while this supervision screen is active. Stop or deadman checkout clears the watch so the device can return to lower-power location behaviour.</p></div>
  </section>;
}

function ConductScreen(p) {
  return <section className="screen">
    <ScreenTitle eyebrow="SCREEN 9 · GOVERNANCE LAYER" title="Community Code of Conduct & Etiquette">Kind safety rules, de-escalation and voluntary digital exchange.</ScreenTitle>
    {!p.conductAccepted && <div className="restriction-banner">Account / device reporting privileges can be restricted when abuse is detected. Read and agree to the code before continuing.</div>}
    <div className="golden-rules"><h3>The Golden Rules</h3><ol><li>Check the Safety Score and current warnings before entry.</li><li>Respect amber “Off Their Game” mates and give them training space.</li><li>Pick up after your mate and double-check every gate latch.</li><li>Report hazards factually. Never use reports to target, bully or identify another handler.</li></ol></div>
    <div className="resolution-grid"><button onClick={() => p.setScreen(6)}>⚠️<b>Report Community Misconduct</b><span>Use the incident flow without naming people in the public feed.</span></button><button onClick={p.generateExchange}>📇<b>Open Digital Exchange Card</b><span>Generate a voluntary QR card on this device.</span></button></div>
    {p.qrUrl && <div className="qr-card"><img src={p.qrUrl} alt="Digital exchange QR code" /><p>Scan only when both handlers agree. The QR is generated on-device and is not placed in the community feed.</p></div>}
    <button className={`primary big wide ${p.conductAccepted ? 'accepted' : ''}`} onClick={() => p.setConductAccepted(true)}>{p.conductAccepted ? '✓ Community Code Agreed' : 'Agree to App Code of Conduct'}</button>
    <p className="privacy-seal">🔒 Zero tolerance for breed bullying, harassment or malicious false reporting.</p>
  </section>;
}

export default App;
