import './national-travel.css';

const PANEL_ID = 'genevieve-national-travel';
const ROUTE_ENDPOINT = '/api/trip-calculate';

function button(label, className = '') {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = className;
  el.textContent = label;
  return el;
}

function mapSearchUrl(query) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function googleSearchUrl(query) {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

function openExternal(url) {
  window.open(url, '_blank', 'noopener,noreferrer');
}

function detailRow(label, value) {
  const row = document.createElement('div');
  row.className = 'gv-route-stat';
  const small = document.createElement('small');
  small.textContent = label;
  const strong = document.createElement('strong');
  strong.textContent = value;
  row.append(small, strong);
  return row;
}

function actionLink(label, onClick, className = '') {
  const el = button(label, `gv-route-action ${className}`.trim());
  el.addEventListener('click', onClick);
  return el;
}

function buildStopCard(stop) {
  const card = document.createElement('article');
  card.className = `gv-stop-card ${stop.overnight ? 'overnight' : ''}`;

  const head = document.createElement('div');
  head.className = 'gv-stop-head';
  const title = document.createElement('strong');
  title.textContent = `${stop.overnight ? 'Overnight' : 'Dog break'} ${stop.sequence || ''}`.trim();
  const badge = document.createElement('span');
  badge.className = `gv-attention ${stop.attention?.level || 'amber'}`;
  badge.textContent = stop.attention?.label || 'Verify stopping place';
  head.append(title, badge);

  const name = document.createElement('p');
  name.className = 'gv-stop-name';
  name.textContent = stop.name || 'Calculated route position';

  const meta = document.createElement('p');
  meta.className = 'gv-stop-meta';
  meta.textContent = `Road day ${stop.roadDay || 1} · route hour ${Number(stop.plannedHour || 0).toFixed(1)} · ${Number(stop.hoursFromPrevious || 0).toFixed(1)}h from previous planned break`;

  const warning = document.createElement('p');
  warning.className = 'gv-stop-warning';
  warning.textContent = stop.attention?.meaning || 'This is a calculated route position, not a verified lawful or safe stopping facility.';

  const actions = document.createElement('div');
  actions.className = 'gv-route-actions';
  actions.append(
    actionLink('Open route position', () => openExternal(mapSearchUrl(stop.mapQuery || `${stop.latitude},${stop.longitude}`))),
    actionLink('Find dog-friendly rest stop nearby', () => openExternal(mapSearchUrl(`dog friendly rest stop near ${stop.mapQuery || `${stop.latitude},${stop.longitude}`}`)))
  );
  if (stop.overnight) {
    actions.append(
      actionLink('Pet-friendly accommodation', () => openExternal(mapSearchUrl(`pet friendly accommodation near ${stop.mapQuery || `${stop.latitude},${stop.longitude}`}`))),
      actionLink('Dog-friendly caravan park', () => openExternal(mapSearchUrl(`dog friendly caravan park near ${stop.mapQuery || `${stop.latitude},${stop.longitude}`}`)))
    );
  }

  card.append(head, name, meta, warning, actions);
  return card;
}

function buildFerryCard(part) {
  const card = document.createElement('article');
  card.className = 'gv-ferry-card';
  const title = document.createElement('strong');
  title.textContent = `Spirit of Tasmania · ${part.direction || 'Tasmania crossing'}`;
  const text = document.createElement('p');
  text.textContent = `${part.crossingHours || 'Crossing time varies'}. Sailing, check-in, fares and pet arrangements must be confirmed with the operator.`;
  const actions = document.createElement('div');
  actions.className = 'gv-route-actions';
  if (part.scheduleUrl) actions.append(actionLink('Check sailing schedule', () => openExternal(part.scheduleUrl)));
  if (part.petRulesUrl) actions.append(actionLink('Check pet & kennel rules', () => openExternal(part.petRulesUrl)));
  card.append(title, text, actions);
  return card;
}

function renderRoute(result, destination, resultNode) {
  resultNode.replaceChildren();
  const route = result?.selected;
  if (!route?.calculable) return;

  const summary = document.createElement('section');
  summary.className = 'gv-route-summary';
  const heading = document.createElement('div');
  heading.className = 'gv-route-summary-title';
  const h3 = document.createElement('h3');
  h3.textContent = 'Australia-wide route calculated';
  const verified = document.createElement('span');
  verified.className = 'gv-route-provider';
  verified.textContent = result.provider === 'openrouteservice' ? 'Road geometry calculated' : 'Calculated';
  heading.append(h3, verified);

  const stats = document.createElement('div');
  stats.className = 'gv-route-stats';
  stats.append(
    detailRow('ROAD DISTANCE', `${Number(route.roadKm || 0).toLocaleString('en-AU')} km`),
    detailRow('DRIVE TIME', `${Number(route.driveHours || 0).toFixed(1)} h`),
    detailRow('ROAD DAYS', String(route.roadDays || 1)),
    detailRow('PLANNED BREAKS', String(route.requiredBreaks || 0))
  );

  const notice = document.createElement('p');
  notice.className = 'gv-route-notice';
  notice.textContent = route.routeStyleNotice || 'Road geometry is calculated; live road closures, weather and facility safety still require current verified sources.';

  const evidence = document.createElement('p');
  evidence.className = 'gv-route-evidence';
  const hash = result?.evidence?.calculationHash || '';
  evidence.textContent = hash ? `Calculation evidence: ${hash.slice(0, 12)}… · ${result.evidence.appVersion || ''}` : 'Calculation evidence unavailable.';

  summary.append(heading, stats, notice, evidence);
  resultNode.append(summary);

  const parts = Array.isArray(route.parts) ? route.parts : [];
  parts.filter((part) => part.type === 'ferry').forEach((part) => resultNode.append(buildFerryCard(part)));

  const stopHeading = document.createElement('h3');
  stopHeading.className = 'gv-route-section-heading';
  stopHeading.textContent = route.stops?.length ? 'Planned dog breaks & road overnights' : 'No scheduled dog break required on this road section';
  resultNode.append(stopHeading);
  (route.stops || []).forEach((stop) => resultNode.append(buildStopCard(stop)));

  const destinationCard = document.createElement('section');
  destinationCard.className = 'gv-destination-tools';
  const destTitle = document.createElement('h3');
  destTitle.textContent = 'Destination safety & stay tools';
  const destText = document.createElement('p');
  destText.textContent = 'These buttons open searches; availability, pet acceptance and safety are not claimed until you confirm them with the provider.';
  const destActions = document.createElement('div');
  destActions.className = 'gv-route-actions';
  destActions.append(
    actionLink('Emergency vet', () => openExternal(mapSearchUrl(`emergency veterinarian near ${destination}`))),
    actionLink('Pet-friendly hotel', () => openExternal(mapSearchUrl(`pet friendly hotel near ${destination}`))),
    actionLink('Dog-friendly caravan park', () => openExternal(mapSearchUrl(`dog friendly caravan park near ${destination}`))),
    actionLink('Pet-friendly Airbnb search', () => openExternal(googleSearchUrl(`site:airbnb.com.au pet friendly ${destination}`)))
  );
  destinationCard.append(destTitle, destText, destActions);
  resultNode.append(destinationCard);

  const boarding = document.createElement('section');
  boarding.className = 'gv-boarding-planned';
  const boardingTitle = document.createElement('strong');
  boardingTitle.textContent = 'Genevieve Boarding Match · planned module';
  const boardingText = document.createElement('p');
  boardingText.textContent = 'Preserved from the earlier V11 app archive. It is intentionally not activated until verified providers, identity/consent controls and moderation rules are connected.';
  boarding.append(boardingTitle, boardingText);
  resultNode.append(boarding);
}

function createPanel() {
  const panel = document.createElement('section');
  panel.id = PANEL_ID;
  panel.className = 'gv-national-route';
  panel.setAttribute('aria-label', 'Australia-wide dog-safe route planner');

  panel.innerHTML = `
    <div class="gv-national-head">
      <div>
        <small>AUSTRALIA-WIDE LIVE PLANNER</small>
        <h2>Plan the road journey around your mate</h2>
        <p>Calculate Australian road geometry, planned dog breaks, road-day overnights and Tasmania ferry transitions. GENEVIEVE never labels a calculated coordinate as a verified rest facility.</p>
      </div>
      <span class="gv-national-badge">V53 · national</span>
    </div>
    <form class="gv-national-form">
      <label><span>From</span><input name="from" autocomplete="street-address" placeholder="Current location, town or Australian address" required></label>
      <button class="gv-use-gps" type="button">Use my current GPS</button>
      <label><span>To</span><input name="to" autocomplete="street-address" placeholder="Town, suburb or Australian destination" required></label>
      <label class="gv-wide"><span>Required places on the way <small>(optional · one per line · max 8)</small></span><textarea name="requiredPlaces" rows="3" placeholder="Coffs Harbour NSW\nPort Macquarie NSW"></textarea></label>
      <label><span>Dog break ceiling</span><select name="dogBreakHours"><option value="2">Every 2 hours maximum</option><option value="1.5">Every 1.5 hours maximum</option></select></label>
      <label><span>Route preference</span><select name="routeStyle"><option value="fastest">Fastest</option><option value="coastal">Coastal preference</option><option value="inland">Inland preference</option><option value="scenic">Scenic preference</option></select></label>
      <button class="gv-calculate" type="submit">Calculate Safe Travel Plan</button>
    </form>
    <div class="gv-route-status" role="status" aria-live="polite"></div>
    <div class="gv-route-results"></div>
  `;

  const form = panel.querySelector('.gv-national-form');
  const status = panel.querySelector('.gv-route-status');
  const resultNode = panel.querySelector('.gv-route-results');
  const gpsButton = panel.querySelector('.gv-use-gps');
  let gps = null;

  gpsButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
      status.textContent = 'This device does not provide browser geolocation. Enter an Australian start place instead.';
      return;
    }
    status.textContent = 'Requesting your current location…';
    navigator.geolocation.getCurrentPosition(
      (position) => {
        gps = { latitude: position.coords.latitude, longitude: position.coords.longitude };
        form.elements.from.value = `Current location · ${gps.latitude.toFixed(5)}, ${gps.longitude.toFixed(5)}`;
        status.textContent = 'Current GPS captured locally for this route calculation.';
      },
      () => { status.textContent = 'GPS was not available. Enter an Australian start place instead.'; },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 20000 }
    );
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const from = form.elements.from.value.trim();
    const to = form.elements.to.value.trim();
    if (!from || !to) {
      status.textContent = 'Enter both an Australian start and destination.';
      return;
    }
    const requiredPlaces = form.elements.requiredPlaces.value.split(/\r?\n/).map((value) => value.trim()).filter(Boolean);
    const payload = {
      from,
      to,
      requiredPlaces,
      dogBreakHours: Number(form.elements.dogBreakHours.value),
      routeStyle: form.elements.routeStyle.value
    };
    if (gps) payload.fromCoordinates = gps;

    const submit = form.querySelector('.gv-calculate');
    submit.disabled = true;
    status.textContent = navigator.onLine ? 'Calculating the Australian road route…' : 'No network connection. Your local emergency and safety layers remain available; live road calculation needs a connection.';
    resultNode.replaceChildren();

    try {
      const response = await fetch(ROUTE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) {
        const message = data?.message || `Route service returned ${response.status}.`;
        status.textContent = `${message} No route or stop count has been guessed.`;
        return;
      }
      status.textContent = `Route calculated · ${data.providerAttribution || 'verified route provider response'}. Confirm current road, weather and facility conditions before travel.`;
      renderRoute(data, to, resultNode);
    } catch {
      status.textContent = 'Live route calculation could not be reached. No route or stop count has been guessed; the existing offline emergency and local safety layers remain available.';
    } finally {
      submit.disabled = false;
    }
  });

  return panel;
}

function attachPanel() {
  if (document.getElementById(PANEL_ID)) return;
  const main = document.getElementById('main');
  if (!main) return;
  const screen = main.querySelector('.screen');
  if (!screen || !screen.textContent.includes('Grey Nomad Highway & Veterinary Router')) return;
  const safeHaven = screen.querySelector('.safe-haven');
  const panel = createPanel();
  if (safeHaven) screen.insertBefore(panel, safeHaven);
  else screen.append(panel);
}

const observer = new MutationObserver(() => attachPanel());
observer.observe(document.documentElement, { childList: true, subtree: true });
attachPanel();
