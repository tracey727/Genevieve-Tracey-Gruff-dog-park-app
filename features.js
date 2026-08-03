(() => {
  'use strict';

  const VERSION = '2026.08.03.52';
  const Logic = window.GenevieveLogic;
  const TripPlanner = window.GenevieveTripPlanner;
  const NationalTripService = window.GenevieveNationalTripService;
  const Bridge = () => window.GenevieveAppBridge;
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const safe = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[character]));
  const now = () => new Date().toISOString();
  const uid = prefix => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const searchAnchors = [
    {terms:['labrador','musgrave','southport'],label:'Labrador / Southport QLD',latitude:-27.95545,longitude:153.38935,state:'QLD',preferred:'musgrave-dog-park-qld'},
    {terms:['gold coast'],label:'Gold Coast QLD',latitude:-28.0167,longitude:153.4000,state:'QLD'},
    {terms:['brisbane'],label:'Brisbane QLD',latitude:-27.4698,longitude:153.0251,state:'QLD'},
    {terms:['sydney'],label:'Sydney NSW',latitude:-33.8688,longitude:151.2093,state:'NSW'},
    {terms:['canberra','belconnen'],label:'Canberra ACT',latitude:-35.2809,longitude:149.1300,state:'ACT'},
    {terms:['darwin'],label:'Darwin NT',latitude:-12.4634,longitude:130.8456,state:'NT'},
    {terms:['adelaide'],label:'Adelaide SA',latitude:-34.9285,longitude:138.6007,state:'SA'},
    {terms:['hobart'],label:'Hobart TAS',latitude:-42.8821,longitude:147.3272,state:'TAS'},
    {terms:['melbourne'],label:'Melbourne VIC',latitude:-37.8136,longitude:144.9631,state:'VIC'},
    {terms:['perth'],label:'Perth WA',latitude:-31.9523,longitude:115.8613,state:'WA'}
  ];
  let parkSearchHistory = [];
  let currentSearchLocation = null;
  let emergencySearchLocation = null;

  function getState(){ return Bridge()?.getState?.() || {dogs:[],trips:[],incidents:[]}; }
  function getParks(){ return Bridge()?.getParks?.() || []; }

  function anchorFor(query){
    const lower=String(query||'').toLowerCase();
    return searchAnchors.find(anchor=>anchor.terms.some(term=>lower.includes(term))) || null;
  }

  function distanceLabel(km){
    if(!Number.isFinite(km))return 'Distance not calculated';
    if(km<1)return `${Math.max(0.1,Math.round(km*10)/10)} km from the search point`;
    return `${Math.round(km*10)/10} km from the search point`;
  }

  function suitabilityBand(percent){
    if(percent===null)return {level:'yellow',label:'Choose needs'};
    if(percent>=80)return {level:'green',label:'Strong match'};
    if(percent>=60)return {level:'yellow',label:'Moderate match'};
    if(percent>=40)return {level:'amber',label:'Limited match'};
    return {level:'red',label:'Poor match'};
  }

  function calculateNeedsMatch(park,needs){
    const selected=[...new Set((needs||[]).filter(Boolean))];
    const features=new Set(park.features||[]);
    const matched=selected.filter(need=>features.has(need));
    const missing=selected.filter(need=>!features.has(need));
    const percent=selected.length?Math.round((matched.length/selected.length)*100):null;
    return {selected,matched,missing,percent,...suitabilityBand(percent)};
  }

  function liveTimeLabel(){
    return new Intl.DateTimeFormat('en-AU',{hour:'numeric',minute:'2-digit'}).format(new Date());
  }

  function parkMatches(query,stateCode,needs,coordinates){
    const lower=String(query||'').trim().toLowerCase();
    const anchor=coordinates || anchorFor(lower);
    const parks=getParks().filter(park=>{
      const hay=`${park.name} ${park.suburb} ${park.address||''} ${park.state||''} ${(park.features||[]).join(' ')}`.toLowerCase();
      const textMatch=!lower || hay.includes(lower) || Boolean(anchor);
      return textMatch && (!stateCode || park.state===stateCode);
    }).map(park=>{
      const km=anchor ? Logic.haversineKm(anchor.latitude,anchor.longitude,park.latitude,park.longitude) : Infinity;
      return {...park,distanceKm:km,needsMatch:calculateNeedsMatch(park,needs)};
    });
    parks.sort((a,b)=>{
      if(anchor?.preferred){
        if(a.id===anchor.preferred)return -1;
        if(b.id===anchor.preferred)return 1;
      }
      if(a.distanceKm!==b.distanceKm)return a.distanceKm-b.distanceKm;
      if((needs||[]).length&&a.needsMatch.percent!==b.needsMatch.percent)return b.needsMatch.percent-a.needsMatch.percent;
      return a.name.localeCompare(b.name,'en-AU');
    });
    return {anchor,matches:parks};
  }

  function needsMatchMarkup(match){
    if(match.percent===null){
      return `<section class="park-safety-match yellow"><div class="park-safety-score"><span>—</span><small>NO RATING YET</small></div><div><p class="eyebrow">GENEVIEVE LIVE SAFETY MATCH</p><h4>Choose at least one need</h4><p>Tick the facilities or conditions that matter to you. GENEVIEVE will calculate a live percentage for every park result.</p></div></section>`;
    }
    const matched=match.matched.length?match.matched.map(item=>`<span class="need-chip matched">✓ ${safe(item)}</span>`).join(''):'<span class="need-chip missing">No selected needs are listed</span>';
    const missing=match.missing.length?match.missing.map(item=>`<span class="need-chip missing">✕ ${safe(item)}</span>`).join(''):'<span class="need-chip matched">✓ Every selected need is listed</span>';
    return `<section class="park-safety-match ${match.level}" aria-label="${safe(match.percent)} percent personal safety match"><div class="park-safety-score"><span>${match.percent}%</span><small>${safe(match.label)}</small></div><div><p class="eyebrow">GENEVIEVE LIVE SAFETY MATCH</p><h4>${match.matched.length} of ${match.selected.length} selected needs matched</h4><div class="park-match-meter" aria-hidden="true"><span style="width:${match.percent}%"></span></div><div class="park-need-breakdown">${matched}${missing}</div><p class="small">Calculated live at ${safe(liveTimeLabel())} from the needs you selected and the current park record.</p></div></section>`;
  }

  function parkCard(park,index,needs){
    const match=park.needsMatch||calculateNeedsMatch(park,needs);
    const leading=index===0?'<span class="nearest-badge">Closest known match</span>':'';
    return `<article class="park-card nearest-park-card ${match.level}">${leading}<h3>${index+1}. ${safe(park.name)}</h3><p><b>${safe(distanceLabel(park.distanceKm))}</b><br>${safe(park.address||park.suburb)}</p>${needsMatchMarkup(match)}<div class="chips">${(park.features||[]).map(feature=>`<span class="chip">${safe(feature)}</span>`).join('')}</div><div class="answer ${match.level}"><b>${match.percent===null?'Select your needs to compare this park':`${match.percent}% personal safety match — ${match.label}`}</b><br>${safe(park.verifiedSummary||'Confirm current rules, access and facilities before travel.')}</div><p class="muted"><b>Guidance only:</b> this percentage measures the selected needs listed in the current park record. It is not a guarantee of safety, availability or current conditions. ${safe(park.warning||'Information can change. Check the official source and signs.')}</p><div class="button-row compact"><button type="button" data-repair-select-park="${safe(park.id)}">Show map</button><button type="button" data-view-park="${safe(park.id)}">Park details</button><a class="button-link secondary-link" href="${safe(park.officialUrl||'#')}" target="_blank" rel="noopener">Official source</a></div></article>`;
  }

  window.GenevieveParkSafetyMatch=Object.freeze({
    calculate:(park,needs)=>structuredClone(calculateNeedsMatch(park,needs)),
    band:percent=>structuredClone(suitabilityBand(percent))
  });

  function setParkStatus(message,level='yellow'){
    const status=$('#parkSearchStatus');
    if(!status)return;
    status.className=`answer ${level}`;
    status.innerHTML=message;
  }

  function resetParkResults(){
    const list=$('#parkList');
    if(list)list.innerHTML='<div class="empty">Enter a destination above to see the nearest known parks.</div>';
    const panel=$('#parkMapPanel');
    if(panel)panel.hidden=true;
    const frame=$('#parkMapFrame');
    if(frame){frame.src='about:blank';delete frame.dataset.parkId;}
    currentSearchLocation=null;
    setParkStatus(`<b>LIVE STATUS · ${safe(liveTimeLabel())}</b><br>Enter where you want to search. Tick your needs to receive a percentage and colour rating.`);
  }

  function renderParkSearch({pushHistory=false,coordinates=null}={}){
    const form=$('#parkFilterForm');
    if(!form)return;
    const query=String(form.elements.query?.value||'').trim();
    const stateCode=String(form.elements.state?.value||'');
    const needs=$$('#parkNeedControls input:checked').map(input=>input.value);
    if(!query && !coordinates){resetParkResults();return;}
    if(pushHistory)parkSearchHistory.push({query,stateCode,needs:[...needs],coordinates:currentSearchLocation});
    const result=parkMatches(query,stateCode,needs,coordinates||currentSearchLocation);
    currentSearchLocation=result.anchor || coordinates || currentSearchLocation;
    const list=$('#parkList');
    if(!result.matches.length){
      list.innerHTML='<div class="empty">No known park record matched this location search. Try a nearby suburb or open the Australia-wide map search.</div>';
      setParkStatus(`<b>LIVE STATUS · ${safe(liveTimeLabel())} · no location matches found.</b><br>Try a nearby suburb, town or park name.`,'amber');
      $('#parkMapPanel').hidden=true;
      return;
    }
    const nearest=result.matches[0];
    if(getState().selectedParkId!==nearest.id)Bridge()?.selectPark?.(nearest.id);
    list.innerHTML=result.matches.map((park,index)=>parkCard(park,index,needs)).join('');
    const mapPanel=$('#parkMapPanel');if(mapPanel)mapPanel.hidden=false;
    const locationLabel=result.anchor?.label || (coordinates?'your device location':query);
    const bestMatch=nearest.needsMatch||calculateNeedsMatch(nearest,needs);
    const statusLevel=bestMatch.percent===null?'yellow':bestMatch.level;
    const statusDetail=bestMatch.percent===null
      ?'Tick at least one need to calculate a personal safety percentage and colour for every result.'
      :`${safe(nearest.name)} is the closest known result and has a ${bestMatch.percent}% match to your selected needs. Compare the percentage and colour before choosing.`;
    setParkStatus(`<b>LIVE STATUS · ${safe(liveTimeLabel())} · ${result.matches.length} result${result.matches.length===1?'':'s'} for ${safe(locationLabel)}</b><br>${statusDetail}`,statusLevel);
    const undo=$('#undoParkSearch');if(undo)undo.disabled=parkSearchHistory.length===0;
    Bridge()?.saveEvidence?.('park_search_live_safety_match',{query,stateCode,needs,nearest:result.matches[0].id,suitabilityPercent:bestMatch.percent,matchedNeeds:bestMatch.matched,missingNeeds:bestMatch.missing,calculatedAt:now(),locationSource:coordinates?'device':result.anchor?'place-anchor':'text'});
  }

  function selectPark(id){
    Bridge()?.selectPark?.(id);
    const panel=$('#parkMapPanel');if(panel)panel.hidden=false;
    // App rendering can replace the list, so restore the current nearest-first results after it completes.
    setTimeout(()=>{
      renderParkSearch();
      const updatedPanel=$('#parkMapPanel');if(updatedPanel)updatedPanel.hidden=false;
      updatedPanel?.scrollIntoView?.({behavior:document.body.classList.contains('reduced-motion')?'auto':'smooth',block:'start'});
    },0);
  }

  function useParkLocation(){
    if(!navigator.geolocation){setParkStatus('<b>Location is not supported on this device.</b><br>Type a suburb or address instead.','red');return;}
    setParkStatus('<b>Requesting your location…</b><br>You can deny the request and type a suburb instead.');
    navigator.geolocation.getCurrentPosition(position=>{
      currentSearchLocation={label:'your device location',latitude:position.coords.latitude,longitude:position.coords.longitude};
      const form=$('#parkFilterForm');
      form.elements.query.value='My location';
      renderParkSearch({pushHistory:true,coordinates:currentSearchLocation});
    },error=>setParkStatus(`<b>Location was not available.</b><br>${safe(error.message)}. Type a suburb or address instead.`,'red'),{enableHighAccuracy:false,timeout:12000,maximumAge:300000});
  }

  function clearParkSearch(){
    const form=$('#parkFilterForm');
    parkSearchHistory.push({query:form.elements.query.value,stateCode:form.elements.state.value,needs:$$('#parkNeedControls input:checked').map(i=>i.value),coordinates:currentSearchLocation});
    form.reset();
    $$('#parkNeedControls input').forEach(input=>input.checked=false);
    resetParkResults();
    const undo=$('#undoParkSearch');if(undo)undo.disabled=false;
  }

  function undoParkSearch(){
    const previous=parkSearchHistory.pop();
    if(!previous)return;
    const form=$('#parkFilterForm');
    form.elements.query.value=previous.query||'';
    form.elements.state.value=previous.stateCode||'';
    $$('#parkNeedControls input').forEach(input=>input.checked=(previous.needs||[]).includes(input.value));
    currentSearchLocation=previous.coordinates||null;
    renderParkSearch({coordinates:currentSearchLocation});
    $('#undoParkSearch').disabled=parkSearchHistory.length===0;
  }

  function updateServiceLinks(){
    const enteredLocation=String($('#serviceLocation')?.value||'').trim();
    const location=emergencySearchLocation
      ?`${emergencySearchLocation.latitude.toFixed(6)},${emergencySearchLocation.longitude.toFixed(6)}`
      :enteredLocation||'Australia';
    $$('[data-service-search]').forEach(link=>{
      const query=emergencySearchLocation
        ?`${link.dataset.serviceSearch} near ${location}`
        :`${link.dataset.serviceSearch} ${location}`;
      link.href=`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
      link.target='_blank';link.rel='noopener';
    });
  }

  function emergencyLocationStatus(message,level='yellow'){
    const status=$('#emergencyLocationStatus');
    if(!status)return;
    status.className=`answer ${level}`;
    status.innerHTML=message;
  }

  function useEmergencyLocation(){
    if(!navigator.geolocation){
      emergencyLocationStatus('<b>Current location is not supported by this browser.</b><br>Enter the suburb, council area or town instead.','red');
      return;
    }
    emergencyLocationStatus('<b>Requesting location…</b><br>Choose Allow only if you want nearby service searches.','yellow');
    navigator.geolocation.getCurrentPosition(position=>{
      emergencySearchLocation={latitude:position.coords.latitude,longitude:position.coords.longitude};
      const input=$('#serviceLocation');
      if(input)input.value='Current device location';
      updateServiceLinks();
      emergencyLocationStatus('<b>Nearby service links are ready.</b><br>Your coordinates are used only in the Google Maps search links and are not saved by GENEVIEVE.','green');
      Bridge()?.saveEvidence?.('emergency_nearby_services_prepared',{coordinatesStored:false,callNotAutomatic:true});
    },error=>{
      emergencySearchLocation=null;
      const reason=error.code===1?'Location permission was not allowed.':error.code===2?'The device could not determine its location.':'The location request timed out.';
      emergencyLocationStatus(`<b>${safe(reason)}</b><br>Enter the suburb, council area or town instead.`, 'red');
      updateServiceLinks();
    },{enableHighAccuracy:false,timeout:12000,maximumAge:300000});
  }

  function openServiceChooser(){
    Bridge()?.openScreen?.('emergency');
    setTimeout(()=>{
      updateServiceLinks();
      const toggle=$('#emergencyServiceToggle');
      if(toggle)toggle.open=true;
      const globalButton=$('#globalEmergencyButton');
      globalButton?.setAttribute('aria-expanded','true');
      toggle?.scrollIntoView?.({behavior:document.body.classList.contains('reduced-motion')?'auto':'smooth',block:'start'});
    $('#serviceLocation')?.focus();
    },0);
  }

  function tripValues(form){
    const checked=selector=>$$(selector+' input:checked').map(input=>input.value);
    return {
      id:uid('trip'),
      from:String(form.elements.from.value||'').trim(),
      to:String(form.elements.to.value||'').trim(),
      requiredPlaces:NationalTripService?.requiredPlaces?.(form.elements.requiredPlaces?.value)||String(form.elements.requiredPlaces?.value||'').split(/\r?\n/).map(value=>value.trim()).filter(Boolean),
      routeStyle:String(form.elements.routeStyle.value||'fastest'),
      fromLatitude:String(form.elements.fromLatitude?.value||''),
      fromLongitude:String(form.elements.fromLongitude?.value||''),
      dogId:String(form.elements.dog.value||''),
      departureDate:String(form.elements.departureDate?.value||''),
      dogFriendlyOnly:form.elements.dogFriendlyOnly?.checked!==false,
      needs:checked('#tripNeeds'),
      stayNeeds:checked('#tripStayNeeds'),
      safetyNeeds:checked('#tripSafetyNeeds'),
      cafeMealMax:Math.max(0,Number(form.elements.cafeMealMax?.value)||20),
      pubMealMax:Math.max(0,Number(form.elements.pubMealMax?.value)||60),
      accommodationMin:Math.max(0,Number(form.elements.accommodationMin?.value)||0),
      accommodationMax:Math.max(0,Number(form.elements.accommodationMax?.value)||180),
      dailyBudget:Math.max(0,Number(form.elements.dailyBudget?.value)||300),
      totalBudget:Math.max(0,Number(form.elements.totalBudget?.value)||0),
      notes:String(form.elements.notes.value||'').trim(),
      time:now(),
      version:VERSION
    };
  }

  function routeStyleLabel(value){return TripPlanner?.routeStyleLabel?.(value)||'Calculated route';}

  function tripAttention(score,label,meaning=''){
    const value=Math.max(1,Math.min(10,Number(score)||1));
    const level=value<=2?'green':value<=5?'yellow':value<=7?'amber':'red';
    return {score:value,level,label,meaning};
  }

  function tripAttentionBadge(alert){
    if(!alert)return '';
    return `<span class="trip-alert-badge ${safe(alert.level||tripAttention(alert.score).level)}"><b>${safe(alert.score)}/10</b> ${safe(alert.label||'planning attention')}</span>`;
  }

  function cloneJson(value){
    try{return JSON.parse(JSON.stringify(value));}catch{return value;}
  }

  async function sha256(value){
    if(!globalThis.crypto?.subtle)return '';
    const bytes=new TextEncoder().encode(String(value));
    const digest=await globalThis.crypto.subtle.digest('SHA-256',bytes);
    return [...new Uint8Array(digest)].map(byte=>byte.toString(16).padStart(2,'0')).join('');
  }

  function mapsSearchUrl(terms,location){
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${terms} ${location}`)}`;
  }

  function webSearchUrl(terms){
    return `https://www.google.com/search?q=${encodeURIComponent(terms)}`;
  }

  function tripRouteUrl(origin,destination,stops=[]){
    const base=`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=driving`;
    return stops.length?`${base}&waypoints=${encodeURIComponent(stops.slice(0,8).join('|'))}`:base;
  }

  function stayTypes(plan){
    return (plan.stayNeeds&&plan.stayNeeds.length)?plan.stayNeeds:[
      'Pet-friendly caravan park','Pet-friendly hotel or motel','Pet-friendly Airbnb or holiday home'
    ];
  }

  function offerCard(title,subtitle,url,kind='choice'){
    return `<article class="route-offer-card ${kind}"><div><b>${safe(title)}</b><p>${safe(subtitle)}</p></div><a class="button-link secondary-link" href="${safe(url)}" target="_blank" rel="noopener">See offers</a></article>`;
  }

  function renderRouteOffers(plan,stops){
    const el=$('#routeOffers');if(!el)return;
    if(!plan){el.innerHTML='<div class="empty">Build a trip plan above and GENEVIEVE will present route-based options within the budget targets.</div>';return;}
    const safety=(plan.safetyNeeds||[]).join(' '),dogFriendly=plan.dogFriendlyOnly!==false?'dog friendly ':'';
    const stays=stayTypes(plan).slice(0,5);
    el.innerHTML=stops.map((stop,index)=>{
      const stopName=typeof stop==='string'?stop:(stop?.name||stop?.resolvedLabel||stop?.mapQuery||'Route stop');
      const stopQuery=typeof stop==='string'?stop:(stop?.mapQuery||stopName);
      const isDestination=index===stops.length-1;
      const offers=[
        offerCard('Closest suitable dog park',`${isDestination?'Destination':'Route stop '+(index+1)}. Prioritise fencing, water, shade and the selected safety needs.`,mapsSearchUrl(`${dogFriendly}dog park fenced water shade ${safety}`,stopQuery),'park'),
        offerCard(`Café meal target up to A$${plan.cafeMealMax}`,`Dog-friendly café choices shaped to the user’s meal limit. Confirm the current menu price and outdoor dog policy.`,mapsSearchUrl(`${dogFriendly}cafe meals under $${plan.cafeMealMax}`,stopQuery),'food'),
        offerCard(`Pub or restaurant meal target up to A$${plan.pubMealMax}`,`Dog-friendly meal choices within the selected target. Confirm the final price, service area and dog access.`,mapsSearchUrl(`${dogFriendly}pub restaurant meals under $${plan.pubMealMax}`,stopQuery),'food')
      ];
      stays.forEach(type=>offers.push(offerCard(`${type} · A$${plan.accommodationMin}–A$${plan.accommodationMax} per night`,`Search target only. Confirm the total price, pet fee, bond, fencing, security, dog size rules and whether dogs may be left unattended.`,webSearchUrl(`${type} ${stopName} under $${plan.accommodationMax} dog friendly`),'stay')));
      offers.push(offerCard('Emergency veterinarian backup','Phone first and confirm current after-hours availability before relying on the listing.',mapsSearchUrl('24 hour emergency veterinarian open now',stopQuery),'service'));
      return `<section class="route-stop-offers"><div class="route-stop-heading"><span>${isDestination?'✓':index+1}</span><div><h3>${safe(stopName)}${isDestination?' · destination':''}</h3><p>Choose from these route-based options. GENEVIEVE does not auto-book or guarantee price, access or availability.</p></div></div><div class="route-offer-grid">${offers.join('')}</div></section>`;
    }).join('');
  }

  function calculateTrip(plan){
    const state=getState(),dog=state.dogs.find(item=>item.id===plan.dogId)||state.dogs[0];
    if(!TripPlanner)return {calculable:false,error:'The automatic trip calculator did not load. Refresh the app before planning.'};
    if(!dog)return {calculable:false,error:'Save a dog profile before building a dog-first route.'};
    if(plan?.calculationSnapshot?.calculable)return {...cloneJson(plan.calculationSnapshot),dog};
    const local=TripPlanner.planRoutes(plan,dog);
    if(local.calculable){
      local.attention=tripAttention(5,'Supported route estimate','This saved or legacy plan uses GENEVIEVE’s curated local estimate, not a newly resolved national road geometry. Confirm the live route.');
      local.selected.attention=local.attention;
      local.provider='GENEVIEVE curated route estimate';
      local.liveRoadCalculation=false;
      local.selected.parts.forEach(part=>{
        if(part.type==='ferry')part.attention=tripAttention(7,'Ferry and pet space need confirmation','Confirm the sailing and selected pet transport arrangement with the operator.');
        else part.stops.forEach(stop=>{stop.attention=tripAttention(stop.overnight?7:6,stop.overnight?'Overnight place must be verified':'Safe stopping place must be verified','The suggested area is not confirmation of a lawful, available or safe stopping facility.');});
      });
    }
    return {...local,dog};
  }

  async function offlineCalculation(plan,dog,nationalFailure){
    const local=TripPlanner.planRoutes(plan,dog);
    if(!local.calculable)return {calculable:false,error:nationalFailure?.error||local.error,attention:nationalFailure?.attention||tripAttention(9,'Route not calculated','No stop count has been produced.'),errorCode:nationalFailure?.errorCode||'route_not_calculable',nationalAttempted:Boolean(nationalFailure)};
    const alert=tripAttention(5,'Supported route estimate','The configured national road service was unavailable, so this is a curated GENEVIEVE estimate for recognised places. Live roads and stopping facilities must be confirmed.');
    local.attention=alert;local.provider='GENEVIEVE curated route estimate';local.liveRoadCalculation=false;local.nationalFailure={errorCode:nationalFailure?.errorCode||'',message:nationalFailure?.error||''};
    local.selected.attention=alert;
    local.options.forEach(option=>{
      option.attention=alert;
      option.parts.forEach(part=>{
        if(part.type==='ferry')part.attention=tripAttention(7,'Ferry and pet space need confirmation','Confirm the sailing and selected pet transport arrangement with the operator.');
        else part.stops.forEach(stop=>{stop.attention=tripAttention(stop.overnight?7:6,stop.overnight?'Overnight place must be verified':'Safe stopping place must be verified','This estimate identifies an area to search. It does not verify a lawful, available or safe stopping facility.');});
      });
    });
    const selected=local.selected,calculatedAt=now();
    const record={recordType:'GENEVIEVE Animal trip calculation',appVersion:VERSION,ruleVersion:`curated-${TripPlanner.version}`,calculatedAt,inputs:{from:plan.from,to:plan.to,requiredPlaces:plan.requiredPlaces||[],dogBreakHours:selected.policy.hours,routeStyleRequested:plan.routeStyle,currentLocationUsed:Boolean(plan.fromLatitude)},outputs:{roadKm:selected.roadKm,driveHours:selected.driveHours,requiredBreaks:selected.requiredBreaks,roadOvernights:selected.roadOvernights,roadDays:selected.roadDays,ferryRequired:selected.hasFerry,calculationMode:'curated estimate'}};
    local.evidence={recordType:record.recordType,appVersion:VERSION,ruleVersion:record.ruleVersion,calculatedAt,algorithm:'SHA-256',calculationHash:await sha256(JSON.stringify(record)),calculationRecord:record,provider:local.provider,mapData:'Curated GENEVIEVE route points'};
    return local;
  }

  async function prepareCalculatedPlan(plan){
    const state=getState(),dog=state.dogs.find(item=>item.id===plan.dogId)||state.dogs[0];
    if(!TripPlanner)return {calculation:{calculable:false,error:'The automatic trip calculator did not load. Refresh the app before planning.',attention:tripAttention(9,'Calculator not loaded')},plan:null};
    if(!dog)return {calculation:{calculable:false,error:'Save a dog profile before building a dog-first route.',attention:tripAttention(9,'Dog profile required')},plan:null};
    let calculation=NationalTripService?await NationalTripService.calculate(plan,dog,{planner:TripPlanner}):{calculable:false,error:'The Australia-wide route module did not load.',errorCode:'national_module_missing',attention:tripAttention(9,'National route module not loaded')};
    if(!calculation.calculable)calculation=await offlineCalculation(plan,dog,calculation);
    if(!calculation.calculable)return {calculation:{...calculation,dog},plan:null};
    calculation.dog=dog;
    const selected=calculation.selected;
    const snapshot=cloneJson(calculation);delete snapshot.dog;
    return {calculation,plan:{...plan,dogId:dog.id,automaticPlanning:true,automaticBreakHours:selected.policy.hours,automaticStopCount:selected.requiredBreaks,automaticRoadOvernights:selected.roadOvernights,automaticFerryCount:selected.ferryCount??(selected.hasFerry?1:0),ferryRequired:selected.hasFerry,routeAttentionScore:selected.attention?.score||calculation.attention?.score||5,calculationMode:calculation.liveRoadCalculation?'australia-wide-live-road':'curated-offline-estimate',calculationVersion:calculation.evidence?.ruleVersion||TripPlanner.version,calculationHash:calculation.evidence?.calculationHash||'',calculatedAt:calculation.evidence?.calculatedAt||now(),calculationSnapshot:snapshot}};
  }

  function routeOptionsMarkup(plan,calculation){
    const oneLiveOption=calculation.liveRoadCalculation&&calculation.options.length===1;
    return `<section class="automatic-route-options" aria-label="Calculated route choices"><div class="section-heading"><div><p class="eyebrow">${oneLiveOption?'AUSTRALIA-WIDE ROAD CALCULATION':'ROUTES OFFERED FROM YOUR INPUT'}</p><h3>${oneLiveOption?'The road route is calculated — the dog-stop count is automatic':'Choose the route — not the safety stop count'}</h3></div></div><div class="route-choice-grid">${calculation.options.map(option=>{
      const selected=option.style===calculation.selected.style,via=option.summaryTowns.length?`Via ${option.summaryTowns.join(' · ')}`:'Direct route estimate';
      return `<article class="route-choice-card ${selected?'selected':''}"><div><p class="eyebrow">${option.recommended?'RECOMMENDED FIRST':'ALTERNATIVE'}</p><div class="trip-alert-row">${tripAttentionBadge(option.attention||calculation.attention)}</div><h4>${safe(option.label)}</h4><p>${safe(via)}</p><div class="route-choice-stats"><span><b>${option.requiredBreaks}</b> required dog breaks</span><span><b>${option.roadOvernights}</b> road overnight${option.roadOvernights===1?'':'s'}</span><span><b>~${option.driveHours} h</b> road driving</span><span><b>~${Number(option.roadKm||0).toLocaleString('en-AU')} km</b> road calculation</span></div>${option.hasFerry?'<p class="ferry-chip">Includes the Geelong–Devonport ferry</p>':''}${option.routeStyleNotice?`<p class="muted">${safe(option.routeStyleNotice)}</p>`:''}</div>${oneLiveOption?'':`<button class="${selected?'secondary':'primary'}" data-trip-id="${safe(plan.id)}" data-use-trip-route="${safe(option.style)}" type="button" ${selected?'disabled':''}>${selected?'Route selected':'Use this route'}</button>`}</article>`;
    }).join('')}</div></section>`;
  }

  function stopCardsMarkup(variant){
    let number=0;
    return variant.parts.map(part=>{
      if(part.type==='ferry'){
        const board=part.from.name==='Geelong VIC'?part.geelongTerminal:part.devonportTerminal;
        const arrive=part.to.name==='Devonport TAS'?part.devonportTerminal:part.geelongTerminal;
        return `<article class="trip-stop-card ferry-step"><span aria-hidden="true">⛴</span><div><div class="trip-alert-row">${tripAttentionBadge(part.attention||tripAttention(7,'Ferry confirmation required'))}</div><b>Ferry · ${safe(part.direction)}</b><p>Board at ${safe(board)} and arrive at ${safe(arrive)}. The crossing is ${safe(part.crossingHours)}. Reserve and confirm the pet transport option for the chosen sailing; kennel or eligible pet-friendly cabin arrangements can differ.</p><div class="button-row compact"><a class="button-link" href="${safe(part.operatorUrl)}" target="_blank" rel="noopener">Check or book ferry and pet space</a><a class="button-link secondary-link" href="${safe(part.petRulesUrl)}" target="_blank" rel="noopener">Current pet rules</a><a class="button-link secondary-link" href="${safe(part.scheduleUrl)}" target="_blank" rel="noopener">Sailing schedule</a></div></div></article>`;
      }
      return part.stops.map(stop=>{
        number+=1;
        const searchLocation=stop.searchLocation||stop.mapQuery||stop.name;
        const alert=stop.attention||tripAttention(stop.overnight?7:6,stop.overnight?'Overnight place must be verified':'Safe stopping place must be verified');
        return `<article class="trip-stop-card ${stop.overnight?'overnight-stop':''} ${safe(alert.level)}"><span>${number}</span><div><div class="trip-alert-row">${tripAttentionBadge(alert)}</div><b>${safe(stop.name)}${stop.overnight?' · road overnight hub':''}</b><p><b>Required by about ${safe(stop.plannedHour)} driving hours into this road section.</b> Stop for water, toileting, movement and a calm reassessment. ${stop.overnight?'End the road-driving day here or at a verified nearby dog-friendly stay.':'Continue only when both dog and driver are ready.'} Stop earlier if live traffic, heat, stress, illness or fatigue reaches the limit first.</p>${stop.routeCoordinateCalculated&&!stop.stoppingFacilityVerified?'<p class="muted"><b>The road position is calculated; the stopping facility is not verified.</b> Choose a lawful, signed, dog-safe place at or before this point.</p>':''}<a class="button-link secondary-link" href="${mapsSearchUrl('dog friendly rest area park shade water toilets',searchLocation)}" target="_blank" rel="noopener">Find an earlier safe signed stop near here</a></div></article>`;
      }).join('');
    }).join('');
  }

  function roadDirectionsMarkup(variant){
    let day=0;
    const links=[];
    variant.parts.filter(part=>part.type==='road').forEach(part=>{
      day+=1;
      let origin=part.start.mapQuery||part.start.name,waypoints=[],leg=1;
      const events=[
        ...part.stops.map(stop=>({...stop,eventType:'dog-stop'})),
        ...(part.requiredWaypoints||[]).map(point=>({...point,eventType:'required-place',overnight:false}))
      ].sort((a,b)=>Number(a.plannedHour||0)-Number(b.plannedHour||0));
      const addLink=(destination,label)=>{
        links.push(`<a class="button-link" href="${tripRouteUrl(origin,destination,waypoints)}" target="_blank" rel="noopener">Road day ${day}${leg>1?`, leg ${leg}`:''}: ${safe(label)}</a>`);
        origin=destination;waypoints=[];leg+=1;
      };
      events.forEach(event=>{
        const query=event.mapQuery||event.name;
        if(event.overnight){
          addLink(query,`${part.start.name} → ${event.name}`);
          day+=1;leg=1;
        }else if(waypoints.length>=7){
          addLink(query,`${origin} → ${event.name}`);
        }else if(!event.synthetic)waypoints.push(query);
      });
      addLink(part.end.mapQuery||part.end.name,`${origin} → ${part.end.name}`);
    });
    const required=(variant.parts||[]).flatMap(part=>part.requiredWaypoints||[]).map(point=>point.mapQuery||point.name);
    const compare=variant.start&&variant.end?`<a class="button-link secondary-link" href="${tripRouteUrl(variant.start.mapQuery||variant.start.name,variant.end.mapQuery||variant.end.name,required)}" target="_blank" rel="noopener">Compare current external map alternatives</a>`:'';
    return `<section class="trip-directions"><h3>How to get there — open one road day at a time</h3><div class="trip-search-links">${links.join('')}${compare}</div><p class="muted">External directions control the roads actually used and may change with current conditions. If their driving time is longer, take an earlier safe signed break — never stretch the dog’s interval to match the itinerary.</p></section>`;
  }

  function officialTripSourcesMarkup(hasFerry,calculation){
    const provider=calculation.liveRoadCalculation?`<a class="button-link secondary-link" href="${safe(calculation.providerUrl||'https://openrouteservice.org/')}" target="_blank" rel="noopener">openrouteservice routing</a><a class="button-link secondary-link" href="${safe(calculation.mapDataUrl||'https://www.openstreetmap.org/copyright')}" target="_blank" rel="noopener">OpenStreetMap attribution</a>`:'';
    return `<details class="trip-source-panel"><summary>Why GENEVIEVE calculates the stops this way</summary><p>The automatic baseline follows Queensland fatigue guidance to stop for at least 15 minutes every two hours. The app uses a more conservative eight-hour road-driving day for overnight planning. RSPCA guidance also calls for plenty of dog toilet and exercise breaks and warns never to leave a dog unattended in a vehicle.</p><div class="trip-search-links"><a class="button-link secondary-link" href="https://www.qld.gov.au/transport/safety/road-safety/driving-safely/driving-tired" target="_blank" rel="noopener">Queensland driving-tired guidance</a><a class="button-link secondary-link" href="https://kb.rspca.org.au/categories/companion-animals/pets-and-holidays/what-do-i-need-to-know-about-taking-my-dog-on-a-road-trip-with-my-family" target="_blank" rel="noopener">RSPCA dog road-trip guidance</a>${provider}${hasFerry?`<a class="button-link secondary-link" href="${safe(TripPlanner.ferry.petRulesUrl)}" target="_blank" rel="noopener">Spirit of Tasmania pet rules</a>`:''}</div>${calculation.providerAttribution?`<p class="muted">${safe(calculation.providerAttribution)}</p>`:''}</details>`;
  }

  function resolvedLocationsMarkup(calculation){
    if(!calculation.resolvedLocations?.length)return '';
    return `<details class="trip-source-panel resolved-trip-places"><summary>Australian places resolved for this calculation</summary><ol>${calculation.resolvedLocations.map(location=>`<li><b>${safe(location.sourceQuery||location.name)}</b> → ${safe(location.resolvedLabel||location.name)}${location.genericRegion?' · regional input ends at the Devonport ferry terminal':''}</li>`).join('')}</ol></details>`;
  }

  function calculationEvidenceMarkup(calculation){
    const record=calculation.evidence;if(!record)return '';
    return `<details class="trip-source-panel calculation-record"><summary>Dated calculation record and fingerprint</summary><p><b>Calculated:</b> ${safe(new Date(record.calculatedAt||Date.now()).toLocaleString('en-AU'))}<br/><b>Animal trip rule:</b> ${safe(record.ruleVersion||'Not recorded')}<br/><b>Calculation mode:</b> ${safe(calculation.liveRoadCalculation?'Australia-wide road geometry':'Curated route estimate')}<br/><b>SHA-256 fingerprint:</b> <code>${safe(record.calculationHash||'Fingerprint unavailable in this browser')}</code></p><p class="muted">The fingerprint can help show whether the exported calculation record has changed. It is not a digital signature and does not itself prove a patent claim.</p></details>`;
  }

  function renderTripPlan(plan,calculationOverride=null){
    const el=$('#tripResult');if(!el)return;
    if(!plan){el.innerHTML='<div class="empty">Enter a start, destination and dog. GENEVIEVE will calculate the stops and show how to get there.</div>';renderRouteOffers(null,[]);return;}
    const calculation=calculationOverride||calculateTrip(plan);
    if(!calculation.calculable){const alert=calculation.attention||tripAttention(9,'Route not calculated');el.innerHTML=`<div class="answer red"><div class="trip-alert-row">${tripAttentionBadge(alert)}</div><b>A stop count was not invented.</b><br>${safe(calculation.error)}</div>`;renderRouteOffers(null,[]);return;}
    const dog=calculation.dog,guide=Logic.dogProfileGuide(dog),selected=calculation.selected;
    const wanted=[...(plan.needs||[]),...(plan.stayNeeds||[]),...(plan.safetyNeeds||[])];
    const days=Math.max(1,selected.roadDays),nights=Math.max(0,selected.roadOvernights);
    const cafeMealMax=Number(plan.cafeMealMax??20),pubMealMax=Number(plan.pubMealMax??60),accommodationMin=Number(plan.accommodationMin??0),accommodationMax=Number(plan.accommodationMax??180),dailyBudget=Number(plan.dailyBudget??300),totalBudget=Number(plan.totalBudget||0);
    const planningMaximum=nights*accommodationMax+days*(cafeMealMax+pubMealMax);
    const totalCheck=totalBudget>0?(planningMaximum<=totalBudget?'Road plan is within the selected total planning limit':'Road plan is above the selected total planning limit'):'No total trip cap entered';
    const genericTasmania=/^tasmania$/i.test(String(plan.to||'').trim());
    const routeAlert=selected.attention||calculation.attention||tripAttention(calculation.liveRoadCalculation?2:5,calculation.liveRoadCalculation?'Australian road geometry calculated':'Supported route estimate');
    const routeStatus=calculation.liveRoadCalculation?'The Australian places and road geometry were calculated by the configured route service. This green alert covers calculation status only.':'This recognised route uses GENEVIEVE’s curated estimate because live national road routing was unavailable. It is not a live-road verification.';
    const ferryCount=selected.ferryCount??(selected.hasFerry?1:0);
    el.innerHTML=`<div class="trip-plan-summary"><div class="stat"><b>${safe(plan.from)} → ${safe(plan.to)}</b>${safe(selected.label)}${plan.departureDate?` · leaving ${safe(new Date(`${plan.departureDate}T00:00:00`).toLocaleDateString('en-AU'))}`:''}</div><div class="answer ${safe(routeAlert.level)}"><div class="trip-alert-row">${tripAttentionBadge(routeAlert)}</div><b>${safe(routeAlert.label)}</b><br>${safe(routeStatus)}</div>${genericTasmania?'<div class="answer yellow"><b>No Tasmanian town was guessed.</b><br>Because the destination says only “Tasmania”, this calculation ends at the Devonport ferry terminal. Enter a Tasmanian address or town to calculate the onward dog stops.</div>':''}${resolvedLocationsMarkup(calculation)}<section class="automatic-stop-totals"><div><strong>${selected.requiredBreaks}</strong><span>required dog-care break${selected.requiredBreaks===1?'':'s'}${selected.roadOvernights?' including overnight stops':''}</span></div><div><strong>${selected.roadOvernights}</strong><span>road overnight stop${selected.roadOvernights===1?'':'s'}</span></div><div><strong>${ferryCount}</strong><span>ferry crossing${ferryCount===1?'':'s'}</span></div></section><div class="answer green"><b>GENEVIEVE calculated these stops — the person did not choose them.</b><br>${safe(dog.name)} is planned at no more than ${safe(selected.policy.hours)} hours between road breaks. ${safe(selected.policy.explanation)}</div><div class="route-estimate-line"><b>${calculation.liveRoadCalculation?'Road calculation':'Planning estimate'}:</b> about ${safe(Number(selected.roadKm||0).toLocaleString('en-AU'))} road km and ${safe(selected.driveHours)} road-driving hours. Current external directions and safe signed stopping places override the calculation.</div>${routeOptionsMarkup(plan,calculation)}${guide?`<div class="answer ${guide.level}"><b>${safe(dog.name)} profile guide ${guide.score}/10</b><br>${safe(guide.action)}</div>`:''}<h3>${selected.requiredBreaks} required dog-care breaks on the selected route</h3><div class="trip-stop-list">${selected.requiredBreaks?stopCardsMarkup(selected):'<div class="answer green"><b>No en-route dog stop is required by the selected profile ceiling.</b><br>Stop earlier whenever the dog, road, weather or driver needs it.</div>'}</div>${roadDirectionsMarkup(selected)}<div class="budget-summary"><div class="stat"><b>A$${cafeMealMax}</b>Café meal maximum</div><div class="stat"><b>A$${pubMealMax}</b>Pub/restaurant meal maximum</div><div class="stat"><b>A$${accommodationMin}–A$${accommodationMax}</b>Road accommodation per night</div><div class="stat"><b>A$${dailyBudget}</b>Maximum daily spend</div></div><div class="answer ${totalBudget>0&&planningMaximum>totalBudget?'amber':'green'}"><b>${safe(totalCheck)}</b><br>Road-planning envelope from selected maxima: up to A$${planningMaximum} across about ${days} road day${days===1?'':'s'} and ${nights} road night${nights===1?'':'s'}. Ferry fares, pet transport, cabins, fuel and live prices are not included.</div><div class="chips">${(plan.requiredPlaces||[]).map(item=>`<span class="chip">Required place: ${safe(item)}</span>`).join('')}${wanted.length?wanted.map(item=>`<span class="chip">${safe(item)}</span>`).join(''):'<span class="chip">Core park, food, stay and vet offers included</span>'}</div>${plan.notes?`<p><b>Extra needs:</b> ${safe(plan.notes)}</p>`:''}${calculationEvidenceMarkup(calculation)}${officialTripSourcesMarkup(selected.hasFerry,calculation)}<div class="answer yellow"><div class="trip-alert-row">${tripAttentionBadge(tripAttention(5,'Current conditions still need checking'))}</div><b>Verification gate.</b><br>Confirm current route conditions, every stopping place, heat, ferry pet space, sailing/check-in time, accommodation pet rules, price, access, fencing and veterinary support directly. Never leave the dog unattended in a vehicle.</div></div>`;
    const overnightStops=selected.stops.filter(stop=>stop.overnight).map(stop=>({name:stop.name,mapQuery:stop.mapQuery}));
    const requiredStops=(calculation.resolvedLocations||[]).filter(location=>location.kind==='required').map(location=>({name:location.name||location.resolvedLabel,mapQuery:location.mapQuery}));
    const destination={name:selected.end.name||plan.to,mapQuery:selected.end.mapQuery||selected.end.name||plan.to};
    const offerStops=[...overnightStops,...requiredStops,destination];
    renderRouteOffers(plan,[...new Map(offerStops.map(stop=>[stop.mapQuery||stop.name,stop])).values()]);
    if($('#travelVetLocation'))$('#travelVetLocation').value=selected.end.name;
    if($('#stayLocation'))$('#stayLocation').value=selected.end.name;
    updateTravelLinks();
  }

  function renderSavedTrips(){
    const el=$('#savedTripPlans');if(!el)return;
    const trips=getState().trips||[];
    el.innerHTML=trips.length?trips.map(plan=>{
      const calculation=calculateTrip(plan),selected=calculation.calculable?calculation.selected:null;
      const automaticCount=selected?.requiredBreaks??plan.automaticStopCount;
      const alert=selected?.attention||calculation.attention||tripAttention(plan.routeAttentionScore||5,'Saved calculation');
      return `<article class="record-card ${safe(alert.level)}"><div class="trip-alert-row">${tripAttentionBadge(alert)}</div><b>${safe(plan.from)} → ${safe(plan.to)}</b><p>${safe(selected?.label||routeStyleLabel(plan.routeStyle))} · ${Number.isFinite(Number(automaticCount))?`${Number(automaticCount)} automatically calculated dog breaks`:'recalculate to update stops'} · ${selected?.roadOvernights??plan.automaticRoadOvernights??0} road overnight${(selected?.roadOvernights??plan.automaticRoadOvernights)===1?'':'s'}${selected?.hasFerry||plan.ferryRequired?' · ferry required':''} · ${new Date(plan.calculatedAt||plan.time||Date.now()).toLocaleString('en-AU')}</p>${(plan.requiredPlaces||[]).length?`<p><b>Required places:</b> ${safe(plan.requiredPlaces.join(' · '))}</p>`:''}${plan.calculationHash?`<p class="record-hash"><b>SHA-256:</b> ${safe(plan.calculationHash)}</p>`:''}<div class="button-row compact"><button type="button" data-load-trip="${safe(plan.id)}">Open plan</button><button type="button" class="danger" data-delete-trip="${safe(plan.id)}">Delete</button></div></article>`;
    }).join(''):'<div class="empty">No saved trip plans.</div>';
    populateTripFindingChoices();
  }

  function saveTrip(plan){
    Bridge()?.updateState?.(state=>{
      state.trips=Array.isArray(state.trips)?state.trips:[];
      state.trips.unshift(plan);
      state.trips=state.trips.slice(0,100);
    });
    Bridge()?.saveEvidence?.('grey_nomad_trip_plan_created',{id:plan.id,from:plan.from,to:plan.to,requiredPlaces:plan.requiredPlaces,routeStyle:plan.routeStyle,automaticStopCount:plan.automaticStopCount,automaticBreakHours:plan.automaticBreakHours,automaticRoadOvernights:plan.automaticRoadOvernights,automaticFerryCount:plan.automaticFerryCount,ferryRequired:plan.ferryRequired,routeAttentionScore:plan.routeAttentionScore,calculationMode:plan.calculationMode,calculationVersion:plan.calculationVersion,calculationHash:plan.calculationHash,dogFriendlyOnly:plan.dogFriendlyOnly,needs:plan.needs,stayNeeds:plan.stayNeeds,safetyNeeds:plan.safetyNeeds});
    setTimeout(()=>{renderTripPlan(plan);renderSavedTrips();renderTripFindings();},0);
  }

  async function chooseTripRoute(id,style){
    const existing=(getState().trips||[]).find(item=>item.id===id);if(!existing)return;
    setTripCalculationStatus('<b>Recalculating this route…</b><br>The dog-stop count will be replaced with the selected route result.','yellow');
    const prepared=await prepareCalculatedPlan({...existing,routeStyle:style});
    if(!prepared.plan){setTripCalculationStatus(`<b>Route not changed.</b><br>${safe(prepared.calculation.error)}`,'red');renderTripPlan(existing);return;}
    const updated={...prepared.plan,id:existing.id,time:existing.time};
    Bridge()?.updateState?.(state=>{const index=(state.trips||[]).findIndex(item=>item.id===id);if(index>=0)state.trips[index]=updated;});
    if($('#tripForm')?.elements.routeStyle)$('#tripForm').elements.routeStyle.value=style;
    Bridge()?.saveEvidence?.('trip_route_selected',{id,routeStyle:style,automaticStopCount:updated.automaticStopCount,calculationHash:updated.calculationHash,calculationMode:updated.calculationMode});
    setTripCalculationStatus(`<b>${updated.calculationMode==='australia-wide-live-road'?'Australia-wide road route recalculated.':'Curated route estimate recalculated.'}</b><br>${updated.automaticStopCount} dog-care stops are required by the selected profile rule.`,updated.calculationMode==='australia-wide-live-road'?'green':'yellow');
    setTimeout(()=>{renderTripPlan(updated);renderSavedTrips();},0);
  }

  function loadTrip(id){
    const plan=(getState().trips||[]).find(item=>item.id===id);if(!plan)return;
    const form=$('#tripForm');
    form.elements.from.value=plan.from||'';form.elements.to.value=plan.to||'';form.elements.requiredPlaces.value=(plan.requiredPlaces||[]).join('\n');form.elements.fromLatitude.value=plan.fromLatitude||'';form.elements.fromLongitude.value=plan.fromLongitude||'';form.elements.routeStyle.value=plan.routeStyle||'fastest';form.elements.dog.value=plan.dogId||form.elements.dog.value;form.elements.departureDate.value=plan.departureDate||'';form.elements.dogFriendlyOnly.checked=plan.dogFriendlyOnly!==false;form.elements.cafeMealMax.value=plan.cafeMealMax??20;form.elements.pubMealMax.value=plan.pubMealMax??60;form.elements.accommodationMin.value=plan.accommodationMin??0;form.elements.accommodationMax.value=plan.accommodationMax??180;form.elements.dailyBudget.value=plan.dailyBudget??300;form.elements.totalBudget.value=plan.totalBudget||'';form.elements.notes.value=plan.notes||'';
    $$('#tripNeeds input').forEach(i=>i.checked=(plan.needs||[]).includes(i.value));
    $$('#tripStayNeeds input').forEach(i=>i.checked=(plan.stayNeeds||[]).includes(i.value));
    $$('#tripSafetyNeeds input').forEach(i=>i.checked=(plan.safetyNeeds||[]).includes(i.value));
    const status=$('#tripLocationStatus');if(status)status.textContent=plan.fromLatitude?'Saved current-location coordinates restored with this trip.':'Or type a suburb, town or address.';
    setTripCalculationStatus(`<b>Saved calculation opened.</b><br>${safe(plan.calculationMode==='australia-wide-live-road'?'Australia-wide road calculation and fingerprint restored.':'Curated route estimate restored.')}`,plan.calculationMode==='australia-wide-live-road'?'green':'yellow');
    renderTripPlan(plan);$('#travel')?.scrollIntoView({block:'start',behavior:'smooth'});
  }

  function deleteTrip(id){
    Bridge()?.updateState?.(state=>{state.trips=(state.trips||[]).filter(item=>item.id!==id);});
    Bridge()?.saveEvidence?.('trip_plan_deleted',{id});
    setTimeout(()=>{renderSavedTrips();renderTripFindings();renderTripPlan(getState().trips?.[0]);},0);
  }

  function localDateTimeValue(value=new Date()){
    const date=value instanceof Date?value:new Date(value);
    if(Number.isNaN(date.getTime()))return '';
    return new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString().slice(0,16);
  }

  function populateTripFindingChoices(){
    const select=$('#tripFindingForm')?.elements.tripId;if(!select)return;
    const current=select.value,trips=getState().trips||[];
    select.innerHTML='<option value="">Choose a saved trip</option>'+trips.map(plan=>`<option value="${safe(plan.id)}">${safe(plan.from)} → ${safe(plan.to)} · ${safe(new Date(plan.calculatedAt||plan.time||Date.now()).toLocaleDateString('en-AU'))}</option>`).join('');
    if(trips.some(plan=>plan.id===current))select.value=current;
    else if(trips[0])select.value=trips[0].id;
  }

  function tripFindingRecord(form){
    const state=getState(),trip=state.trips.find(plan=>plan.id===form.elements.tripId.value);
    if(!trip)return null;
    const calculation=calculateTrip(trip),selected=calculation.calculable?calculation.selected:null;
    const observed=new Date(form.elements.observedAt.value);
    const highestAlertScore=Math.max(1,Math.min(10,Number(form.elements.highestAlertScore.value)||1));
    return {
      id:uid('tripfinding'),
      recordType:'GENEVIEVE Animal trip factual finding',
      recordVersion:'animal-trip-finding-2026-08-03-v1',
      appVersion:VERSION,
      recordedAt:now(),
      observedAt:Number.isNaN(observed.getTime())?now():observed.toISOString(),
      tripId:trip.id,
      tripResult:String(form.elements.tripResult.value||''),
      actualBreakCount:Math.max(0,Math.min(200,Number(form.elements.actualBreakCount.value)||0)),
      earlierBreakNeeded:String(form.elements.earlierBreakNeeded.value||'not-known'),
      highestAlertScore,
      highestAlertLevel:tripAttention(highestAlertScore).level,
      observations:String(form.elements.observations.value||'').trim(),
      factualConfirmation:Boolean(form.elements.factualConfirmation.checked),
      calculationHash:trip.calculationHash||calculation.evidence?.calculationHash||'',
      calculationRuleVersion:trip.calculationVersion||calculation.evidence?.ruleVersion||'',
      calculationMode:trip.calculationMode||'legacy-calculation',
      planned:{
        from:trip.from,
        to:trip.to,
        requiredPlaces:trip.requiredPlaces||[],
        departureDate:trip.departureDate||'',
        dogId:trip.dogId,
        dogBreakHours:selected?.policy?.hours??trip.automaticBreakHours,
        requiredBreaks:selected?.requiredBreaks??trip.automaticStopCount,
        roadOvernights:selected?.roadOvernights??trip.automaticRoadOvernights,
        roadKm:selected?.roadKm??null,
        driveHours:selected?.driveHours??null,
        ferryRequired:selected?.hasFerry??trip.ferryRequired,
        ferryCrossings:selected?.ferryCount??trip.automaticFerryCount??(trip.ferryRequired?1:0),
        routeAttentionScore:selected?.attention?.score??trip.routeAttentionScore??null,
        calculatedStops:cloneJson(selected?.stops||[])
      }
    };
  }

  function saveTripFinding(record){
    Bridge()?.updateState?.(state=>{
      state.tripFindings=Array.isArray(state.tripFindings)?state.tripFindings:[];
      state.tripFindings.unshift(record);
      state.tripFindings=state.tripFindings.slice(0,500);
    });
    Bridge()?.saveEvidence?.('animal_trip_finding_recorded',{id:record.id,tripId:record.tripId,observedAt:record.observedAt,calculationHash:record.calculationHash,plannedBreaks:record.planned.requiredBreaks,actualBreaks:record.actualBreakCount,earlierBreakNeeded:record.earlierBreakNeeded,highestAlertScore:record.highestAlertScore});
    setTimeout(renderTripFindings,0);
  }

  function renderTripFindings(){
    populateTripFindingChoices();
    const el=$('#tripFindingsList');if(!el)return;
    const findings=getState().tripFindings||[];
    el.innerHTML=findings.length?findings.map(record=>{
      const band=tripAttention(record.highestAlertScore||1,'Highest observed trip alert');
      return `<article class="record-card ${safe(band.level)}"><div class="trip-alert-row">${tripAttentionBadge(band)}</div><b>${safe(record.planned?.from||'Saved start')} → ${safe(record.planned?.to||'Saved destination')}</b><p><b>Observed:</b> ${safe(new Date(record.observedAt||record.recordedAt).toLocaleString('en-AU'))} · ${safe(String(record.tripResult||'').replaceAll('-',' '))}</p><p><b>Calculated / actual dog stops:</b> ${safe(record.planned?.requiredBreaks??'not recorded')} / ${safe(record.actualBreakCount)} · earlier stop needed: ${safe(record.earlierBreakNeeded)}</p><p>${safe(record.observations)}</p>${record.calculationHash?`<p class="record-hash"><b>Calculation SHA-256:</b> ${safe(record.calculationHash)}</p>`:''}<p class="muted">Recorded ${safe(new Date(record.recordedAt).toLocaleString('en-AU'))} · ${safe(record.recordVersion)}</p></article>`;
    }).join(''):'<div class="empty">No trip findings recorded.</div>';
  }

  function downloadArtifact(name,text,type){
    const blob=new Blob([text],{type}),anchor=document.createElement('a');
    anchor.href=URL.createObjectURL(blob);anchor.download=name;anchor.click();setTimeout(()=>URL.revokeObjectURL(anchor.href),1500);
  }

  function tripEvidencePayload(){
    const state=getState(),trips=state.trips||[],findings=state.tripFindings||[];
    return {
      recordType:'GENEVIEVE Animal Trip Calculations and Findings Export',
      exportedAt:now(),
      appVersion:VERSION,
      notice:'Owner-controlled dated technical testing records. This export may support evidence of development and testing; it does not itself establish patent validity, scope, ownership or grant.',
      alertScale:{green:'1–2 lower planning attention',yellow:'3–5',amber:'6–7',red:'8–10 highest planning attention',warning:'Trip alert colours are planning attention prompts, not safety predictions.'},
      calculationRules:[...new Set(trips.map(plan=>plan.calculationVersion).filter(Boolean))],
      tripCalculations:trips.map(plan=>({id:plan.id,from:plan.from,to:plan.to,requiredPlaces:plan.requiredPlaces||[],departureDate:plan.departureDate||'',dogId:plan.dogId,calculatedAt:plan.calculatedAt||plan.time,calculationMode:plan.calculationMode,calculationVersion:plan.calculationVersion,calculationHash:plan.calculationHash,automaticBreakHours:plan.automaticBreakHours,automaticStopCount:plan.automaticStopCount,automaticRoadOvernights:plan.automaticRoadOvernights,automaticFerryCount:plan.automaticFerryCount,ferryRequired:plan.ferryRequired,routeAttentionScore:plan.routeAttentionScore,calculationSnapshot:plan.calculationSnapshot||null})),
      findings,
      evidenceEvents:(state.evidence||[]).filter(event=>/trip|grey_nomad|animal/i.test(String(event.type||'')))
    };
  }

  function exportTripFindingsJson(){
    const payload=tripEvidencePayload();
    downloadArtifact(`GENEVIEVE-Animal-Trip-Findings-${new Date().toISOString().slice(0,10)}.json`,JSON.stringify(payload,null,2),'application/json');
    Bridge()?.saveEvidence?.('animal_trip_findings_exported',{format:'json',tripCount:payload.tripCalculations.length,findingCount:payload.findings.length});
  }

  function csvCell(value){
    let text=Array.isArray(value)?value.join(' | '):String(value??'');
    if(/^[=+\-@]/.test(text))text=`'${text}`;
    return `"${text.replaceAll('"','""')}"`;
  }

  function exportTripFindingsCsv(){
    const payload=tripEvidencePayload();
    const headers=['finding_id','recorded_at','observed_at','trip_id','from','to','required_places','calculation_mode','calculation_rule','calculation_sha256','planned_breaks','actual_breaks','earlier_break_needed','highest_alert_1_to_10','alert_colour','trip_result','factual_observations'];
    const rows=payload.findings.map(record=>[record.id,record.recordedAt,record.observedAt,record.tripId,record.planned?.from,record.planned?.to,record.planned?.requiredPlaces,record.calculationMode,record.calculationRuleVersion,record.calculationHash,record.planned?.requiredBreaks,record.actualBreakCount,record.earlierBreakNeeded,record.highestAlertScore,record.highestAlertLevel,record.tripResult,record.observations]);
    const csv=[headers.map(csvCell).join(','),...rows.map(row=>row.map(csvCell).join(','))].join('\r\n');
    downloadArtifact(`GENEVIEVE-Animal-Trip-Findings-${new Date().toISOString().slice(0,10)}.csv`,csv,'text/csv;charset=utf-8');
    Bridge()?.saveEvidence?.('animal_trip_findings_exported',{format:'csv',findingCount:rows.length});
  }

  function updateTravelLinks(){
    const vetLocation=$('#travelVetLocation')?.value||'Australia';
    const stayLocation=$('#stayLocation')?.value||'Australia';
    if($('#travelVetMapsLink'))$('#travelVetMapsLink').href=`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`24 hour emergency vet ${vetLocation}`)}`;
    if($('#travelVetOpenNowLink'))$('#travelVetOpenNowLink').href=`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`veterinarian open now ${vetLocation}`)}`;
    if($('#airbnbPetLink'))$('#airbnbPetLink').href=`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`pet friendly Airbnb holiday homes ${stayLocation}`)}`;
    if($('#petHotelMapsLink'))$('#petHotelMapsLink').href=`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`pet friendly hotels luxury stays ${stayLocation}`)}`;
    if($('#petCaravanMapsLink'))$('#petCaravanMapsLink').href=`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`pet friendly caravan parks ${stayLocation}`)}`;
  }

  function incidentFromForm(form){
    const data=new FormData(form);
    return {id:uid('inc'),parkId:data.get('park'),occurredAt:data.get('occurredAt')||now(),locationDetail:data.get('locationDetail'),type:data.get('type'),severity:Number(data.get('severity')),details:data.get('details'),reportedInformation:data.get('reportedInformation'),actions:data.get('actions'),witness:data.get('witness'),evidenceReference:data.get('evidenceReference'),consentToShare:data.has('consentToShare'),time:now(),status:'open',version:VERSION};
  }

  function renderIncidentRegister(){
    const el=$('#incidentList');if(!el)return;
    const state=getState(),parks=getParks();
    const name=id=>parks.find(p=>p.id===id)?.name||'Selected park';
    el.innerHTML=(state.incidents||[]).length?(state.incidents||[]).map(record=>{const band=Logic.riskBand(record.severity);return `<article class="record-card ${band.level}"><b>${safe(record.type)} · ${safe(name(record.parkId))}</b><p><b>Occurred:</b> ${safe(new Date(record.occurredAt||record.time).toLocaleString('en-AU'))}${record.locationDetail?` · ${safe(record.locationDetail)}`:''}</p><p><b>Observed:</b> ${safe(record.details)}</p>${record.reportedInformation?`<p><b>Reported by another person:</b> ${safe(record.reportedInformation)}</p>`:''}${record.actions?`<p><b>Actions:</b> ${safe(record.actions)}</p>`:''}${record.witness?`<p><b>Witness/contact:</b> ${safe(record.witness)}</p>`:''}${record.evidenceReference?`<p><b>Evidence reference:</b> ${safe(record.evidenceReference)}</p>`:''}<div class="chips"><span class="chip">${record.severity}% severity guide</span><span class="chip">${record.consentToShare?'Authorised for selected export':'Private by default'}</span></div></article>`;}).join(''):'<div class="empty">No incident records.</div>';
  }

  function saveIncident(record){
    Bridge()?.updateState?.(state=>{state.incidents=Array.isArray(state.incidents)?state.incidents:[];state.incidents.unshift(record);state.incidents=state.incidents.slice(0,500);});
    Bridge()?.saveEvidence?.('structured_incident_record_created',{id:record.id,parkId:record.parkId,type:record.type,severity:record.severity,consentToShare:record.consentToShare});
    setTimeout(renderIncidentRegister,0);
  }

  function exportIncidents(){
    const state=getState();
    const payload={exportedAt:now(),appVersion:VERSION,notice:'Factual owner-controlled records. No liability finding or guarantee of completeness.',incidents:state.incidents||[]};
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),anchor=document.createElement('a');
    anchor.href=URL.createObjectURL(blob);anchor.download=`GENEVIEVE-incident-register-${new Date().toISOString().slice(0,10)}.json`;anchor.click();setTimeout(()=>URL.revokeObjectURL(anchor.href),1500);
    Bridge()?.saveEvidence?.('incident_register_exported',{count:payload.incidents.length});
  }

  function setupEmergencyButton(){
    // Triple Zero is deliberately bound in app.js as hold for three seconds, then slide.
    // Dedicated “Other emergency services” controls open the chooser without weakening the 000 safeguard.
    $('#emergencyServiceToggle')?.addEventListener('toggle',event=>{
      const servicesButtons=$$('[data-open-emergency-services]');
      servicesButtons.forEach(button=>button.setAttribute('aria-expanded',event.currentTarget.open?'true':'false'));
    });
  }

  function applyBudgetPreset(name){
    const form=$('#tripForm');if(!form)return;
    const presets={
      value:{cafeMealMax:20,pubMealMax:40,accommodationMin:60,accommodationMax:160,dailyBudget:250},
      everyday:{cafeMealMax:20,pubMealMax:60,accommodationMin:100,accommodationMax:250,dailyBudget:350},
      premium:{cafeMealMax:50,pubMealMax:120,accommodationMin:250,accommodationMax:700,dailyBudget:900}
    };
    const preset=presets[name];if(!preset)return;
    Object.entries(preset).forEach(([field,value])=>{if(form.elements[field])form.elements[field].value=value;});
    $$('[data-budget-preset]').forEach(button=>button.classList.toggle('active',button.dataset.budgetPreset===name));
  }

  function setTripLocationStatus(message,level='muted'){
    const status=$('#tripLocationStatus');if(!status)return;
    status.className=level==='muted'?'small muted':`answer ${level}`;
    status.innerHTML=message;
  }

  function setTripCalculationStatus(message,level='yellow'){
    const status=$('#tripCalculationStatus');if(!status)return;
    status.className=`answer ${level} national-trip-status`;
    status.innerHTML=message;
  }

  function useTripLocation(){
    const form=$('#tripForm');if(!form)return;
    if(!navigator.geolocation){setTripLocationStatus('<b>Current location is not available in this browser.</b><br>Type an Australian address, suburb or town instead.','red');return;}
    setTripLocationStatus('<b>Requesting current location…</b><br>No trip is saved until you calculate the route.','yellow');
    navigator.geolocation.getCurrentPosition(position=>{
      const latitude=Number(position.coords.latitude).toFixed(5),longitude=Number(position.coords.longitude).toFixed(5);
      form.elements.from.value=`Current location (${latitude}, ${longitude})`;
      form.elements.fromLatitude.value=latitude;
      form.elements.fromLongitude.value=longitude;
      setTripLocationStatus('<b>Current location is ready as the route start.</b><br>Its coordinates will be stored on this device only if you save this trip.','green');
      Bridge()?.saveEvidence?.('trip_current_location_selected',{coordinatesIncludedInEvidence:false,storedOnlyWithSavedTrip:true});
    },error=>{
      const reason=error.code===1?'Location permission was not allowed.':error.code===2?'The device could not determine its location.':'The location request timed out.';
      setTripLocationStatus(`<b>${safe(reason)}</b><br>Type an Australian address, suburb or town instead.`,'red');
    },{enableHighAccuracy:false,timeout:12000,maximumAge:300000});
  }

  function clearTripPlan(){
    const form=$('#tripForm');if(!form)return;
    form.reset();
    form.elements.fromLatitude.value='';form.elements.fromLongitude.value='';
    setTripLocationStatus('Or type a suburb, town or address.');
    setTripCalculationStatus('<b>Australia-wide live calculation is ready to request.</b><br>The deployed service resolves Australian places and road geometry. If it cannot verify a route, GENEVIEVE does not invent a stop count.','yellow');
    $$('[data-budget-preset]').forEach(button=>button.classList.remove('active'));
    renderTripPlan(null);
  }

  function populateTripPlaces(){
    const list=$('#australianTripPlaces');if(!list||!TripPlanner)return;
    const existing=new Set([...list.querySelectorAll('option')].map(option=>option.value));
    TripPlanner.places.forEach(place=>{if(existing.has(place.name))return;const option=document.createElement('option');option.value=place.name;list.append(option);existing.add(place.name);});
  }

  function syncLegalLandingNotice(){
    const notice=$('#legalFirstUseNotice');if(!notice)return;
    const acceptance=getState().legalAcceptance||{};
    const legalVersion=window.GENEVIEVE_CONFIG?.legalVersion||'2026-08-03-trip-routing';
    const accepted=acceptance.version===legalVersion&&acceptance.termsAndPrivacyAccepted===true&&acceptance.safetyAccepted===true&&Boolean(acceptance.acceptedAt);
    let dismissed=false;try{dismissed=sessionStorage.getItem('genevieve_legal_notice_dismissed')==='yes';}catch{}
    notice.hidden=accepted||dismissed;
  }

  function setup(){
    // Park search capture handlers override the older generic filtering handler.
    $('#parkFilterForm')?.addEventListener('submit',event=>{event.preventDefault();event.stopImmediatePropagation();renderParkSearch({pushHistory:true});},true);
    $('#useParkLocation')?.addEventListener('click',useParkLocation);
    $('#clearParkSearch')?.addEventListener('click',clearParkSearch);
    $('#undoParkSearch')?.addEventListener('click',undoParkSearch);
    $$('#parkNeedControls input').forEach(input=>input.addEventListener('change',()=>{
      const query=String($('#parkFilterForm')?.elements.query?.value||'').trim();
      if(query||currentSearchLocation)renderParkSearch({coordinates:currentSearchLocation});
      else setParkStatus(`<b>LIVE STATUS · ${safe(liveTimeLabel())}</b><br>Needs updated. Enter a park, suburb or address to calculate the percentage.`);
    }));

    $('#tripForm')?.addEventListener('submit',event=>{
      event.preventDefault();event.stopImmediatePropagation();
      const form=event.currentTarget,draft=tripValues(form);if(!draft.from||!draft.to)return;
      const button=form.querySelector('button[type="submit"]');if(button)button.disabled=true;
      setTripCalculationStatus('<b>Calculating the Australian road route and dog stops…</b><br>Addresses, required places, ferry transitions and dog-profile break rules are being checked.','yellow');
      void (async()=>{
        try{
          const prepared=await prepareCalculatedPlan(draft);
          if(!prepared.plan){setTripCalculationStatus(`<b>9/10 Red · route not calculated.</b><br>${safe(prepared.calculation.error)}`,'red');renderTripPlan(draft,prepared.calculation);return;}
          const live=prepared.plan.calculationMode==='australia-wide-live-road';
          setTripCalculationStatus(`<b>${live?'2/10 Green · Australian road geometry calculated.':'5/10 Yellow · curated route estimate used.'}</b><br>${prepared.plan.automaticStopCount} dog-care stops are required by the saved dog-profile rule.`,live?'green':'yellow');
          saveTrip(prepared.plan);
        }finally{if(button)button.disabled=false;}
      })();
    },true);
    $('#useTripLocation')?.addEventListener('click',useTripLocation);
    $('#tripForm')?.elements.from?.addEventListener('input',event=>{if(!event.isTrusted)return;event.currentTarget.form.elements.fromLatitude.value='';event.currentTarget.form.elements.fromLongitude.value='';setTripLocationStatus('Typed start will be used. Choose current location again if needed.');});
    $('#clearTripPlan')?.addEventListener('click',clearTripPlan);
    $('#travelVetLocation')?.addEventListener('input',updateTravelLinks);
    $('#stayLocation')?.addEventListener('input',updateTravelLinks);
    $$('[data-budget-preset]').forEach(button=>button.addEventListener('click',()=>applyBudgetPreset(button.dataset.budgetPreset)));

    $('#tripFindingForm')?.addEventListener('submit',event=>{event.preventDefault();event.stopImmediatePropagation();const record=tripFindingRecord(event.currentTarget);if(!record)return;saveTripFinding(record);event.currentTarget.reset();event.currentTarget.elements.observedAt.value=localDateTimeValue();populateTripFindingChoices();},true);
    $('#exportTripFindingsJson')?.addEventListener('click',exportTripFindingsJson);
    $('#exportTripFindingsCsv')?.addEventListener('click',exportTripFindingsCsv);

    $('#incidentForm')?.addEventListener('submit',event=>{event.preventDefault();event.stopImmediatePropagation();const record=incidentFromForm(event.currentTarget);saveIncident(record);event.currentTarget.reset();setTimeout(()=>Bridge()?.renderAll?.(),0);setTimeout(renderIncidentRegister,10);},true);
    $('#exportIncidentRegister')?.addEventListener('click',exportIncidents);
    $('#printIncidentRegister')?.addEventListener('click',()=>window.print());

    $$('[data-open-emergency-services]').forEach(button=>button.addEventListener('click',openServiceChooser));
    $('#serviceLocation')?.addEventListener('input',()=>{
      emergencySearchLocation=null;
      updateServiceLinks();
      const location=String($('#serviceLocation')?.value||'').trim();
      emergencyLocationStatus(location?`<b>Searching around ${safe(location)}.</b><br>Open a service below to view current nearby results in Google Maps.`:'Enter a location or choose current location. Location is used only to build the service search and is not stored by GENEVIEVE.','yellow');
    });
    $('#useEmergencyLocation')?.addEventListener('click',useEmergencyLocation);
    document.addEventListener('genevieve:emergency-services-opened',()=>{
      updateServiceLinks();
      const toggle=$('#emergencyServiceToggle');
      if(toggle)toggle.open=true;
    });
    setupEmergencyButton();
    updateServiceLinks();
    updateTravelLinks();
    syncLegalLandingNotice();
    $('#dismissLegalNotice')?.addEventListener('click',()=>{try{sessionStorage.setItem('genevieve_legal_notice_dismissed','yes');}catch{}syncLegalLandingNotice();});
    $('#acceptLegal')?.addEventListener('click',()=>setTimeout(syncLegalLandingNotice,20));

    document.addEventListener('click',event=>{
      const select=event.target.closest('[data-repair-select-park]');if(select){selectPark(select.dataset.repairSelectPark);return;}
      const load=event.target.closest('[data-load-trip]');if(load){loadTrip(load.dataset.loadTrip);return;}
      const remove=event.target.closest('[data-delete-trip]');if(remove){deleteTrip(remove.dataset.deleteTrip);return;}
      const routeChoice=event.target.closest('[data-use-trip-route]');if(routeChoice){void chooseTripRoute(routeChoice.dataset.tripId,routeChoice.dataset.useTripRoute);return;}
      const parksNav=event.target.closest('[data-go="park-search"]');if(parksNav)setTimeout(()=>{if(!String($('#parkFilterForm')?.elements.query?.value||'').trim())resetParkResults();else renderParkSearch();},0);
      const travelNav=event.target.closest('[data-journey-section="travel"]');if(travelNav)setTimeout(()=>{renderSavedTrips();renderTripFindings();renderTripPlan(getState().trips?.[0]);$('#travel')?.scrollIntoView({block:'start',behavior:'smooth'});},0);
      const incidentNav=event.target.closest('[data-go="incident"]');if(incidentNav)setTimeout(renderIncidentRegister,0);
    });

    populateTripPlaces();
    renderSavedTrips();
    if($('#tripFindingForm')?.elements.observedAt&&!$('#tripFindingForm').elements.observedAt.value)$('#tripFindingForm').elements.observedAt.value=localDateTimeValue();
    renderTripFindings();
    renderIncidentRegister();
    resetParkResults();
  }

  document.addEventListener('DOMContentLoaded',setup);
})();
