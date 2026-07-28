(() => {
  'use strict';

  const VERSION = '2026.07.28.26';
  const Logic = window.GenevieveLogic;
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
  let emergencyPressStarted = 0;

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

  function parkMatches(query,stateCode,needs,coordinates){
    const lower=String(query||'').trim().toLowerCase();
    const anchor=coordinates || anchorFor(lower);
    const parks=getParks().filter(park=>{
      const hay=`${park.name} ${park.suburb} ${park.address||''} ${park.state||''} ${(park.features||[]).join(' ')}`.toLowerCase();
      const textMatch=!lower || hay.includes(lower) || Boolean(anchor);
      return textMatch && (!stateCode || park.state===stateCode) && needs.every(need=>(park.features||[]).includes(need));
    }).map(park=>{
      const km=anchor ? Logic.haversineKm(anchor.latitude,anchor.longitude,park.latitude,park.longitude) : Infinity;
      return {...park,distanceKm:km};
    });
    parks.sort((a,b)=>{
      if(anchor?.preferred){
        if(a.id===anchor.preferred)return -1;
        if(b.id===anchor.preferred)return 1;
      }
      if(a.distanceKm!==b.distanceKm)return a.distanceKm-b.distanceKm;
      return a.name.localeCompare(b.name,'en-AU');
    });
    return {anchor,matches:parks};
  }

  function parkCard(park,index){
    const nearest=index===0?'<span class="nearest-badge">Closest known match</span>':'';
    const guide=index===0?'green':index<3?'yellow':'amber';
    return `<article class="park-card nearest-park-card ${guide}">${nearest}<h3>${index+1}. ${safe(park.name)}</h3><p><b>${safe(distanceLabel(park.distanceKm))}</b><br>${safe(park.address||park.suburb)}</p><div class="chips">${(park.features||[]).map(feature=>`<span class="chip">${safe(feature)}</span>`).join('')}</div><div class="answer ${guide}"><b>${index===0?'Start with this result':'Nearby alternative'}</b><br>${safe(park.verifiedSummary||'Confirm current rules, access and facilities before travel.')}</div><p class="muted">${safe(park.warning||'Information can change. Check the official source and signs.')}</p><div class="button-row compact"><button type="button" data-repair-select-park="${safe(park.id)}">Show map</button><button type="button" data-view-park="${safe(park.id)}">Park details</button><a class="button-link secondary-link" href="${safe(park.officialUrl||'#')}" target="_blank" rel="noopener">Official source</a></div></article>`;
  }

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
    setParkStatus('<b>Enter where you want to search.</b><br>The map stays closed until a destination or location is supplied.');
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
      list.innerHTML='<div class="empty">No known park record matched every selected filter. Remove one filter or open the Australia-wide map search.</div>';
      setParkStatus(`<b>No matches in the verified and local directory records.</b><br>Try a nearby suburb or fewer facility filters.`,'amber');
      $('#parkMapPanel').hidden=true;
      return;
    }
    list.innerHTML=result.matches.map(parkCard).join('');
    const locationLabel=result.anchor?.label || (coordinates?'your device location':query);
    setParkStatus(`<b>${result.matches.length} match${result.matches.length===1?'':'es'} ranked nearest-first for ${safe(locationLabel)}.</b><br>${safe(result.matches[0].name)} is shown first. Choose “Show map” to open the map below.`,'green');
    const undo=$('#undoParkSearch');if(undo)undo.disabled=parkSearchHistory.length===0;
    Bridge()?.saveEvidence?.('park_search_repaired',{query,stateCode,needs,nearest:result.matches[0].id,locationSource:coordinates?'device':result.anchor?'place-anchor':'text'});
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
    const location=String($('#serviceLocation')?.value||'Australia').trim()||'Australia';
    $$('[data-service-search]').forEach(link=>{
      const query=`${link.dataset.serviceSearch} ${location}`;
      link.href=`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
      link.target='_blank';link.rel='noopener';
    });
  }

  function openServiceChooser(){
    Bridge()?.openScreen?.('emergency');
    setTimeout(()=>{
      updateServiceLinks();
      $('#nonEmergencyServicePanel')?.scrollIntoView?.({behavior:document.body.classList.contains('reduced-motion')?'auto':'smooth',block:'start'});
      $('#serviceLocation')?.focus();
    },0);
  }

  function tripValues(form){
    const checked=selector=>$$(selector+' input:checked').map(input=>input.value);
    return {
      id:uid('trip'),
      from:String(form.elements.from.value||'').trim(),
      to:String(form.elements.to.value||'').trim(),
      routeStyle:String(form.elements.routeStyle.value||'fastest'),
      stopCount:Math.max(1,Math.min(20,Number(form.elements.stopCount.value)||1)),
      breakHours:Number(form.elements.breakHours.value)||2,
      dogId:String(form.elements.dog.value||''),
      dogFriendlyOnly:form.elements.dogFriendlyOnly?.checked!==false,
      needs:checked('#tripNeeds'),
      stayNeeds:checked('#tripStayNeeds'),
      safetyNeeds:checked('#tripSafetyNeeds'),
      notes:String(form.elements.notes.value||'').trim(),
      time:now(),
      version:VERSION
    };
  }

  function routeStyleLabel(value){return ({coastal:'Coastal route',inland:'Inland route',fastest:'Fastest practical route',scenic:'Scenic route'}[value]||'Selected route');}

  function tripSearchUrl(terms,plan){
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${terms} between ${plan.from} and ${plan.to}`)}`;
  }

  function renderTripPlan(plan){
    const el=$('#tripResult');if(!el)return;
    if(!plan){el.innerHTML='<div class="empty">Enter a start and destination to build the trip.</div>';return;}
    const state=getState();
    const dog=state.dogs.find(item=>item.id===plan.dogId);
    const guide=dog?Logic.dogProfileGuide(dog):null;
    const route=`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(plan.from)}&destination=${encodeURIComponent(plan.to)}&travelmode=driving`;
    const stops=Array.from({length:plan.stopCount},(_,index)=>`<article class="trip-stop-card"><span>${index+1}</span><div><b>Planned stop ${index+1}</b><p>Dog break, water, toileting and a calm reassessment. Aim for no more than ${safe(plan.breakHours)} hours between breaks, adjusted for weather, traffic, age and health.</p></div></article>`).join('');
    const wanted=[...(plan.needs||[]),...(plan.stayNeeds||[]),...(plan.safetyNeeds||[])];
    const friendlyFilter=plan.dogFriendlyOnly!==false;
    el.innerHTML=`<div class="trip-plan-summary"><div class="stat"><b>${safe(plan.from)} → ${safe(plan.to)}</b>${safe(routeStyleLabel(plan.routeStyle))} · ${plan.stopCount} planned stops · dog-friendly-only search ${friendlyFilter?'on':'off'}</div>${guide?`<div class="answer ${guide.level}"><b>${safe(dog.name)} profile guide ${guide.score}/10</b><br>${safe(guide.action)}</div>`:''}<div class="chips">${wanted.length?wanted.map(item=>`<span class="chip">${safe(item)}</span>`).join(''):'<span class="chip">No optional filters selected</span>'}</div>${plan.notes?`<p><b>Extra needs:</b> ${safe(plan.notes)}</p>`:''}</div><h3>Stop framework</h3><div class="trip-stop-list">${stops}</div><div class="trip-search-links"><a class="button-link" href="${route}" target="_blank" rel="noopener">Open route in Maps</a><a class="button-link secondary-link" href="${tripSearchUrl('dog friendly parks and rest areas',plan)}" target="_blank" rel="noopener">Find dog exercise stops</a><a class="button-link secondary-link" href="${tripSearchUrl('pet friendly accommodation caravan parks hotels Airbnb',plan)}" target="_blank" rel="noopener">Find stays along route</a><a class="button-link secondary-link" href="${tripSearchUrl('dog friendly cafes restaurants',plan)}" target="_blank" rel="noopener">Find cafés and restaurants</a><a class="button-link secondary-link" href="${tripSearchUrl('24 hour emergency veterinarians',plan)}" target="_blank" rel="noopener">Find emergency vets</a></div><div class="answer yellow"><b>Verification gate.</b><br>GENEVIEVE has built a planning framework and search links, not verified bookings or guaranteed facilities. Phone each venue and confirm pet rules, fencing, security, lighting, cameras, staff coverage, fees and current availability.</div>`;
    if($('#travelVetLocation'))$('#travelVetLocation').value=plan.to;
    if($('#stayLocation'))$('#stayLocation').value=plan.to;
    updateTravelLinks();
  }

  function renderSavedTrips(){
    const el=$('#savedTripPlans');if(!el)return;
    const trips=getState().trips||[];
    el.innerHTML=trips.length?trips.map(plan=>`<article class="record-card green"><b>${safe(plan.from)} → ${safe(plan.to)}</b><p>${safe(routeStyleLabel(plan.routeStyle))} · ${Number(plan.stopCount)||0} stops · ${new Date(plan.time||Date.now()).toLocaleString('en-AU')}</p><div class="button-row compact"><button type="button" data-load-trip="${safe(plan.id)}">Open plan</button><button type="button" class="danger" data-delete-trip="${safe(plan.id)}">Delete</button></div></article>`).join(''):'<div class="empty">No saved trip plans.</div>';
  }

  function saveTrip(plan){
    Bridge()?.updateState?.(state=>{
      state.trips=Array.isArray(state.trips)?state.trips:[];
      state.trips.unshift(plan);
      state.trips=state.trips.slice(0,100);
    });
    Bridge()?.saveEvidence?.('grey_nomad_trip_plan_created',{id:plan.id,from:plan.from,to:plan.to,routeStyle:plan.routeStyle,stopCount:plan.stopCount,dogFriendlyOnly:plan.dogFriendlyOnly,needs:plan.needs,stayNeeds:plan.stayNeeds,safetyNeeds:plan.safetyNeeds});
    setTimeout(()=>{renderTripPlan(plan);renderSavedTrips();},0);
  }

  function loadTrip(id){
    const plan=(getState().trips||[]).find(item=>item.id===id);if(!plan)return;
    const form=$('#tripForm');
    ['from','to','routeStyle','stopCount','breakHours','dogId','notes'].forEach(()=>{});
    form.elements.from.value=plan.from||'';form.elements.to.value=plan.to||'';form.elements.routeStyle.value=plan.routeStyle||'fastest';form.elements.stopCount.value=plan.stopCount||4;form.elements.breakHours.value=plan.breakHours||2;form.elements.dog.value=plan.dogId||form.elements.dog.value;form.elements.dogFriendlyOnly.checked=plan.dogFriendlyOnly!==false;form.elements.notes.value=plan.notes||'';
    $$('#tripNeeds input').forEach(i=>i.checked=(plan.needs||[]).includes(i.value));
    $$('#tripStayNeeds input').forEach(i=>i.checked=(plan.stayNeeds||[]).includes(i.value));
    $$('#tripSafetyNeeds input').forEach(i=>i.checked=(plan.safetyNeeds||[]).includes(i.value));
    renderTripPlan(plan);window.scrollTo({top:$('#travel').offsetTop,behavior:'smooth'});
  }

  function deleteTrip(id){
    Bridge()?.updateState?.(state=>{state.trips=(state.trips||[]).filter(item=>item.id!==id);});
    Bridge()?.saveEvidence?.('trip_plan_deleted',{id});
    setTimeout(()=>{renderSavedTrips();renderTripPlan(getState().trips?.[0]);},0);
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
    const buttons=[$('#globalEmergencyButton'),$('#emergencyPageHoldButton')].filter(Boolean);
    buttons.forEach(button=>{
      button.addEventListener('pointerdown',()=>{emergencyPressStarted=Date.now();});
      button.addEventListener('click',event=>{
        const duration=Date.now()-emergencyPressStarted;
        if(duration<2800){event.preventDefault();openServiceChooser();}
      });
    });
  }

  function setup(){
    // Park search capture handlers override the older generic filtering handler.
    $('#parkFilterForm')?.addEventListener('submit',event=>{event.preventDefault();event.stopImmediatePropagation();renderParkSearch({pushHistory:true});},true);
    $('#useParkLocation')?.addEventListener('click',useParkLocation);
    $('#clearParkSearch')?.addEventListener('click',clearParkSearch);
    $('#undoParkSearch')?.addEventListener('click',undoParkSearch);

    $('#tripForm')?.addEventListener('submit',event=>{event.preventDefault();event.stopImmediatePropagation();const plan=tripValues(event.currentTarget);if(!plan.from||!plan.to)return;saveTrip(plan);},true);
    $('#clearTripPlan')?.addEventListener('click',()=>{$('#tripForm').reset();renderTripPlan(null);});
    $('#travelVetLocation')?.addEventListener('input',updateTravelLinks);
    $('#stayLocation')?.addEventListener('input',updateTravelLinks);

    $('#incidentForm')?.addEventListener('submit',event=>{event.preventDefault();event.stopImmediatePropagation();const record=incidentFromForm(event.currentTarget);saveIncident(record);event.currentTarget.reset();setTimeout(()=>Bridge()?.renderAll?.(),0);setTimeout(renderIncidentRegister,10);},true);
    $('#exportIncidentRegister')?.addEventListener('click',exportIncidents);
    $('#printIncidentRegister')?.addEventListener('click',()=>window.print());

    $('#showServiceChooser')?.addEventListener('click',openServiceChooser);
    $$('[data-open-emergency-services]').forEach(button=>button.addEventListener('click',openServiceChooser));
    $('#serviceLocation')?.addEventListener('input',updateServiceLinks);
    setupEmergencyButton();
    updateServiceLinks();
    updateTravelLinks();

    document.addEventListener('click',event=>{
      const select=event.target.closest('[data-repair-select-park]');if(select){selectPark(select.dataset.repairSelectPark);return;}
      const load=event.target.closest('[data-load-trip]');if(load){loadTrip(load.dataset.loadTrip);return;}
      const remove=event.target.closest('[data-delete-trip]');if(remove){deleteTrip(remove.dataset.deleteTrip);return;}
      const parksNav=event.target.closest('[data-go="park-search"]');if(parksNav)setTimeout(()=>{if(!String($('#parkFilterForm')?.elements.query?.value||'').trim())resetParkResults();else renderParkSearch();},0);
      const travelNav=event.target.closest('[data-go="travel"]');if(travelNav)setTimeout(()=>{renderSavedTrips();renderTripPlan(getState().trips?.[0]);},0);
      const incidentNav=event.target.closest('[data-go="incident"]');if(incidentNav)setTimeout(renderIncidentRegister,0);
    });

    renderSavedTrips();
    renderIncidentRegister();
    resetParkResults();
  }

  document.addEventListener('DOMContentLoaded',setup);
})();
