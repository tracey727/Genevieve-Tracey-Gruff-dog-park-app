/* GENEVIEVE Dog Parks V33 repair guard
   Keeps the approved logos, first-screen landing and Journey page working
   even if an older cached V32 file is briefly served. */
(() => {
  'use strict';
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

  const JOURNEY_HTML = `<section class="screen" data-group="journey" id="journey">
    <section class="hero card journey-home-hero">
      <p class="eyebrow">YOUR JOURNEY</p>
      <h2>Choose the part of your journey</h2>
      <p>Journey now has its own page. Start at home, continue through arrival and check-in, or open the separate long-distance trip planner.</p>
    </section>
    <section aria-label="Journey choices" class="page-grid journey-home-grid">
      <button data-go="before-leaving" type="button"><b>1. Before leaving home</b><small>Dog, weather, destination, documents and supplies.</small></button>
      <button data-go="route-arrival" type="button"><b>2. Route and arrival</b><small>Drive, park, approach the gate, enter and leave safely.</small></button>
      <button data-go="checkin" type="button"><b>3. Check in or out</b><small>Optional community presence and current dog status.</small></button>
      <button data-go="travel" type="button"><b>Grey Nomad Trip Planner</b><small>Long-distance routes, rest stops, stays, food and emergency-vet planning.</small></button>
      <button data-go="heat-hazards" type="button"><b>Heat and hazards</b><small>Review weather, surfaces and current local reports.</small></button>
      <button data-go="emergency" type="button"><b>Emergency and services</b><small>Open urgent help and other support services.</small></button>
    </section>
  </section>`;

  function ensureJourneyPage() {
    if ($('#journey')) return;
    const firstJourneyStep = $('#before-leaving');
    if (!firstJourneyStep) return;
    firstJourneyStep.insertAdjacentHTML('beforebegin', JOURNEY_HTML);
  }

  function repairNavigation() {
    $$('[data-main="journey"]').forEach(button => button.setAttribute('data-go', 'journey'));
  }

  function repairLogos() {
    const ga = $('.approved-ga-logo');
    if (ga) {
      ga.src = './assets/ga-master-locked-2026-07-29.jpeg';
      ga.addEventListener('error', () => {
        if (!ga.src.endsWith('/assets/ga-logo-square.png')) ga.src = './assets/ga-logo-square.png';
      }, { once: true });
    }
    const roots = $('.header-roots-journey-art');
    if (roots) {
      roots.src = './assets/genevieve-safety-from-roots-locked-2026-07-29.jpeg';
      roots.addEventListener('error', () => {
        if (!roots.src.endsWith('/assets/genevieve-roots.png')) roots.src = './assets/genevieve-roots.png';
      }, { once: true });
    }
  }

  function enforceFirstScreen() {
    const requested = new URLSearchParams(location.search).get('open');
    if (requested && document.getElementById(requested)) return;
    if (window.GenevieveAppBridge?.openScreen) {
      window.GenevieveAppBridge.openScreen('today');
    } else {
      $$('.screen').forEach(screen => screen.classList.toggle('active', screen.id === 'today'));
      history.replaceState({ screen: 'today' }, '', `${location.pathname}${location.search}#today`);
    }
    requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: 'auto' }));
  }

  function auditTargets() {
    const missing = [...new Set($$('[data-go]').map(node => node.dataset.go).filter(id => id && !document.getElementById(id)))];
    if (missing.length) console.warn('GENEVIEVE V33: navigation targets still missing:', missing);
  }

  function run() {
    ensureJourneyPage();
    repairNavigation();
    repairLogos();
    enforceFirstScreen();
    auditTargets();
    document.documentElement.dataset.genevieveRepair = '2026.07.29.33';
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
  else run();
})();
