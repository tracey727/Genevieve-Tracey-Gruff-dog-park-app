/* GENEVIEVE Dog Parks V35 repair guard.
   Preserves the approved logos and separate Journey page, keeps normal launch
   on Today, and shows the large dashboard header on Today only. */
(() => {
  'use strict';

  const VERSION = '20260730.35';
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

  const JOURNEY_HTML = `<section class="screen" data-group="journey" id="journey">
    <section class="hero card journey-home-hero">
      <p class="eyebrow">YOUR JOURNEY</p>
      <h2>Choose the part of your journey</h2>
      <p>Plan the visit from home, travel and arrive safely, check in or out, or open the separate long-distance trip planner.</p>
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

  async function clearOlderCacheOnce() {
    const key = 'genevieve_v35_today_header_only_cache_repaired';
    try {
      if (window.localStorage.getItem(key) === VERSION) return false;
      window.localStorage.setItem(key, VERSION);

      if ('caches' in window) {
        const names = await window.caches.keys();
        await Promise.all(names.map(name => window.caches.delete(name)));
      }
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(registration => registration.unregister()));
      }

      const url = new URL(window.location.href);
      url.searchParams.set('genevieveVersion', '35');
      url.searchParams.delete('open');
      url.hash = 'today';
      window.location.replace(url.toString());
      return true;
    } catch (error) {
      console.warn('GENEVIEVE V35 cache reset:', error);
      return false;
    }
  }

  function ensureJourneyPage() {
    if ($('#journey')) return;
    const firstJourneyStep = $('#before-leaving');
    if (firstJourneyStep) firstJourneyStep.insertAdjacentHTML('beforebegin', JOURNEY_HTML);
  }

  function repairNavigation() {
    $$('[data-main="journey"]').forEach(button => {
      button.setAttribute('data-go', 'journey');
      button.setAttribute('aria-label', 'Open Journey');
    });
  }

  function setImage(image, primary, fallback, alt) {
    if (!image) return;
    image.alt = alt;
    image.src = `${primary}?v=${VERSION}`;
    image.addEventListener('error', () => {
      const fallbackUrl = `${fallback}?v=${VERSION}`;
      if (!image.src.includes(fallback)) image.src = fallbackUrl;
    }, { once: true });
  }

  function repairLogos() {
    setImage(
      $('.approved-ga-logo'),
      './assets/ga-logo-square.png',
      './assets/ga-master-locked-2026-07-29.jpeg',
      'GENEVIEVE App official GA logo'
    );
    setImage(
      $('.header-roots-journey-art'),
      './assets/genevieve-roots.png',
      './assets/genevieve-safety-from-roots-locked-2026-07-29.jpeg',
      'GENEVIEVE Safety from roots to every journey emblem'
    );
  }

  function activeGroup() {
    return $('.screen.active')?.dataset.group || 'today';
  }

  function syncHeaderVisibility() {
    const hide = activeGroup() !== 'today';
    document.body.classList.toggle('genevieve-hide-main-header', hide);
    document.documentElement.classList.toggle('genevieve-hide-main-header', hide);
    const header = $('.topbar');
    if (header) header.setAttribute('aria-hidden', String(hide));
    if (hide) {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
  }

  function watchHeaderVisibility() {
    $$('.screen').forEach(screen => {
      const observer = new MutationObserver(mutations => {
        if (mutations.some(mutation => mutation.attributeName === 'class')) syncHeaderVisibility();
      });
      observer.observe(screen, { attributes: true, attributeFilter: ['class'] });
    });
    syncHeaderVisibility();
  }

  function openScreen(id) {
    if (!document.getElementById(id)) return;
    if (window.GenevieveAppBridge?.openScreen) {
      window.GenevieveAppBridge.openScreen(id);
    } else {
      $$('.screen').forEach(screen => screen.classList.toggle('active', screen.id === id));
      window.history.replaceState({ screen: id }, '', `${location.pathname}${location.search}#${id}`);
    }
    syncHeaderVisibility();
  }

  function enforceFirstScreen() {
    const requested = new URLSearchParams(location.search).get('open');
    if (requested && document.getElementById(requested)) {
      syncHeaderVisibility();
      return;
    }
    openScreen('today');
    requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: 'auto' }));
  }

  function auditTargets() {
    const missing = [...new Set(
      $$('[data-go]').map(node => node.dataset.go).filter(id => id && !document.getElementById(id))
    )];
    if (missing.length) console.warn('GENEVIEVE V35 navigation targets missing:', missing);
  }

  async function run() {
    if (await clearOlderCacheOnce()) return;
    ensureJourneyPage();
    repairNavigation();
    repairLogos();
    watchHeaderVisibility();
    enforceFirstScreen();
    auditTargets();
    document.documentElement.dataset.genevieveRepair = '2026.07.30.35';
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }
})();
