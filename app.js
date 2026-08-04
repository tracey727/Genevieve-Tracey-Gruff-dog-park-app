(() => {
  'use strict';

  const BUILD = '2026.08.03.52';
  const KEY = 'genevieve_dogpark_consolidated_v44';
  const EVIDENCE_DB = 'genevieve_dogpark_evidence_v52';
  const GL = window.GenevieveLogic;
  const CONFIG = window.GENEVIEVE_CONFIG || { paymentLinks: {} };
  if (!GL) throw new Error('GENEVIEVE app logic failed to load');

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const esc = value => String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  })[character]);
  const uid = prefix => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = () => new Date().toISOString();

  const coreParks = [
    { id: 'musgrave-qld', name: 'Musgrave Park Dog Off-Leash Area', suburb: 'Labrador QLD', state: 'QLD', address: 'Musgrave Avenue, Labrador QLD', lat: -27.9467, lng: 153.3983, features: ['Fenced', 'Shade', 'Water bowl', 'Lighting', 'Toilets'], source: 'Local verified starter record' },
    { id: 'sydney-nsw', name: 'Sydney Park Off-Leash Areas', suburb: 'Alexandria NSW', state: 'NSW', address: 'Sydney Park Road, Alexandria NSW', lat: -33.9098, lng: 151.1852, features: ['Shade', 'Toilets', 'Café nearby'], source: 'Local verified starter record' },
    { id: 'ginninderra-act', name: 'Lake Ginninderra Dog Park', suburb: 'Belconnen ACT', state: 'ACT', address: 'Diddams Close, Belconnen ACT', lat: -35.2288, lng: 149.0733, features: ['Fenced', 'Shade', 'Water bowl', 'Double gate'], source: 'Local verified starter record' },
    { id: 'bayswater-vic', name: 'Bayswater Dog Park', suburb: 'Bayswater VIC', state: 'VIC', address: 'Bayswater VIC', lat: -37.8447, lng: 145.2695, features: ['Fenced', 'Shade', 'Water bowl'], source: 'Local verified starter record' },
    { id: 'north-adelaide-sa', name: 'North Adelaide Dog Park', suburb: 'North Adelaide SA', state: 'SA', address: 'Lefevre Terrace, North Adelaide SA', lat: -34.9035, lng: 138.5929, features: ['Fenced', 'Shade', 'Water bowl', 'Double gate'], source: 'Local verified starter record' },
    { id: 'south-perth-wa', name: 'South Perth Foreshore Dog Area', suburb: 'South Perth WA', state: 'WA', address: 'South Perth Foreshore WA', lat: -31.97, lng: 115.852, features: ['Water bowl', 'Toilets', 'Café nearby'], source: 'Local verified starter record' },
    { id: 'hobart-tas', name: 'Queens Walk Dog Exercise Area', suburb: 'New Town TAS', state: 'TAS', address: 'Queens Walk, New Town TAS', lat: -42.8589, lng: 147.3035, features: ['Shade', 'Water bowl'], source: 'Local verified starter record' },
    { id: 'darwin-nt', name: 'Marlow Lagoon Dog Exercise Area', suburb: 'Marlow Lagoon NT', state: 'NT', address: 'Marlow Lagoon NT', lat: -12.473, lng: 130.969, features: ['Shade', 'Water bowl', 'Quiet'], source: 'Local verified starter record' }
  ];

  const knownPlaces = [
    { names: ['brisbane', 'brisbane qld'], lat: -27.4698, lng: 153.0251 },
    { names: ['gold coast', 'gold coast qld', 'southport', 'labrador qld'], lat: -27.9672, lng: 153.397 },
    { names: ['sydney', 'sydney nsw'], lat: -33.8688, lng: 151.2093 },
    { names: ['canberra', 'canberra act'], lat: -35.2809, lng: 149.13 },
    { names: ['melbourne', 'melbourne vic'], lat: -37.8136, lng: 144.9631 },
    { names: ['adelaide', 'adelaide sa'], lat: -34.9285, lng: 138.6007 },
    { names: ['perth', 'perth wa'], lat: -31.9523, lng: 115.8613 },
    { names: ['darwin', 'darwin nt'], lat: -12.4634, lng: 130.8456 },
    { names: ['hobart', 'hobart tas'], lat: -42.8821, lng: 147.3272 },
    { names: ['launceston', 'launceston tas'], lat: -41.4332, lng: 147.1441 },
    { names: ['devonport', 'devonport tas'], lat: -41.1769, lng: 146.3515 }
  ];

  const defaultState = () => ({
    version: BUILD,
    dogs: [{
      id: 'mr-gruff', name: 'Mr Gruff', dob: '2021-08-08', breed: 'Family dog',
      note: 'Ask owner before approach', triggers: 'Needs a calm introduction',
      sociability: 7, reactivity: 3, energy: 6, tolerance: 7,
      microchip: '', weight: '', medical: '', vet: '', emergencyContact: '', status: 'calm'
    }],
    checkins: [], relationships: [], arrivals: [], plans: [], heatChecks: [], trips: [],
    evidence: [], supervisionChecks: [], discoveredParks: [], formDrafts: {},
    lastSuitability: null,
    settings: { reduceMotion: false, largeText: false, highContrast: false, shareStatus: false },
    legalAcceptance: null,
    selectedPark: 'musgrave-qld'
  });

  let state = loadState();
  let deferredInstall = null;
  let holdTimer = null;
  let currentParkResults = [];
  let evidenceTransactionActive = false;
  let messageReturnFocus = null;

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY));
      if (!saved || !Array.isArray(saved.dogs)) return defaultState();
      const defaults = defaultState();
      return {
        ...defaults,
        ...saved,
        version: BUILD,
        settings: GL.normaliseSettings({ ...defaults.settings, ...(saved.settings || {}) }),
        formDrafts: saved.formDrafts && typeof saved.formDrafts === 'object' ? saved.formDrafts : {},
        discoveredParks: Array.isArray(saved.discoveredParks) ? saved.discoveredParks : [],
        evidence: Array.isArray(saved.evidence) ? saved.evidence : [],
        supervisionChecks: Array.isArray(saved.supervisionChecks) ? saved.supervisionChecks : [],
        trips: Array.isArray(saved.trips) ? saved.trips : []
      };
    } catch {
      return defaultState();
    }
  }

  function persist(render = true) {
    state.version = BUILD;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      toast('This device could not save more local data. Export or delete older records.');
      return false;
    }
    if (render) renderAll();
    return true;
  }

  function toast(message) {
    const element = $('#toast');
    element.textContent = message;
    element.classList.add('show');
    clearTimeout(element._timer);
    element._timer = setTimeout(() => element.classList.remove('show'), 2400);
  }

  function allParks() {
    const combined = [...coreParks, ...(state.discoveredParks || [])];
    return combined.filter((item, index) => combined.findIndex(candidate => candidate.id === item.id) === index);
  }

  const dog = id => state.dogs.find(item => item.id === id);
  const park = id => allParks().find(item => item.id === id);
  const riskMarkup = score => `<strong>${score}/10 · ${GL.riskClass(score).toUpperCase()}</strong><br>${esc(GL.riskLabel(score))}`;

  function expireCheckins() {
    const current = Date.now();
    state.checkins = state.checkins.filter(checkin => new Date(checkin.expiresAt).getTime() > current);
  }

  function showScreen(name, focusHeading = true) {
    const valid = ['today', 'journey', 'parks', 'dogs', 'more'].includes(name) ? name : 'today';
    const previousScrollBehaviour = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'auto';
    $$('.screen').forEach(screen => screen.classList.toggle('active', screen.id === `screen-${valid}`));
    $$('.nav-button[data-screen]').forEach(button => {
      const active = button.dataset.screen === valid;
      button.classList.toggle('active', active);
      if (active) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
    document.body.className = document.body.className.replace(/\bscreen-\w+\b/g, '').replace(/\s+/g, ' ').trim();
    document.body.classList.add(`screen-${valid}`);
    if (focusHeading) {
      const heading = $(`#screen-${valid} h2`);
      if (heading) {
        heading.setAttribute('tabindex', '-1');
        heading.focus({ preventScroll: true });
      }
    }
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    window.scrollTo(0, 0);
    requestAnimationFrame(() => {
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      window.scrollTo(0, 0);
      requestAnimationFrame(() => { document.documentElement.style.scrollBehavior = previousScrollBehaviour; });
    });
  }

  function jump(id) {
    const destinations = {
      'journey-plan': ['journey', 'journey-plan'],
      trip: ['journey', 'trip'],
      heat: ['journey', 'heat'],
      compatibility: ['dogs', 'compatibility'],
      checkin: ['journey', 'checkin-section']
    };
    const [screen, target] = destinations[id] || ['today', 'screen-today'];
    showScreen(screen, false);
    setTimeout(() => document.getElementById(target)?.scrollIntoView({
      block: 'start', behavior: state.settings.reduceMotion ? 'auto' : 'smooth'
    }), 30);
  }

  function optionMarkup(items, selected, label = 'name') {
    return items.map(item => `<option value="${esc(item.id)}" ${item.id === selected ? 'selected' : ''}>${esc(item[label])}</option>`).join('');
  }

  function refreshSelects() {
    $$('[data-dog-select]').forEach(select => {
      const previous = select.value;
      select.innerHTML = '<option value="">Choose a dog</option>' + optionMarkup(state.dogs, previous || state.dogs[0]?.id);
      if (previous && dog(previous)) select.value = previous;
    });
    $$('[data-park-select]').forEach(select => {
      const previous = select.value;
      select.innerHTML = '<option value="">Choose a park</option>' + optionMarkup(allParks(), previous || state.selectedPark);
      if (previous && park(previous)) select.value = previous;
    });
    const quick = $('#quickDog');
    const previous = quick.value;
    quick.innerHTML = optionMarkup(state.dogs, previous || state.dogs[0]?.id);
  }

  function renderSnapshot() {
    expireCheckins();
    const selected = park(state.selectedPark);
    $('#snapshot').innerHTML = `<p><strong>${state.checkins.length}</strong> active voluntary check-in${state.checkins.length === 1 ? '' : 's'} on this device.</p><p><strong>${state.dogs.length}</strong> saved dog profile${state.dogs.length === 1 ? '' : 's'}.</p><p>Selected park: <strong>${esc(selected?.name || 'None')}</strong>.</p>`;
    const answer = $('#todayAnswer');
    if (!state.lastSuitability) {
      answer.className = 'answer yellow';
      answer.innerHTML = '<strong>Checks needed.</strong><br>Type the park and complete the current-condition check.';
      return;
    }
    answer.className = `answer ${GL.riskClass(state.lastSuitability.score)}`;
    answer.innerHTML = `${riskMarkup(state.lastSuitability.score)}<br><strong>${esc(state.lastSuitability.parkQuery)}</strong> for ${esc(dog(state.lastSuitability.dogId)?.name || 'your dog')}. <span class="muted">Checked ${new Date(state.lastSuitability.time).toLocaleString('en-AU')}.</span>`;
  }

  function renderDogs() {
    const box = $('#dogList');
    if (!state.dogs.length) {
      box.innerHTML = '<p>No dogs saved.</p>';
      return;
    }
    box.innerHTML = state.dogs.map(item => {
      const score = GL.clampRisk(1 + Number(item.reactivity) * 0.45 + Math.abs(Number(item.energy) - 6) * 0.2 + (10 - Number(item.tolerance)) * 0.25 + (10 - Number(item.sociability)) * 0.1);
      return `<article class="list-item"><header><div><h3>${esc(item.name)}</h3><span class="badge ${GL.riskClass(score)}">${score}/10 profile guide</span></div><button data-edit-dog="${esc(item.id)}" type="button">Edit</button></header><p>${esc(item.breed || 'No breed entered')} · ${esc(item.note || 'No public note')}</p><p class="muted">Current status: ${esc((item.status || 'not set').replace('-', ' '))}</p>${state.dogs.length > 1 ? `<button class="danger" data-delete-dog="${esc(item.id)}" type="button">Delete</button>` : ''}</article>`;
    }).join('');
  }

  function renderCheckins() {
    expireCheckins();
    const box = $('#checkinList');
    if (!state.checkins.length) {
      box.innerHTML = '<p>No active check-ins saved on this device.</p>';
      return;
    }
    box.innerHTML = state.checkins.map(checkin => `<article class="list-item"><h3>${esc(dog(checkin.dogId)?.name || 'Dog')} at ${esc(park(checkin.parkId)?.name || checkin.parkName || 'Park')}</h3><span class="badge ${checkin.status === 'reactive' ? 'red' : checkin.status === 'needs-space' ? 'amber' : 'green'}">${esc(checkin.status.replace('-', ' '))}</span><p class="muted">Expires ${new Date(checkin.expiresAt).toLocaleString('en-AU')}${checkin.incognito ? ' · Incognito' : ''}</p><button data-checkout="${esc(checkin.id)}" type="button">Check out</button></article>`).join('');
  }

  function renderBestMateAlert() {
    const selectedDogId = $('#quickDog').value || state.dogs[0]?.id;
    const matching = state.relationships.flatMap(relationship => {
      const linkedId = relationship.first === selectedDogId ? relationship.second : relationship.second === selectedDogId ? relationship.first : null;
      if (!linkedId) return [];
      return state.checkins.filter(checkin => checkin.dogId === linkedId && !checkin.incognito && (!relationship.park || relationship.park === checkin.parkId));
    });
    const alert = $('#bestMateAlert');
    if (!matching.length) {
      alert.className = 'answer yellow';
      alert.textContent = 'No best-mate arrival is active on this device.';
      return;
    }
    const checkin = matching[0];
    alert.className = 'answer green';
    alert.innerHTML = `<strong>Best mate arrived:</strong> ${esc(dog(checkin.dogId)?.name || 'Linked dog')} is checked in at ${esc(park(checkin.parkId)?.name || 'the preferred park')}.`;
  }

  function renderRelationships() {
    const box = $('#relationshipList');
    box.innerHTML = state.relationships.length ? state.relationships.map(relationship => `<article class="list-item"><strong>${esc(dog(relationship.first)?.name || 'Dog')} ↔ ${esc(dog(relationship.second)?.name || 'Dog')}</strong><p class="muted">Preferred park: ${esc(park(relationship.park)?.name || 'Not set')}</p><button data-delete-relationship="${esc(relationship.id)}" type="button">Remove</button></article>`).join('') : '<p>No saved relationships.</p>';
  }

  function renderTrips() {
    const box = $('#tripList');
    box.innerHTML = state.trips.length ? state.trips.map(trip => `<article class="list-item"><header><div><h3>${esc(trip.from)} → ${esc(trip.to)}</h3><span class="badge ${GL.riskClass(trip.risk || 4)}">${esc(trip.breakStops)} dog break${trip.breakStops === 1 ? '' : 's'} · ${esc(trip.overnightStops)} overnight</span></div><button class="danger" data-delete-trip="${esc(trip.id)}" type="button">Delete</button></header><p>${esc(Math.round(trip.distanceKm || 0))} km · ${esc(formatDuration(trip.durationMinutes || 0))} · ${esc(trip.intervalMinutes)}-minute maximum between planned dog breaks</p><a class="button-link" target="_blank" rel="noopener" href="${esc(trip.routeUrl)}">Open saved route</a></article>`).join('') : '<p>No trips saved on this device.</p>';
  }

  function renderEvidence() {
    const box = $('#evidenceList');
    if (!state.evidence.length) {
      box.innerHTML = '<p>No implementation evidence saved on this device.</p>';
      return;
    }
    box.innerHTML = state.evidence.map(record => {
      const recordLabel = `${record.category} at ${record.location}`;
      return `<article class="list-item" data-evidence-record="${esc(record.id)}"><header><div><h3>${esc(record.category)} · ${esc(record.location)}</h3><span class="badge ${GL.riskClass(record.risk)}">${esc(record.risk)}/10</span></div><button class="danger" data-delete-evidence="${esc(record.id)}" type="button" aria-label="Delete evidence record: ${esc(recordLabel)}">Delete</button></header><p><strong>Observed:</strong> ${esc(record.observation)}</p><p><strong>Action:</strong> ${esc(record.action)}</p><p><strong>Outcome:</strong> ${esc(record.outcome)}</p><p class="muted">${esc(record.role)} · ${new Date(record.observedAt).toLocaleString('en-AU')}${record.attachmentName ? ` · attachment: ${esc(record.attachmentName)}` : ''}</p>${record.attachmentStored ? `<button data-download-evidence="${esc(record.id)}" type="button" aria-label="Download attachment for evidence record: ${esc(recordLabel)}">Download attachment</button>` : ''}</article>`;
    }).join('');
  }

  function applySettings() {
    const settings = GL.normaliseSettings(state.settings);
    state.settings = settings;
    document.documentElement.classList.toggle('reduce-motion-root', settings.reduceMotion);
    document.documentElement.classList.toggle('large-text-root', settings.largeText);
    document.body.classList.toggle('reduce-motion', settings.reduceMotion);
    document.body.classList.toggle('large-text', settings.largeText);
    document.body.classList.toggle('high-contrast', settings.highContrast);
    $('#reduceMotion').checked = settings.reduceMotion;
    $('#largeText').checked = settings.largeText;
    $('#highContrast').checked = settings.highContrast;
    $('#shareStatus').checked = settings.shareStatus;
  }

  function renderLegal() {
    const acceptance = state.legalAcceptance;
    $('#legalMessage').textContent = acceptance ? `Accepted on this device ${new Date(acceptance.time).toLocaleString('en-AU')} · legal version ${acceptance.version}.` : 'Not accepted on this device yet.';
  }

  function renderAll() {
    refreshSelects();
    renderSnapshot();
    renderDogs();
    renderCheckins();
    renderBestMateAlert();
    renderRelationships();
    renderTrips();
    renderEvidence();
    applySettings();
    renderLegal();
    const selected = park(state.selectedPark);
    $('#directionsLink').href = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(selected?.address || 'dog park Australia')}`;
  }

  function serialiseForm(form) {
    const draft = {};
    const names = [...new Set($$('[name]', form).filter(element => element.type !== 'file' && !element.disabled).map(element => element.name))];
    names.forEach(name => {
      const elements = $$('[name]', form).filter(element => element.name === name);
      const first = elements[0];
      if (!first) return;
      if (first.type === 'checkbox') draft[name] = elements.length === 1 ? first.checked : elements.filter(element => element.checked).map(element => element.value);
      else if (first.type === 'radio') draft[name] = elements.find(element => element.checked)?.value || '';
      else if (first.multiple) draft[name] = [...first.selectedOptions].map(option => option.value);
      else draft[name] = first.value;
    });
    return draft;
  }

  function restoreForm(form, draft) {
    if (!draft) return;
    Object.entries(draft).forEach(([name, value]) => {
      const elements = $$('[name]', form).filter(element => element.name === name);
      if (!elements.length) return;
      if (elements[0].type === 'checkbox') {
        elements.forEach(element => { element.checked = Array.isArray(value) ? value.includes(element.value) : !!value; });
      } else if (elements[0].type === 'radio') {
        elements.forEach(element => { element.checked = element.value === value; });
      } else if (elements[0].multiple && Array.isArray(value)) {
        [...elements[0].options].forEach(option => { option.selected = value.includes(option.value); });
      } else {
        elements[0].value = value;
      }
    });
  }

  function installFormPersistence() {
    $$('form[data-persist]').forEach(form => {
      restoreForm(form, state.formDrafts[form.id]);
      const saveDraft = () => {
        if (form.dataset.transactionBusy === 'true') return;
        state.formDrafts[form.id] = serialiseForm(form);
        persist(false);
      };
      form.addEventListener('input', saveDraft);
      form.addEventListener('change', saveDraft);
    });
  }

  function clearFormDraft(form) {
    delete state.formDrafts[form.id];
    persist(false);
  }

  async function fetchJson(url, timeoutMs = 15000) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } finally {
      clearTimeout(timeout);
    }
  }

  function normaliseText(value) {
    return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  }

  async function searchLiveParks(query, stateCode = '') {
    const terms = ['dog park', query, stateCode, 'Australia'].filter(Boolean).join(', ');
    const params = new URLSearchParams({ q: terms, format: 'jsonv2', addressdetails: '1', namedetails: '1', countrycodes: 'au', limit: '12' });
    const results = await fetchJson(`https://nominatim.openstreetmap.org/search?${params}`);
    return results.map(result => {
      const display = result.display_name || 'Map result';
      const name = result.namedetails?.name || display.split(',')[0];
      const addressState = result.address?.state || result.address?.territory || stateCode;
      return {
        id: `osm-${result.osm_type || 'place'}-${result.osm_id}`,
        name,
        suburb: [result.address?.suburb || result.address?.town || result.address?.city || result.address?.municipality, addressState].filter(Boolean).join(' '),
        state: stateCode || addressState,
        address: display,
        lat: Number(result.lat),
        lng: Number(result.lon),
        features: ['Live map result — features not verified'],
        source: 'OpenStreetMap live result'
      };
    }).filter(result => Number.isFinite(result.lat) && Number.isFinite(result.lng));
  }

  function localParkMatches(query, stateCode, wanted = []) {
    const normalised = normaliseText(query);
    return allParks().filter(item => {
      const haystack = normaliseText(`${item.name} ${item.suburb} ${item.address} ${(item.features || []).join(' ')}`);
      return (!stateCode || item.state === stateCode || String(item.address).includes(stateCode))
        && (!normalised || haystack.includes(normalised))
        && wanted.every(feature => (item.features || []).includes(feature));
    });
  }

  function uniqueParks(items) {
    const seen = new Set();
    return items.filter(item => {
      const key = `${normaliseText(item.name)}|${Number(item.lat).toFixed(4)}|${Number(item.lng).toFixed(4)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function renderParkResults(items, fallbackQuery = '') {
    currentParkResults = items;
    const box = $('#parkResults');
    if (!items.length) {
      const href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`dog parks ${fallbackQuery} Australia`)}`;
      box.innerHTML = `<p>No in-app match was returned.</p><a class="button-link" target="_blank" rel="noopener" href="${href}">Search this area in Google Maps</a>`;
      return;
    }
    box.innerHTML = items.map(item => `<button class="park-result" data-park-result="${esc(item.id)}" type="button"><b>${esc(item.name)}</b><small>${esc(item.suburb || item.address)} · ${esc((item.features || []).join(', '))}</small></button>`).join('');
  }

  async function runParkSearch(form) {
    const formData = new FormData(form);
    const query = String(formData.get('query') || '').trim();
    const stateCode = String(formData.get('state') || '');
    const wanted = formData.getAll('needs');
    if (!query) {
      $('#parkSearchStatus').textContent = 'Type a park, suburb or town first.';
      return;
    }
    $('#parkSearchStatus').textContent = 'Finding available Australian park matches…';
    let live = [];
    let liveFailed = false;
    try {
      live = await searchLiveParks(query, stateCode);
    } catch {
      liveFailed = true;
    }
    const local = localParkMatches(query, stateCode, wanted);
    const combined = uniqueParks([...local, ...live]).filter(item => wanted.every(feature => (item.features || []).includes(feature) || String(item.source).includes('OpenStreetMap')));
    if (live.length) {
      state.discoveredParks = uniqueParks([...live, ...state.discoveredParks]).slice(0, 30);
      persist(false);
    }
    renderParkResults(combined, `${query} ${stateCode}`);
    $('#parkSearchStatus').textContent = liveFailed
      ? `${combined.length} saved match${combined.length === 1 ? '' : 'es'} shown. Live search was unavailable; use the Google Maps fallback and verify details.`
      : `${combined.length} available match${combined.length === 1 ? '' : 'es'}. Choose one to open its map.`;
    refreshSelects();
  }

  function selectPark(selected) {
    if (!selected) return;
    if (!park(selected.id)) state.discoveredParks.unshift(selected);
    state.selectedPark = selected.id;
    persist(false);
    $('#mapCard').hidden = false;
    $('#mapTitle').textContent = `${selected.name} — ${selected.address}`;
    $('#parkMap').src = `https://www.google.com/maps?q=${encodeURIComponent(selected.address)}&output=embed`;
    $('#mapDirections').href = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(selected.address)}`;
    $('#mapSearch').href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`dog friendly places near ${selected.address}`)}`;
    renderAll();
    $('#mapCard').scrollIntoView({ behavior: state.settings.reduceMotion ? 'auto' : 'smooth', block: 'start' });
  }

  function formatDuration(minutes) {
    const total = Math.max(0, Math.round(Number(minutes) || 0));
    const hours = Math.floor(total / 60);
    const remainder = total % 60;
    return `${hours ? `${hours} hr ` : ''}${remainder ? `${remainder} min` : ''}`.trim() || '0 min';
  }

  async function geocodeAustralianPlace(text) {
    const query = normaliseText(text);
    const localPark = allParks().find(item => normaliseText(`${item.name} ${item.suburb} ${item.address}`).includes(query));
    if (localPark) return { name: localPark.address, lat: localPark.lat, lng: localPark.lng, source: 'saved' };
    const known = knownPlaces.find(place => place.names.some(name => query === normaliseText(name) || query.includes(normaliseText(name))));
    if (known) return { name: text, lat: known.lat, lng: known.lng, source: 'saved' };
    const params = new URLSearchParams({ q: `${text}, Australia`, format: 'jsonv2', countrycodes: 'au', limit: '1' });
    const results = await fetchJson(`https://nominatim.openstreetmap.org/search?${params}`);
    if (!results[0]) throw new Error(`Australian place not found: ${text}`);
    return { name: results[0].display_name || text, lat: Number(results[0].lat), lng: Number(results[0].lon), source: 'live' };
  }

  async function calculateRoadRoute(from, to) {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson&steps=false`;
    const data = await fetchJson(url, 20000);
    const route = data.routes?.[0];
    if (!route) throw new Error('No road route returned');
    return {
      distanceKm: route.distance / 1000,
      durationMinutes: route.duration / 60,
      coordinates: route.geometry?.coordinates || [[from.lng, from.lat], [to.lng, to.lat]],
      estimated: false
    };
  }

  function tripResultMarkup(trip) {
    const stopItems = trip.stopCoordinates.map((coordinate, index) => {
      const progressMinutes = Math.round(trip.durationMinutes * (index + 1) / (trip.breakStops + 1));
      const query = `dog park or safe dog rest area near ${coordinate[1].toFixed(5)},${coordinate[0].toFixed(5)}`;
      return `<li><strong>Required dog break ${index + 1} of ${trip.breakStops}</strong> — about ${esc(formatDuration(progressMinutes))} into the route. <a target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}">Choose and verify a nearby stop</a></li>`;
    }).join('');
    const ferry = trip.ferryRequired ? '<div class="answer amber"><strong>Ferry checkpoint required.</strong><br>This route crosses between mainland Australia and Tasmania. Confirm sailing, vehicle, kennel/pet-deck, check-in and animal-access rules directly with the ferry operator before departure. Ferry time is not assumed to be a dog toilet break.</div>' : '';
    const sourceNote = trip.estimated ? 'Live road routing was unavailable, so this is a conservative straight-line road estimate. Recalculate online before departure.' : 'Live road route calculated. Recheck after any route, closure or ferry change.';
    return `<strong>${trip.risk}/10 · ${GL.riskClass(trip.risk).toUpperCase()} planning result.</strong><br><strong>${Math.round(trip.distanceKm)} km · ${esc(formatDuration(trip.durationMinutes))}</strong><br>The app set a maximum of <strong>${trip.intervalMinutes} minutes</strong> between planned dog breaks for ${esc(trip.dogName)}. Minimum required dog breaks: <strong>${trip.breakStops}</strong>. Minimum overnight stops at a maximum seven-hour driving day: <strong>${trip.overnightStops}</strong>.<p>${esc(sourceNote)}</p>${trip.breakStops ? `<ol class="trip-stops">${stopItems}</ol>` : '<p>No en-route dog break is calculated for this short route. Check the dog before leaving and again on arrival.</p>'}${ferry}<div class="button-row"><a class="button-link" target="_blank" rel="noopener" href="${esc(trip.routeUrl)}">Open full driving route</a><a class="button-link" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`emergency vets between ${trip.from} and ${trip.to}`)}">Emergency vets on route</a><a class="button-link" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`pet friendly accommodation ${trip.to}`)}">Pet-friendly stays</a></div>`;
  }

  function cloneStateSnapshot(value = state) {
    return JSON.parse(JSON.stringify(value));
  }

  function writeStateSnapshot(nextState) {
    nextState.version = BUILD;
    localStorage.setItem(KEY, JSON.stringify(nextState));
  }

  function restoreStorageSnapshot(rawSnapshot) {
    if (rawSnapshot === null) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, rawSnapshot);
  }

  function setEvidenceStatus(message, tone = '') {
    const status = $('#evidence-result-status-id');
    status.className = tone ? `answer ${tone}` : 'muted';
    status.textContent = message;
  }

  function setEvidenceBusy(form, busy, busyLabel = 'Saving evidence…') {
    form.dataset.transactionBusy = String(busy);
    form.setAttribute('aria-busy', String(busy));
    const submitButton = $('#evidenceSubmitButton');
    submitButton.disabled = busy;
    submitButton.textContent = busy ? busyLabel : 'Save dated evidence record';
    $('#evidenceList').setAttribute('aria-busy', String(busy));
  }

  function openEvidenceDatabase() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) return reject(new Error('Attachment storage is unavailable on this device.'));
      const request = indexedDB.open(EVIDENCE_DB, 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains('attachments')) request.result.createObjectStore('attachments');
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Evidence attachment storage failed.'));
      request.onblocked = () => reject(new Error('Evidence attachment storage is blocked by another open app tab.'));
    });
  }

  async function storeAttachment(id, file) {
    if (!file) return false;
    const validation = GL.validateAttachmentMetadata(file);
    if (!validation.valid) throw new Error(validation.errors[0].message);
    const database = await openEvidenceDatabase();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction('attachments', 'readwrite');
      transaction.objectStore('attachments').put(file, id);
      transaction.oncomplete = () => { database.close(); resolve(true); };
      transaction.onerror = () => { database.close(); reject(transaction.error || new Error('Attachment write failed.')); };
      transaction.onabort = () => { database.close(); reject(transaction.error || new Error('Attachment write was cancelled.')); };
    });
  }

  async function readAttachment(id) {
    const database = await openEvidenceDatabase();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction('attachments', 'readonly');
      const request = transaction.objectStore('attachments').get(id);
      request.onsuccess = () => { database.close(); resolve(request.result); };
      request.onerror = () => { database.close(); reject(request.error || new Error('Attachment read failed.')); };
      transaction.onabort = () => { database.close(); reject(transaction.error || new Error('Attachment read was cancelled.')); };
    });
  }

  async function deleteAttachmentStrict(id) {
    const database = await openEvidenceDatabase();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction('attachments', 'readwrite');
      transaction.objectStore('attachments').delete(id);
      transaction.oncomplete = () => { database.close(); resolve(true); };
      transaction.onerror = () => { database.close(); reject(transaction.error || new Error('Attachment deletion failed.')); };
      transaction.onabort = () => { database.close(); reject(transaction.error || new Error('Attachment deletion was cancelled.')); };
    });
  }

  async function commitEvidenceMutation({ snapshotState, snapshotStorage, optimisticState, applyAttachment, rollbackAttachment }) {
    let attachmentApplied = false;
    try {
      if (applyAttachment) {
        await applyAttachment();
        attachmentApplied = true;
      }
      state = GL.resolveAtomicState(snapshotState, optimisticState, true);
      renderEvidence();
      writeStateSnapshot(state);
      return true;
    } catch (error) {
      const rollbackErrors = [];
      if (attachmentApplied && rollbackAttachment) {
        try {
          await rollbackAttachment();
        } catch (rollbackError) {
          rollbackErrors.push(rollbackError);
        }
      }
      try {
        restoreStorageSnapshot(snapshotStorage);
      } catch (rollbackError) {
        rollbackErrors.push(rollbackError);
      }
      state = GL.resolveAtomicState(snapshotState, optimisticState, false);
      renderEvidence();
      if (rollbackErrors.length) {
        throw new Error(`${error.message || 'Evidence transaction failed.'} The historical state was restored in memory, but attachment or local storage rollback could not be fully verified.`);
      }
      throw error;
    }
  }

  function clearEvidenceDatabase() {
    if (window.indexedDB) indexedDB.deleteDatabase(EVIDENCE_DB);
  }

  $$('.nav-button[data-screen]').forEach(button => button.addEventListener('click', () => showScreen(button.dataset.screen)));
  $$('[data-jump]').forEach(button => button.addEventListener('click', () => jump(button.dataset.jump)));

  $('#todaySuitabilityForm').addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const selectedDog = dog(data.get('dog'));
    if (!selectedDog) return toast('Choose a dog first');
    const score = GL.calculateParkSuitability({
      status: selectedDog.status,
      crowd: data.get('crowd'),
      boundary: data.get('boundary'),
      gate: data.get('gate'),
      water: !!data.get('water'),
      shade: !!data.get('shade'),
      hotSurface: !!data.get('hotSurface'),
      canSupervise: !!data.get('canSupervise')
    });
    state.lastSuitability = { score, dogId: selectedDog.id, parkQuery: String(data.get('parkQuery')).trim(), time: now() };
    state.plans.unshift({ id: uid('suitability'), type: 'park-suitability', ...state.lastSuitability });
    persist();
    toast('Current park result saved');
  });

  $('#todayFindPark').addEventListener('click', () => {
    const query = $('#todayParkQuery').value.trim();
    if (!query) return toast('Type a park or area first');
    showScreen('parks', false);
    $('#parkQuery').value = query;
    state.formDrafts.parkSearchForm = { ...(state.formDrafts.parkSearchForm || {}), query };
    persist(false);
    $('#parkSearchForm').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  });

  $('.quick-status').addEventListener('click', event => {
    const button = event.target.closest('[data-status]');
    if (!button) return;
    const selectedDog = dog($('#quickDog').value);
    if (!selectedDog) return toast('Choose a dog first');
    selectedDog.status = button.dataset.status;
    persist();
    $('#quickMessage').textContent = `${selectedDog.name} updated to ${button.textContent}.`;
    toast('Status saved');
  });

  $('#myDogArrived').addEventListener('click', () => jump('checkin'));
  $('#myDogLeft').addEventListener('click', () => {
    const selectedDogId = $('#quickDog').value;
    const before = state.checkins.length;
    state.checkins = state.checkins.filter(checkin => checkin.dogId !== selectedDogId);
    if (state.checkins.length === before) return toast('This dog is not checked in');
    persist();
    toast('My dog has left — checked out');
  });

  $('#planForm').addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const completed = ['lead', 'bags', 'water', 'id', 'vaccination'].filter(name => data.get(name)).length;
    let score = completed === 5 ? 2 : completed >= 3 ? 5 : 7;
    if (data.get('temperament') === 'needs-space') score += 2;
    if (data.get('temperament') === 'reactive') score += 5;
    if (data.get('temperament') === 'unwell') score += 7;
    score = GL.clampRisk(score);
    const result = $('#planResult');
    result.className = `answer ${GL.riskClass(score)}`;
    result.innerHTML = `${riskMarkup(score)}<br>${completed}/5 supplies and checks completed.`;
    state.selectedPark = data.get('park');
    state.plans.unshift({ id: uid('plan'), type: 'pre-arrival', dogId: data.get('dog'), parkId: data.get('park'), score, time: now() });
    persist();
  });

  $('#arrivalForm').addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const completed = ['lead', 'path', 'gate', 'inner'].filter(name => data.get(name)).length;
    const score = completed === 4 ? 2 : completed >= 2 ? 6 : 9;
    const result = $('#arrivalResult');
    result.className = `answer ${GL.riskClass(score)}`;
    result.innerHTML = `${riskMarkup(score)}<br>${completed}/4 arrival checks completed.`;
    state.arrivals.unshift({ id: uid('arrival'), completed, score, time: now() });
    persist();
  });

  $('#supervisionButton').addEventListener('click', () => {
    const record = { id: uid('supervision'), time: now(), dogId: $('#quickDog').value, parkId: state.selectedPark };
    state.supervisionChecks.unshift(record);
    $('#supervisionMessage').textContent = `Confirmed ${new Date(record.time).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}. Continue active supervision.`;
    persist(false);
    toast('Supervision confirmation saved');
  });

  $('#checkinForm').addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (!data.get('dog') || !data.get('park')) return toast('Choose a dog and park');
    const minutes = Number(data.get('minutes'));
    state.checkins = state.checkins.filter(checkin => checkin.dogId !== data.get('dog'));
    state.checkins.unshift({
      id: uid('checkin'), dogId: data.get('dog'), parkId: data.get('park'), status: data.get('status'),
      incognito: !!data.get('incognito'), startedAt: now(), expiresAt: new Date(Date.now() + minutes * 60000).toISOString()
    });
    state.selectedPark = data.get('park');
    const selectedDog = dog(data.get('dog'));
    if (selectedDog) selectedDog.status = data.get('status');
    persist();
    toast('Check-in saved');
  });

  $('#checkinList').addEventListener('click', event => {
    const button = event.target.closest('[data-checkout]');
    if (!button) return;
    state.checkins = state.checkins.filter(checkin => checkin.id !== button.dataset.checkout);
    persist();
    toast('Checked out');
  });

  $('#heatForm').addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const score = GL.calculateHeatRisk({
      temp: data.get('temp'), humidity: data.get('humidity'), uv: data.get('uv'),
      sun: !!data.get('sun'), shade: !!data.get('shade'), water: !!data.get('water'),
      hotSurface: !!data.get('surface'), vulnerable: !!data.get('vulnerable')
    });
    const result = $('#heatResult');
    result.className = `answer ${GL.riskClass(score)}`;
    result.innerHTML = `${riskMarkup(score)}<br>${score >= 8 ? 'Do not exercise in these conditions. Move to cooling and obtain professional help for heat-illness signs.' : score >= 6 ? 'Delay the visit or add strong cooling, shade and surface controls.' : 'Keep monitoring the dog, surface, shade, water and changing weather.'}`;
    state.heatChecks.unshift({ id: uid('heat'), score, dogId: data.get('dog'), parkId: data.get('park'), time: now() });
    state.selectedPark = data.get('park');
    persist();
  });

  $('#tripForm').addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const fromText = String(data.get('from') || '').trim();
    const toText = String(data.get('to') || '').trim();
    const selectedDog = dog(data.get('dog'));
    if (!selectedDog || !fromText || !toText || normaliseText(fromText) === normaliseText(toText)) return toast('Choose a dog and enter two different Australian places');
    const button = $('button[type="submit"]', form);
    button.disabled = true;
    $('#tripResult').className = 'answer yellow';
    $('#tripResult').textContent = 'Calculating the Australian route and required dog stops…';
    try {
      const [from, to] = await Promise.all([geocodeAustralianPlace(fromText), geocodeAustralianPlace(toText)]);
      let route;
      try {
        route = await calculateRoadRoute(from, to);
      } catch {
        const estimate = GL.estimateRoadRoute([from.lng, from.lat], [to.lng, to.lat]);
        route = { ...estimate, coordinates: [[from.lng, from.lat], [to.lng, to.lat]], estimated: true };
      }
      const intervalMinutes = GL.dogBreakIntervalMinutes(selectedDog, data.get('travelCondition'));
      const breakStops = GL.requiredBreakStops(route.durationMinutes, intervalMinutes);
      const overnightStops = GL.requiredOvernightStops(route.durationMinutes, 420);
      const ferryRequired = GL.crossesTasmania(fromText, toText);
      const stopCoordinates = GL.sampleRouteCoordinates(route.coordinates, breakStops);
      const routeUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(fromText)}&destination=${encodeURIComponent(toText)}&travelmode=driving`;
      const risk = ferryRequired ? 6 : route.estimated ? 5 : 3;
      const trip = {
        id: uid('trip'), from: fromText, to: toText, dogId: selectedDog.id, dogName: selectedDog.name,
        budget: Number(data.get('budget')) || 0, intervalMinutes, breakStops, overnightStops,
        distanceKm: route.distanceKm, durationMinutes: route.durationMinutes, stopCoordinates,
        estimated: route.estimated, ferryRequired, risk, routeUrl, time: now()
      };
      state.trips.unshift(trip);
      state.trips = state.trips.slice(0, 30);
      persist();
      const result = $('#tripResult');
      result.className = `answer ${GL.riskClass(risk)}`;
      result.innerHTML = tripResultMarkup(trip);
      toast('Complete trip and required stops saved');
    } catch (error) {
      $('#tripResult').className = 'answer red';
      $('#tripResult').innerHTML = `<strong>9/10 · ROUTE NOT SAFE TO RELY ON YET.</strong><br>${esc(error.message || 'The places could not be resolved')}. Check the spelling and include the Australian suburb, town and state. The app will not ask you to guess the required stops.`;
    } finally {
      button.disabled = false;
    }
  });

  $('#tripList').addEventListener('click', event => {
    const button = event.target.closest('[data-delete-trip]');
    if (!button) return;
    state.trips = state.trips.filter(trip => trip.id !== button.dataset.deleteTrip);
    persist();
  });

  const needs = ['Accessibility', 'Beach', 'Café nearby', 'Caravan parking', 'Double gate', 'Fenced', 'Lighting', 'Quiet', 'Shade', 'Toilets', 'Water bowl'];
  $('#needFilters').innerHTML = needs.sort().map(item => `<label><input type="checkbox" name="needs" value="${esc(item)}"> ${esc(item)}</label>`).join('');
  $('#parkSearchForm').addEventListener('submit', event => { event.preventDefault(); runParkSearch(event.currentTarget); });
  $('#clearParkSearch').addEventListener('click', () => {
    $('#parkSearchForm').reset();
    clearFormDraft($('#parkSearchForm'));
    $('#parkResults').innerHTML = '<p>Type a destination above.</p>';
    $('#parkSearchStatus').textContent = 'Type where you want to search. The map stays closed until you choose a result.';
    $('#mapCard').hidden = true;
  });
  $('#useLocation').addEventListener('click', () => {
    if (!navigator.geolocation) return toast('Location is unavailable');
    $('#parkSearchStatus').textContent = 'Requesting your location…';
    navigator.geolocation.getCurrentPosition(async position => {
      try {
        const params = new URLSearchParams({ lat: position.coords.latitude, lon: position.coords.longitude, format: 'jsonv2', addressdetails: '1' });
        const result = await fetchJson(`https://nominatim.openstreetmap.org/reverse?${params}`);
        const location = result.address?.suburb || result.address?.town || result.address?.city || result.display_name;
        $('#parkQuery').value = location;
        $('#parkSearchForm').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      } catch {
        const here = [position.coords.longitude, position.coords.latitude];
        const sorted = [...allParks()].sort((a, b) => GL.haversineKm(here, [a.lng, a.lat]) - GL.haversineKm(here, [b.lng, b.lat]));
        renderParkResults(sorted);
        $('#parkSearchStatus').textContent = 'Nearest saved parks are listed. Live local search was unavailable; verify in Google Maps.';
      }
    }, () => { $('#parkSearchStatus').textContent = 'Location permission was not available. Type a suburb or town instead.'; });
  });
  $('#parkResults').addEventListener('click', event => {
    const button = event.target.closest('[data-park-result]');
    if (!button) return;
    selectPark(currentParkResults.find(item => item.id === button.dataset.parkResult) || park(button.dataset.parkResult));
  });

  $('#dogForm').addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const id = data.get('id') || uid('dog');
    const existing = dog(id);
    const record = {
      id, name: String(data.get('name')).trim(), dob: data.get('dob'), breed: data.get('breed'), note: data.get('note'), triggers: data.get('triggers'),
      sociability: Number(data.get('sociability')), reactivity: Number(data.get('reactivity')), energy: Number(data.get('energy')), tolerance: Number(data.get('tolerance')),
      microchip: data.get('microchip'), weight: data.get('weight'), medical: data.get('medical'), vet: data.get('vet'), emergencyContact: data.get('emergencyContact'),
      status: existing?.status || 'calm'
    };
    if (existing) Object.assign(existing, record);
    else state.dogs.push(record);
    clearFormDraft(event.currentTarget);
    event.currentTarget.reset();
    event.currentTarget.elements.id.value = '';
    persist();
    toast('Dog profile saved');
  });
  $('#clearDogForm').addEventListener('click', () => {
    $('#dogForm').reset();
    $('#dogForm').elements.id.value = '';
    clearFormDraft($('#dogForm'));
  });
  $('#dogList').addEventListener('click', event => {
    const edit = event.target.closest('[data-edit-dog]');
    const remove = event.target.closest('[data-delete-dog]');
    if (edit) {
      const selectedDog = dog(edit.dataset.editDog);
      const form = $('#dogForm');
      Object.keys(selectedDog).forEach(key => { if (form.elements[key]) form.elements[key].value = selectedDog[key] ?? ''; });
      form.scrollIntoView({ behavior: state.settings.reduceMotion ? 'auto' : 'smooth' });
    }
    if (remove && confirm('Delete this dog profile from this device?')) {
      state.dogs = state.dogs.filter(item => item.id !== remove.dataset.deleteDog);
      state.checkins = state.checkins.filter(checkin => checkin.dogId !== remove.dataset.deleteDog);
      state.relationships = state.relationships.filter(relationship => relationship.first !== remove.dataset.deleteDog && relationship.second !== remove.dataset.deleteDog);
      persist();
    }
  });

  $('#compatForm').addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const first = dog(data.get('first'));
    const second = dog(data.get('second'));
    if (!first || !second || first.id === second.id) {
      $('#compatResult').className = 'answer yellow';
      $('#compatResult').textContent = 'Choose two different dogs.';
      return;
    }
    const score = GL.calculateCompatibilityRisk(first, second, { crowd: data.get('crowd'), group: data.get('group') });
    $('#compatResult').className = `answer ${GL.riskClass(score)}`;
    $('#compatResult').innerHTML = `${riskMarkup(score)}<br>${score >= 8 ? 'Do not introduce now. Create distance and leave if arousal is escalating.' : score >= 6 ? 'Use distance and a short controlled introduction outside the gate, or delay.' : 'Observe both dogs continuously and stop at the first sign of discomfort.'}`;
  });

  $('#bestMateForm').addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (!data.get('first') || !data.get('second') || data.get('first') === data.get('second')) return toast('Choose two different dogs');
    state.relationships.push({ id: uid('relationship'), first: data.get('first'), second: data.get('second'), park: data.get('park') });
    persist();
    toast('Best-mate relationship saved');
  });
  $('#relationshipList').addEventListener('click', event => {
    const button = event.target.closest('[data-delete-relationship]');
    if (!button) return;
    state.relationships = state.relationships.filter(relationship => relationship.id !== button.dataset.deleteRelationship);
    persist();
  });

  $('#evidenceRiskOutput').textContent = '4 — Yellow';
  $('#evidenceForm').elements.risk.addEventListener('input', event => {
    const score = Number(event.target.value);
    $('#evidenceRiskOutput').textContent = `${score} — ${GL.riskClass(score).replace(/^./, character => character.toUpperCase())}`;
  });

  $('#evidenceForm').addEventListener('submit', async event => {
    event.preventDefault();
    if (evidenceTransactionActive) return;

    const form = event.currentTarget;
    const data = new FormData(form);
    const file = form.elements.attachment.files?.[0] || null;
    const validation = GL.validateEvidenceRecord({
      location: data.get('location'),
      role: data.get('role'),
      category: data.get('category'),
      observedAt: data.get('observedAt'),
      risk: data.get('risk'),
      observation: data.get('observation'),
      action: data.get('action'),
      outcome: data.get('outcome'),
      deidentified: form.elements.deidentified.checked
    });

    if (!validation.valid) {
      const firstError = validation.errors[0];
      setEvidenceStatus(firstError.message, 'red');
      form.elements[firstError.field]?.focus();
      return;
    }

    const attachmentValidation = GL.validateAttachmentMetadata(file);
    if (!attachmentValidation.valid) {
      setEvidenceStatus(attachmentValidation.errors[0].message, 'red');
      form.elements.attachment.focus();
      return;
    }

    const id = uid('evidence');
    const snapshotState = cloneStateSnapshot();
    const snapshotStorage = localStorage.getItem(KEY);
    const optimisticState = cloneStateSnapshot(snapshotState);
    const record = {
      id,
      ...validation.value,
      attachmentName: attachmentValidation.value?.name || '',
      attachmentType: attachmentValidation.value?.type || '',
      attachmentSize: attachmentValidation.value?.size || 0,
      attachmentStored: !!file,
      savedAt: now()
    };

    optimisticState.evidence.unshift(record);
    delete optimisticState.formDrafts[form.id];
    evidenceTransactionActive = true;
    setEvidenceBusy(form, true, 'Saving evidence…');
    setEvidenceStatus('Saving the evidence record and attachment together…');

    try {
      await commitEvidenceMutation({
        snapshotState,
        snapshotStorage,
        optimisticState,
        applyAttachment: file ? () => storeAttachment(id, file) : null,
        rollbackAttachment: file ? () => deleteAttachmentStrict(id) : null
      });

      form.reset();
      form.elements.observedAt.value = localDateTimeValue();
      form.elements.risk.value = 4;
      $('#evidenceRiskOutput').textContent = '4 — Yellow';
      setEvidenceStatus('Dated implementation evidence saved on this device.', 'green');
      toast('Dated implementation evidence saved');
    } catch (error) {
      setEvidenceStatus(error.message || 'Nothing was saved. The previous evidence state was restored.', 'red');
      toast('Evidence was not saved');
    } finally {
      evidenceTransactionActive = false;
      setEvidenceBusy(form, false);
    }
  });

  $('#evidenceList').addEventListener('click', async event => {
    const remove = event.target.closest('[data-delete-evidence]');
    const download = event.target.closest('[data-download-evidence]');
    const form = $('#evidenceForm');

    if (evidenceTransactionActive) return;

    if (remove) {
      const id = remove.dataset.deleteEvidence;
      const record = state.evidence.find(item => item.id === id);
      if (!record || !confirm('Delete this evidence record and its local attachment?')) return;

      evidenceTransactionActive = true;
      setEvidenceBusy(form, true, 'Updating evidence…');
      remove.disabled = true;
      setEvidenceStatus('Deleting the evidence record and attachment together…');

      const snapshotState = cloneStateSnapshot();
      const snapshotStorage = localStorage.getItem(KEY);
      const optimisticState = cloneStateSnapshot(snapshotState);
      optimisticState.evidence = optimisticState.evidence.filter(item => item.id !== id);

      try {
        let attachmentBackup = null;
        if (record.attachmentStored) {
          attachmentBackup = await readAttachment(id);
          if (!attachmentBackup) throw new Error('The attachment could not be verified, so the evidence record was not deleted.');
        }

        await commitEvidenceMutation({
          snapshotState,
          snapshotStorage,
          optimisticState,
          applyAttachment: record.attachmentStored ? () => deleteAttachmentStrict(id) : null,
          rollbackAttachment: record.attachmentStored ? () => storeAttachment(id, attachmentBackup) : null
        });

        setEvidenceStatus('Evidence record and local attachment deleted.', 'green');
        toast('Evidence record deleted');
      } catch (error) {
        renderEvidence();
        setEvidenceStatus(error.message || 'Nothing was deleted. The previous evidence state was restored.', 'red');
        toast('Evidence was not deleted');
      } finally {
        evidenceTransactionActive = false;
        setEvidenceBusy(form, false);
      }
      return;
    }

    if (download) {
      download.disabled = true;
      setEvidenceStatus('Preparing the local attachment…');
      try {
        const record = state.evidence.find(item => item.id === download.dataset.downloadEvidence);
        const blob = await readAttachment(download.dataset.downloadEvidence);
        if (!blob) throw new Error('The attachment is no longer available on this device.');
        const anchor = document.createElement('a');
        anchor.href = URL.createObjectURL(blob);
        anchor.download = record?.attachmentName || 'GENEVIEVE-evidence-attachment';
        anchor.click();
        setTimeout(() => URL.revokeObjectURL(anchor.href), 1000);
        setEvidenceStatus('Attachment download prepared.', 'green');
      } catch (error) {
        setEvidenceStatus(error.message || 'The attachment is no longer available on this device.', 'red');
      } finally {
        download.disabled = false;
      }
    }
  });

  $('#saveSettings').addEventListener('click', () => {
    const previousSettings = GL.normaliseSettings(state.settings);
    state.settings = GL.normaliseSettings({
      reduceMotion: $('#reduceMotion').checked,
      largeText: $('#largeText').checked,
      highContrast: $('#highContrast').checked,
      shareStatus: $('#shareStatus').checked
    });

    if (!persist(false)) {
      state.settings = previousSettings;
      applySettings();
      $('#settingsMessage').textContent = 'Settings were not saved. The previous settings remain active.';
      return;
    }

    applySettings();
    $('#settingsMessage').textContent = 'Settings saved and applied on this device.';
    toast('Settings saved');
  });

  $$('[data-message]').forEach(button => button.addEventListener('click', () => showMessage(button.dataset.message)));
  $('#showCustomMessage').addEventListener('click', () => showMessage($('#customMessage').value));

  function showMessage(message) {
    const dialog = $('#messageDialog');
    messageReturnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    $('#messageDisplay').textContent = GL.normaliseCommunicationMessage(message);
    if (!dialog.open) dialog.showModal();
    requestAnimationFrame(() => $('#communicationDialogTitle').focus({ preventScroll: true }));
  }

  $('#closeMessage').addEventListener('click', () => $('#messageDialog').close());
  $('#messageDialog').addEventListener('close', () => {
    messageReturnFocus?.focus?.({ preventScroll: true });
    messageReturnFocus = null;
  });

  const legalToggle = () => { $('#acceptLegal').disabled = !($('#acceptTerms').checked && $('#acceptSafety').checked); };
  $('#acceptTerms').addEventListener('change', legalToggle);
  $('#acceptSafety').addEventListener('change', legalToggle);
  $('#acceptLegal').addEventListener('click', () => {
    state.legalAcceptance = { version: '2026-08-03-v52', time: now() };
    persist();
    toast('Legal acceptance recorded');
  });

  $('#exportData').addEventListener('click', () => {
    const exportState = { ...state, attachmentNotice: 'Attachment files are stored separately in this browser and are not embedded in this JSON export.' };
    const blob = new Blob([JSON.stringify(exportState, null, 2)], { type: 'application/json' });
    const anchor = document.createElement('a');
    anchor.href = URL.createObjectURL(blob);
    anchor.download = `GENEVIEVE-dog-park-data-and-evidence-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(anchor.href), 1000);
  });
  $('#deleteData').addEventListener('click', () => {
    if (!confirm('Delete every locally saved GENEVIEVE Dog Park record and attachment from this device?')) return;
    localStorage.removeItem(KEY);
    clearEvidenceDatabase();
    state = defaultState();
    renderAll();
    showScreen('today');
    toast('All local app data deleted');
  });

  $$('[data-purchase]').forEach(button => button.addEventListener('click', () => {
    const url = CONFIG.paymentLinks?.[button.dataset.purchase];
    if (typeof url === 'string' && /^https:\/\//i.test(url)) {
      window.location.assign(url);
      return;
    }
    $('#billingResult').className = 'answer amber';
    $('#billingResult').innerHTML = '<strong>Checkout is not connected in this ZIP.</strong><br>Add only the verified public payment-link URL to config.js after end-to-end test mode. Never add a Stripe secret key to GitHub.';
  }));
  $('#restorePurchases').addEventListener('click', () => {
    $('#billingResult').className = 'answer amber';
    $('#billingResult').textContent = 'No approved native Apple or Google restore bridge is present in this web deployment. Nothing was charged.';
  });

  $('#refreshApp').addEventListener('click', async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        await registration?.update();
      }
      $('#refreshMessage').textContent = 'Update check complete. Reloading the clean V52 files…';
      setTimeout(() => location.reload(), 500);
    } catch {
      $('#refreshMessage').textContent = 'Update check failed. Use the browser refresh button.';
    }
  });

  $('#weatherButton').addEventListener('click', async () => {
    const selected = park(state.selectedPark);
    if (!selected) return toast('Choose a park first');
    $('#weatherTemp').textContent = 'Loading…';
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${selected.lat}&longitude=${selected.lng}&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,wind_speed_10m&daily=uv_index_max&timezone=auto&forecast_days=1`;
      const weather = await fetchJson(url);
      $('#weatherTemp').textContent = `${Math.round(weather.current.apparent_temperature)}° feels-like`;
      $('#weatherDetail').textContent = `${selected.name} · humidity ${weather.current.relative_humidity_2m}% · wind ${Math.round(weather.current.wind_speed_10m)} km/h · UV max ${weather.daily.uv_index_max[0]}`;
    } catch {
      $('#weatherTemp').textContent = 'Weather unavailable';
      $('#weatherDetail').textContent = 'Enter conditions manually in the Heat and Hazards check.';
    }
  });

  function startHold(event) {
    event.preventDefault();
    clearTimeout(holdTimer);
    $('#emergencyHold').classList.add('holding');
    holdTimer = setTimeout(() => {
      $('#emergencyHold').classList.remove('holding');
      $('#emergencySlider').value = 0;
      $('#emergencyDialog').showModal();
      navigator.vibrate?.([120, 80, 120]);
    }, 3000);
  }
  function cancelHold() {
    $('#emergencyHold').classList.remove('holding');
    clearTimeout(holdTimer);
  }
  ['pointerdown', 'touchstart'].forEach(eventName => $('#emergencyHold').addEventListener(eventName, startHold, { passive: false }));
  ['pointerup', 'pointercancel', 'pointerleave', 'touchend', 'touchcancel'].forEach(eventName => $('#emergencyHold').addEventListener(eventName, cancelHold));
  $('#emergencySlider').addEventListener('input', event => {
    if (Number(event.target.value) >= 98) {
      event.target.value = 100;
      setTimeout(() => {
        window.location.href = 'tel:000';
        $('#emergencyDialog').close();
      }, 120);
    }
  });
  $('#cancelEmergency').addEventListener('click', () => $('#emergencyDialog').close());

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredInstall = event;
    $('#installApp').hidden = false;
    $('#installMessage').textContent = 'GENEVIEVE is ready to install on this device.';
  });
  $('#installApp').addEventListener('click', async () => {
    if (!deferredInstall) return;
    deferredInstall.prompt();
    await deferredInstall.userChoice;
    deferredInstall = null;
    $('#installApp').hidden = true;
  });
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      let reloadApproved = false;
      let reloadStarted = false;

      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (reloadApproved && !reloadStarted) {
          reloadStarted = true;
          window.location.reload();
        }
      });

      navigator.serviceWorker.register('/service-worker.js', { scope: '/' })
        .then((registration) => {
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (!newWorker) return;

            newWorker.addEventListener('statechange', () => {
              if (
                newWorker.state === 'installed' &&
                navigator.serviceWorker.controller
              ) {
                reloadApproved = window.confirm(
                  'GENEVIEVE App™ Dog Parks v2 is available. Reload now to update?'
                );

                if (
                  reloadApproved &&
                  newWorker.state === 'activated' &&
                  !reloadStarted
                ) {
                  reloadStarted = true;
                  window.location.reload();
                }
              }
            });
          });

          registration.update().catch(() => {});
        })
        .catch((error) => {
          console.error('Service worker registration failed:', error);
        });
    });
  }

  function localDateTimeValue() {
    const date = new Date();
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  }

  $('#evidenceForm').elements.observedAt.value = localDateTimeValue();
  renderAll();
  installFormPersistence();
  renderAll();
  showScreen('today', false);
  renderParkResults([], 'Australia');

  setInterval(() => {
    const before = state.checkins.length;
    expireCheckins();
    if (state.checkins.length !== before) persist();
  }, 60000);
})();
