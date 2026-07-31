(() => {
  'use strict';

  const VERSION = '2026.07.31.40';
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


  const routePlaces = [
    {name:'Gold Coast QLD',terms:['gold coast','labrador','southport'],lat:-28.0167,lon:153.4000,tags:['coastal','fastest','scenic']},
    {name:'Brisbane QLD',terms:['brisbane'],lat:-27.4698,lon:153.0251,tags:['coastal','fastest']},
    {name:'Toowoomba QLD',terms:['toowoomba'],lat:-27.5598,lon:151.9507,tags:['inland','scenic']},
    {name:'Goondiwindi QLD',terms:['goondiwindi'],lat:-28.5472,lon:150.3070,tags:['inland']},
    {name:'Coffs Harbour NSW',terms:['coffs harbour','coffs'],lat:-30.2963,lon:153.1135,tags:['coastal','scenic']},
    {name:'Port Macquarie NSW',terms:['port macquarie'],lat:-31.4333,lon:152.9000,tags:['coastal','scenic']},
    {name:'Newcastle NSW',terms:['newcastle'],lat:-32.9283,lon:151.7817,tags:['coastal','fastest']},
    {name:'Sydney NSW',terms:['sydney'],lat:-33.8688,lon:151.2093,tags:['coastal','fastest']},
    {name:'Batemans Bay NSW',terms:['batemans bay'],lat:-35.7082,lon:150.1742,tags:['coastal','scenic']},
    {name:'Eden NSW',terms:['eden'],lat:-37.0631,lon:149.9039,tags:['coastal','scenic']},
    {name:'Tamworth NSW',terms:['tamworth'],lat:-31.0927,lon:150.9320,tags:['inland']},
    {name:'Dubbo NSW',terms:['dubbo'],lat:-32.2569,lon:148.6011,tags:['inland','scenic']},
    {name:'Canberra ACT',terms:['canberra','belconnen'],lat:-35.2809,lon:149.1300,tags:['inland','fastest','scenic']},
    {name:'Albury NSW',terms:['albury'],lat:-36.0737,lon:146.9135,tags:['inland','fastest']},
    {name:'Melbourne VIC',terms:['melbourne'],lat:-37.8136,lon:144.9631,tags:['coastal','inland','fastest']},
    {name:'Geelong VIC',terms:['geelong'],lat:-38.1499,lon:144.3617,tags:['coastal','fastest']},
    {name:'Devonport TAS',terms:['devonport'],lat:-41.1806,lon:146.3464,tags:['coastal','fastest']},
    {name:'Launceston TAS',terms:['launceston'],lat:-41.4332,lon:147.1441,tags:['inland','fastest','scenic']},
    {name:'Hobart TAS',terms:['hobart'],lat:-42.8821,lon:147.3272,tags:['coastal','inland','fastest','scenic']},
    {name:'Adelaide SA',terms:['adelaide'],lat:-34.9285,lon:138.6007,tags:['coastal','fastest']},
    {name:'Mount Gambier SA',terms:['mount gambier'],lat:-37.8284,lon:140.7804,tags:['coastal','scenic']},
    {name:'Ballarat VIC',terms:['ballarat'],lat:-37.5622,lon:143.8503,tags:['inland','scenic']},
    {name:'Perth WA',terms:['perth'],lat:-31.9523,lon:115.8613,tags:['coastal','fastest']},
    {name:'Albany WA',terms:['albany'],lat:-35.0269,lon:117.8837,tags:['coastal','scenic']},
    {name:'Darwin NT',terms:['darwin'],lat:-12.4634,lon:130.8456,tags:['inland','fastest']},
    {name:'Alice Springs NT',terms:['alice springs'],lat:-23.6980,lon:133.8807,tags:['inland','scenic']}
  ];

  const qldTasPresets = {
    coastal:['Coffs Harbour NSW','Port Macquarie NSW','Newcastle NSW','Sydney NSW','Batemans Bay NSW','Eden NSW','Melbourne VIC','Geelong VIC','Devonport TAS','Hobart TAS'],
    inland:['Toowoomba QLD','Goondiwindi QLD','Tamworth NSW','Dubbo NSW','Canberra ACT','Albury NSW','Melbourne VIC','Geelong VIC','Devonport TAS','Launceston TAS','Hobart TAS'],
    fastest:['Coffs Harbour NSW','Port Macquarie NSW','Newcastle NSW','Sydney NSW','Canberra ACT','Albury NSW','Melbourne VIC','Geelong VIC','Devonport TAS','Hobart TAS'],
    scenic:['Coffs Harbour NSW','Port Macquarie NSW','Batemans Bay NSW','Eden NSW','Melbourne VIC','Geelong VIC','Devonport TAS','Launceston TAS','Hobart TAS']
  };

  let parkSearchHistory = [];
  let currentSearchLocation = null;

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
      routeStyle:String(form.elements.routeStyle.value||'fastest'),
      stopCount:Math.max(1,Math.min(20,Number(form.elements.stopCount.value)||1)),
      breakHours:Number(form.elements.breakHours.value)||2,
      dogId:String(form.elements.dog.value||''),
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

  function routeStyleLabel(value){return ({coastal:'Coastal route',inland:'Inland route',fastest:'Fastest practical route',scenic:'Scenic route'}[value]||'Selected route');}

  function mapsSearchUrl(terms,location){
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${terms} ${location}`)}`;
  }

  function webSearchUrl(terms){
    return `https://www.google.com/search?q=${encodeURIComponent(terms)}`;
  }

  function placeFor(query){
    const lower=String(query||'').toLowerCase();
    return routePlaces.find(place=>place.terms.some(term=>lower.includes(term)))||null;
  }

  function evenlySelect(items,count){
    if(count<=0)return [];
    if(items.length<=count)return [...items];
    return Array.from({length:count},(_,index)=>items[Math.round(index*(items.length-1)/Math.max(1,count-1))]);
  }

  function routeStopNames(plan){
    const fromLower=String(plan.from||'').toLowerCase(),toLower=String(plan.to||'').toLowerCase();
    const qldToTas=(/(qld|queensland|gold coast|brisbane|labrador|southport)/.test(fromLower)&&/(tas|tasmania|hobart|devonport|launceston)/.test(toLower));
    const tasToQld=(/(tas|tasmania|hobart|devonport|launceston)/.test(fromLower)&&/(qld|queensland|gold coast|brisbane|labrador|southport)/.test(toLower));
    if(qldToTas||tasToQld){
      const preset=[...(qldTasPresets[plan.routeStyle]||qldTasPresets.fastest)];
      if(tasToQld)preset.reverse();
      return evenlySelect(preset.filter(name=>!name.toLowerCase().includes(String(plan.from).toLowerCase())&&!name.toLowerCase().includes(String(plan.to).toLowerCase())),plan.stopCount);
    }
    const start=placeFor(plan.from),end=placeFor(plan.to);
    if(start&&end){
      const dx=end.lon-start.lon,dy=end.lat-start.lat,lengthSq=dx*dx+dy*dy||1;
      const style=plan.routeStyle||'fastest';
      const candidates=routePlaces.map(place=>{
        const px=place.lon-start.lon,py=place.lat-start.lat;
        const t=(px*dx+py*dy)/lengthSq;
        const projectedLon=start.lon+t*dx,projectedLat=start.lat+t*dy;
        const offset=Math.hypot(place.lon-projectedLon,place.lat-projectedLat);
        return {...place,t,offset};
      }).filter(place=>place.name!==start.name&&place.name!==end.name&&place.t>0.03&&place.t<0.97&&place.offset<5.5&&(place.tags.includes(style)||style==='scenic'))
        .sort((a,b)=>a.t-b.t);
      const selected=evenlySelect(candidates,plan.stopCount).map(place=>place.name);
      if(selected.length)return selected;
    }
    return Array.from({length:plan.stopCount},(_,index)=>`${plan.to} route area ${index+1}`);
  }

  function tripRouteUrl(plan,stops=[]){
    const base=`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(plan.from)}&destination=${encodeURIComponent(plan.to)}&travelmode=driving`;
    return stops.length?`${base}&waypoints=${encodeURIComponent(stops.join('|'))}`:base;
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
      const isDestination=index===stops.length-1&&String(stop).toLowerCase()===String(plan.to).toLowerCase();
      const offers=[
        offerCard('Closest suitable dog park',`${isDestination?'Destination':'Route stop '+(index+1)}. Prioritise fencing, water, shade and the selected safety needs.`,mapsSearchUrl(`${dogFriendly}dog park fenced water shade ${safety}`,stop),'park'),
        offerCard(`Café meal target up to A$${plan.cafeMealMax}`,`Dog-friendly café choices shaped to the user’s meal limit. Confirm the current menu price and outdoor dog policy.`,mapsSearchUrl(`${dogFriendly}cafe meals under $${plan.cafeMealMax}`,stop),'food'),
        offerCard(`Pub or restaurant meal target up to A$${plan.pubMealMax}`,`Dog-friendly meal choices within the selected target. Confirm the final price, service area and dog access.`,mapsSearchUrl(`${dogFriendly}pub restaurant meals under $${plan.pubMealMax}`,stop),'food')
      ];
      stays.forEach(type=>offers.push(offerCard(`${type} · A$${plan.accommodationMin}–A$${plan.accommodationMax} per night`,`Search target only. Confirm the total price, pet fee, bond, fencing, security, dog size rules and whether dogs may be left unattended.`,webSearchUrl(`${type} ${stop} under $${plan.accommodationMax} dog friendly`),'stay')));
      offers.push(offerCard('Emergency veterinarian backup','Phone first and confirm current after-hours availability before relying on the listing.',mapsSearchUrl('24 hour emergency veterinarian open now',stop),'service'));
      return `<section class="route-stop-offers"><div class="route-stop-heading"><span>${isDestination?'✓':index+1}</span><div><h3>${safe(stop)}${isDestination?' · destination':''}</h3><p>Choose from these route-based options. GENEVIEVE does not auto-book or guarantee price, access or availability.</p></div></div><div class="route-offer-grid">${offers.join('')}</div></section>`;
    }).join('');
  }

  function renderTripPlan(plan){
    const el=$('#tripResult');if(!el)return;
    if(!plan){el.innerHTML='<div class="empty">Enter a start and destination to build the trip.</div>';renderRouteOffers(null,[]);return;}
    const state=getState();
    const dog=state.dogs.find(item=>item.id===plan.dogId);
    const guide=dog?Logic.dogProfileGuide(dog):null;
    const stops=routeStopNames(plan);
    const route=tripRouteUrl(plan,stops);
    const stopCards=stops.map((stop,index)=>`<article class="trip-stop-card"><span>${index+1}</span><div><b>${safe(stop)}</b><p>Dog break, water, toileting and a calm reassessment. Aim for no more than ${safe(plan.breakHours)} hours between breaks, adjusted for weather, traffic, age and health.</p></div></article>`).join('');
    const wanted=[...(plan.needs||[]),...(plan.stayNeeds||[]),...(plan.safetyNeeds||[])];
    const friendlyFilter=plan.dogFriendlyOnly!==false;
    const days=Math.max(1,Math.ceil((plan.stopCount+1)/2));
    const nights=Math.max(1,days-1);
    const planningMaximum=nights*plan.accommodationMax+days*(plan.cafeMealMax+plan.pubMealMax);
    const totalCheck=plan.totalBudget>0?(planningMaximum<=plan.totalBudget?'Within the selected total planning limit':'Above the selected total planning limit — reduce nights or category limits'):'No total trip cap entered';
    el.innerHTML=`<div class="trip-plan-summary"><div class="stat"><b>${safe(plan.from)} → ${safe(plan.to)}</b>${safe(routeStyleLabel(plan.routeStyle))} · ${plan.stopCount} planned stops · dog-friendly-only search ${friendlyFilter?'on':'off'}</div>${guide?`<div class="answer ${guide.level}"><b>${safe(dog.name)} profile guide ${guide.score}/10</b><br>${safe(guide.action)}</div>`:''}<div class="budget-summary"><div class="stat"><b>A$${plan.cafeMealMax}</b>Café meal maximum</div><div class="stat"><b>A$${plan.pubMealMax}</b>Pub/restaurant meal maximum</div><div class="stat"><b>A$${plan.accommodationMin}–A$${plan.accommodationMax}</b>Accommodation per night</div><div class="stat"><b>A$${plan.dailyBudget}</b>Maximum daily spend</div></div><div class="answer ${plan.totalBudget>0&&planningMaximum>plan.totalBudget?'amber':'green'}"><b>${safe(totalCheck)}</b><br>Planning envelope from selected maxima: up to A$${planningMaximum} across approximately ${days} day${days===1?'':'s'} and ${nights} night${nights===1?'':'s'}. This is not a quote.</div><div class="chips">${wanted.length?wanted.map(item=>`<span class="chip">${safe(item)}</span>`).join(''):'<span class="chip">Core park, food, stay and vet offers included</span>'}</div>${plan.notes?`<p><b>Extra needs:</b> ${safe(plan.notes)}</p>`:''}</div><h3>Suggested route stops</h3><div class="trip-stop-list">${stopCards}</div><div class="trip-search-links"><a class="button-link" href="${route}" target="_blank" rel="noopener">Open suggested route in Maps</a><a class="button-link secondary-link" href="${mapsSearchUrl('dog friendly parks and rest areas',`${plan.from} to ${plan.to}`)}" target="_blank" rel="noopener">More dog exercise stops</a><a class="button-link secondary-link" href="${mapsSearchUrl('pet friendly accommodation caravan parks hotels',`${plan.from} to ${plan.to}`)}" target="_blank" rel="noopener">More stays</a></div><div class="answer yellow"><b>Verification gate.</b><br>Every result is a choice guide. Confirm current price, availability, pet rules, route conditions, ferry or transport requirements, fencing, security, lighting, cameras, staff coverage and emergency access directly.</div>`;
    renderRouteOffers(plan,[...stops,plan.to]);
    if($('#travelVetLocation'))$('#travelVetLocation').value=plan.to;
    if($('#stayLocation'))$('#stayLocation').value=plan.to;
    updateTravelLinks();
  }

  function renderSavedTrips(){
    const el=$('#savedTripPlans');if(!el)return;
    const trips=getState().trips||[];
    el.innerHTML=trips.length?trips.map(plan=>`<article class="record-card green"><b>${safe(plan.from)} → ${safe(plan.to)}</b><p>${safe(routeStyleLabel(plan.routeStyle))} · ${Number(plan.stopCount)||0} stops · accommodation to A$${Number(plan.accommodationMax)||180}/night · ${new Date(plan.time||Date.now()).toLocaleString('en-AU')}</p><div class="button-row compact"><button type="button" data-load-trip="${safe(plan.id)}">Open plan</button><button type="button" class="danger" data-delete-trip="${safe(plan.id)}">Delete</button></div></article>`).join(''):'<div class="empty">No saved trip plans.</div>';
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
    form.elements.from.value=plan.from||'';form.elements.to.value=plan.to||'';form.elements.routeStyle.value=plan.routeStyle||'fastest';form.elements.stopCount.value=plan.stopCount||4;form.elements.breakHours.value=plan.breakHours||2;form.elements.dog.value=plan.dogId||form.elements.dog.value;form.elements.dogFriendlyOnly.checked=plan.dogFriendlyOnly!==false;form.elements.cafeMealMax.value=plan.cafeMealMax??20;form.elements.pubMealMax.value=plan.pubMealMax??60;form.elements.accommodationMin.value=plan.accommodationMin??0;form.elements.accommodationMax.value=plan.accommodationMax??180;form.elements.dailyBudget.value=plan.dailyBudget??300;form.elements.totalBudget.value=plan.totalBudget||'';form.elements.notes.value=plan.notes||'';
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

  function syncLegalLandingNotice(){
    const notice=$('#legalFirstUseNotice');if(!notice)return;
    const acceptance=getState().legalAcceptance||{};
    const legalVersion=window.GENEVIEVE_CONFIG?.legalVersion||'2026-07-24';
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

    $('#tripForm')?.addEventListener('submit',event=>{event.preventDefault();event.stopImmediatePropagation();const plan=tripValues(event.currentTarget);if(!plan.from||!plan.to)return;saveTrip(plan);},true);
    $('#clearTripPlan')?.addEventListener('click',()=>{$('#tripForm').reset();renderTripPlan(null);});
    $('#travelVetLocation')?.addEventListener('input',updateTravelLinks);
    $('#stayLocation')?.addEventListener('input',updateTravelLinks);
    $$('[data-budget-preset]').forEach(button=>button.addEventListener('click',()=>applyBudgetPreset(button.dataset.budgetPreset)));

    $('#incidentForm')?.addEventListener('submit',event=>{event.preventDefault();event.stopImmediatePropagation();const record=incidentFromForm(event.currentTarget);saveIncident(record);event.currentTarget.reset();setTimeout(()=>Bridge()?.renderAll?.(),0);setTimeout(renderIncidentRegister,10);},true);
    $('#exportIncidentRegister')?.addEventListener('click',exportIncidents);
    $('#printIncidentRegister')?.addEventListener('click',()=>window.print());

    $$('[data-open-emergency-services]').forEach(button=>button.addEventListener('click',openServiceChooser));
    $('#serviceLocation')?.addEventListener('input',updateServiceLinks);
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
