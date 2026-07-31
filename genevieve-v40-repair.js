/* GENEVIEVE Dog Parks V40 — embedded official GA logo and header landing guard. */
(() => {
  'use strict';
  const TREE_ASSET = './assets/genevieve-safety-from-roots-locked-2026-07-29.jpeg?v=20260731.40';
  const TREE_FALLBACK = './assets/genevieve-tree-logo-approved-original.jpeg?v=20260731.40';
  const $ = (selector, scope = document) => scope.querySelector(selector);

  function protectEmbeddedGaLogo() {
    const image = $('.approved-ga-logo');
    if (!image) return;
    image.alt = 'GENEVIEVE App official GA logo';
    image.decoding = 'sync';
    image.loading = 'eager';
    image.dataset.genevieveOfficialLogo = 'embedded-v40';
  }

  function lockTreeLogo() {
    const image = $('.header-roots-journey-art');
    if (!image) return;
    image.alt = 'GENEVIEVE App tree and roots official logo';
    image.decoding = 'async';
    image.loading = 'eager';
    image.dataset.genevieveOfficialLogo = 'locked';
    if (!image.getAttribute('src')?.includes('genevieve-safety-from-roots-locked-2026-07-29.jpeg')) {
      image.setAttribute('src', TREE_ASSET);
    }
    if (image.dataset.genevieveFallbackBound !== 'true') {
      image.dataset.genevieveFallbackBound = 'true';
      image.addEventListener('error', () => {
        if (!image.getAttribute('src')?.includes('genevieve-tree-logo-approved-original.jpeg')) {
          image.setAttribute('src', TREE_FALLBACK);
        }
      });
    }
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
    protectEmbeddedGaLogo();
    lockTreeLogo();
    showHeaderFirst();

    const observer = new MutationObserver(() => {
      protectEmbeddedGaLogo();
      lockTreeLogo();
    });
    observer.observe(document.documentElement, {
      subtree: true,
      childList: true
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

    document.documentElement.dataset.genevieveHeaderLogoFix = 'GA-inline-v40-2026-07-31';
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }
})();
