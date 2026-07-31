/* GENEVIEVE Dog Parks V38 early header landing guard. */
(() => {
  'use strict';
  try {
    const params = new URLSearchParams(window.location.search);
    const requested = params.get('open');
    if (!requested && window.location.hash === '#today') {
      window.history.replaceState({ genevieveScreen: 'today', genevieveDepth: 0 }, '', `${window.location.pathname}${window.location.search}`);
    }
  } catch (error) {
    console.warn('GENEVIEVE V38 header boot guard:', error);
  }
})();
