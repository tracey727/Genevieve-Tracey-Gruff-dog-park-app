(function(root, factory){
  const service = factory();
  if(typeof module === 'object' && module.exports) module.exports = service;
  if(root) root.GenevieveNationalTripService = service;
})(typeof globalThis !== 'undefined' ? globalThis : this, function(){
  'use strict';

  const VERSION = '2026.08.03.52';
  const ENDPOINT = './api/trip-calculate';
  const TIMEOUT_MS = 30000;

  function requiredPlaces(value){
    const values = Array.isArray(value) ? value : String(value || '').split(/\r?\n/);
    return [...new Set(values.map(item => String(item || '').replace(/\s+/g, ' ').trim()).filter(Boolean))].slice(0, 8);
  }

  function requestPayload(plan, dog, planner){
    const policy = planner?.dogBreakPolicy?.(dog) || {hours: 2};
    const latitude = Number(plan?.fromLatitude);
    const longitude = Number(plan?.fromLongitude);
    const fromCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude) && plan?.fromLatitude !== '' && plan?.fromLongitude !== ''
      ? {latitude, longitude}
      : undefined;
    return {
      from: String(plan?.from || '').trim(),
      to: String(plan?.to || '').trim(),
      requiredPlaces: requiredPlaces(plan?.requiredPlaces),
      routeStyle: String(plan?.routeStyle || 'fastest'),
      dogBreakHours: policy.hours,
      ...(fromCoordinates ? {fromCoordinates} : {})
    };
  }

  function errorResult(payload, status){
    const message = String(payload?.message || 'The Australia-wide route could not be calculated.');
    return {
      calculable: false,
      nationalAttempted: true,
      liveRoadCalculation: false,
      error: message,
      errorCode: String(payload?.code || 'national_route_failed'),
      httpStatus: Number(status) || 0,
      attention: payload?.attention || {score: 9, level: 'red', label: 'Route not calculated', meaning: 'No stop count should be used for this unverified route.'}
    };
  }

  async function calculate(plan, dog, options = {}){
    const planner = options.planner || (typeof globalThis !== 'undefined' ? globalThis.GenevieveTripPlanner : null);
    const fetcher = options.fetcher || (typeof fetch === 'function' ? fetch.bind(globalThis) : null);
    if(!fetcher) return errorResult({code:'network_unavailable', message:'This browser cannot contact the Australia-wide route service.'}, 0);
    const controller = typeof AbortController === 'function' ? new AbortController() : null;
    const timeout = controller ? setTimeout(() => controller.abort(), TIMEOUT_MS) : null;
    try{
      const response = await fetcher(ENDPOINT, {
        method: 'POST',
        headers: {'Content-Type':'application/json', 'Accept':'application/json'},
        cache: 'no-store',
        credentials: 'same-origin',
        body: JSON.stringify(requestPayload(plan, dog, planner)),
        ...(controller ? {signal:controller.signal} : {})
      });
      let payload = null;
      try{ payload = await response.json(); }catch{ payload = null; }
      if(!response.ok || !payload?.calculable || !payload?.selected) return errorResult(payload, response.status);
      const localPolicy = planner?.dogBreakPolicy?.(dog) || payload.policy;
      payload.policy = {...payload.policy, ...localPolicy};
      payload.selected.policy = payload.policy;
      (payload.options || []).forEach(option => { option.policy = payload.policy; });
      return {...payload, nationalAttempted:true, dog};
    }catch(error){
      if(error?.name === 'AbortError') return errorResult({code:'national_route_timeout', message:'The Australia-wide route calculation timed out. Try again when the connection is stable.'}, 504);
      return errorResult({code:'national_route_offline', message:'The Australia-wide route service could not be reached. GENEVIEVE will use a supported local estimate only when it can do so without inventing locations.'}, 0);
    }finally{
      if(timeout) clearTimeout(timeout);
    }
  }

  return Object.freeze({version:VERSION, endpoint:ENDPOINT, requiredPlaces, requestPayload, calculate});
});

