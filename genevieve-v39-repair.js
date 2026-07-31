/* GENEVIEVE Dog Parks V39 — exact-logo lock and header-first landing guard. */
(() => {
  'use strict';
  const VERSION = '20260731-39-ga-left-only';
  const GA_ASSET = `./assets/genevieve-ga-logo-v35.png?v=${VERSION}`;
  const TREE_ASSET = `./assets/genevieve-safety-from-roots-locked-2026-07-29.jpeg?v=${VERSION}`;
  const GA_FALLBACK = './assets/ga-master-locked-2026-07-29.jpeg?v=20260731-ga-left-fallback';
  const TREE_FALLBACK = './assets/genevieve-tree-logo-approved-original.jpeg';
  const $ = (selector, scope = document) => scope.querySelector(selector);

  function lockImage(selector, source, fallback, alt) {
    const image = $(selector);
    if (!image) return;
    image.alt = alt;
    image.decoding = 'async';
    image.loading = 'eager';
    image.dataset.genevieveOfficialLogo = 'locked';
    const current = image.getAttribute('src') || '';
    if (!current.includes(source.split('?')[0])) image.setAttribute('src', source);
    if (image.dataset.genevieveFallbackBound !== 'true') {
      image.dataset.genevieveFallbackBound = 'true';
      image.addEventListener('error', () => {
        if (!image.getAttribute('src')?.includes(fallback)) image.setAttribute('src', fallback);
      });
    }
  }

  function restoreOfficialLogos() {
    lockImage('.approved-ga-logo', GA_ASSET, GA_FALLBACK, 'GENEVIEVE App official GA logo');
    lockImage('.header-roots-journey-art', TREE_ASSET, TREE_FALLBACK, 'GENEVIEVE App tree and roots official logo');
  }

  function isNormalTodayLanding() {
    const requested = new URLSearchParams(location.search).get('open');
    const hash = location.hash.slice(1);
    return !requested && (!hash || hash === 'today');
  }

  function showHeaderFirst() {
    if (!isNormalTodayLanding()) return;
    const today = $('#today');
    if (today && !today.classList.contains('active')) {
      window.GenevieveAppBridge?.openScreen?.('today');
    }
    document.body.classList.add('first-page-active');
    document.body.dataset.currentScreen = 'today';
    history.replaceState(
      { ...(history.state || {}), genevieveScreen: 'today' },
      '',
      `${location.pathname}${location.search}`
    );
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    if (document.scrollingElement) document.scrollingElement.scrollTop = 0;
  }

  function run() {
    restoreOfficialLogos();
    showHeaderFirst();

    const observer = new MutationObserver(() => restoreOfficialLogos());
    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['src']
    });

    requestAnimationFrame(showHeaderFirst);
    setTimeout(showHeaderFirst, 80);
    setTimeout(showHeaderFirst, 350);
    window.addEventListener('load', showHeaderFirst, { once: true });
    window.addEventListener('pageshow', showHeaderFirst);

    document.addEventListener('click', event => {
      const control = event.target.closest('[data-go="today"], [data-main="today"]');
      if (!control) return;
      requestAnimationFrame(showHeaderFirst);
      setTimeout(showHeaderFirst, 80);
    });

    document.documentElement.dataset.genevieveHeaderLogoFix = 'GA-left-only-2026-07-31';
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }
})();
