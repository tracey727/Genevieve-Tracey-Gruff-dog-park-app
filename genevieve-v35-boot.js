/* GENEVIEVE Dog Parks V35 early boot guard.
   Runs before app.js so normal launches open Today and direct links can hide
   the large dashboard header before the page paints. */
(() => {
  'use strict';
  try {
    const params = new URLSearchParams(window.location.search);
    const requested = params.get('open');
    const hashScreen = window.location.hash.slice(1);
    const initialScreen = requested || hashScreen || 'today';
    document.documentElement.classList.toggle('genevieve-hide-main-header', initialScreen !== 'today');

    if (!requested && window.location.hash !== '#today') {
      const clean = `${window.location.pathname}${window.location.search}#today`;
      window.history.replaceState({ screen: 'today' }, '', clean);
      document.documentElement.classList.remove('genevieve-hide-main-header');
    }
  } catch (error) {
    console.warn('GENEVIEVE V35 boot guard:', error);
  }
})();
