(() => {
  'use strict';

  const CFG = window.GENEVIEVE_CONFIG || {};
  const Logic = window.GenevieveLogic;
  const KEY = 'genevieve_dogpark_full_restore_state_v3';
  const VERSION = '2026.07.14.3';
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const now = () => new Date().toISOString();
  const uid = prefix => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const safe = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const fmtDate = value => value ? new Intl.DateTimeFormat('en-AU',{dateStyle:'medium'}).format(new Date(value)) : 'Not entered';
  const fmtTime = value => value ? new Intl.DateTimeFormat('en-AU',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value)) : '';

  const parkNeeds = ['Accessibility','Beach','Café nearby','Caravan parking','Double gate','Fenced','Lighting','Quiet','Shade','Toilets','Water bowl'];
  const tripNeedOptions = ['Caravan park','Dog café','Dog beach','Emergency vet','Fuel','Hotel','Quiet park','Shade','Toilets','Water'];
  const etiquetteSignals = [
    ['relaxed','Relaxed body'],['playBow','Play bow'],['sniffBreaks','Takes sniff breaks'],['respondsRecall','Responds to recall'],
    ['stiff','Stiff body'],['tucked','Tail tucked / shrinking'],['avoidance','Avoids contact'],['overAroused','Cannot settle'],
    ['obsessiveChasing','Obsessive chasing'],['pinning','Pinning another dog'],['guarding','Resource guarding'],['snapping','Snapping or attempted bite']
  ];

  const parks = [
    {id:'labrador-broadwater',name:'Labrador Broadwater Dog Exercise Area',suburb:'Labrador QLD',query:'Labrador Broadwater dog off leash area',capacity:28,size:'Large',features:['Accessibility','Beach','Café nearby','Caravan parking','Double gate','Lighting','Shade','Toilets','Water bowl'],quiet:false,beachType:'off-leash',warning:'Sample planning record. Confirm current signs, boundaries, tide, hours and council information before relying on it.'},
    {id:'southport-fenced',name:'Southport Fenced Dog Exercise Area',suburb:'Southport QLD',query:'Southport fenced dog park',capacity:10,size:'Small',features:['Accessibility','Double gate','Fenced','Quiet','Shade','Water bowl'],quiet:true,beachType:'',warning:'Sample planning record. Confirm the exact facility and current council rules.'},
    {id:'robina-enclosed',name:'Robina Enclosed Dog Park',suburb:'Robina QLD',query:'Robina dog park',capacity:18,size:'Medium',features:['Accessibility','Double gate','Fenced','Lighting','Shade','Water bowl'],quiet:false,beachType:'',warning:'Sample planning record. Verify maintenance, water and signed rules.'},
    {id:'palm-beach',name:'Palm Beach Dog Exercise Beach Area',suburb:'Palm Beach QLD',query:'Palm Beach dog off leash beach Gold Coast',capacity:45,size:'Large beach',features:['Beach','Café nearby','Caravan parking','Toilets'],quiet:false,beachType:'time-restricted',warning:'Sample beach record. Verify off-leash boundaries, hours, tide, surf, heat and council requirements.'},
    {id:'burleigh-beach',name:'Burleigh Area Dog Beach Search',suburb:'Burleigh Heads QLD',query:'dog beach Burleigh Heads',capacity:35,size:'Beach',features:['Beach','Café nearby','Shade','Toilets'],quiet:false,beachType:'on-leash',warning:'Search helper only. Confirm whether dogs are permitted, the leash requirement and signed boundaries.'}
  ];

  const defaultState = {
    version: VERSION,
    selectedParkId: 'labrador-broadwater',
    currentRole: 'owner',
    quickStatus: {},
    dogs: [
      {id:'mr-gruff',name:'Mr Gruff',dob:'2021-08-08',breed:'Companion dog',lifeStage:'adult',publicNote:'Ask owner before approach',notes:'Playful. Calm introductions and current observation remain important.',sociability:8,reactivity:3,energy:7,playIntensity:7,tolerance:7,resourceSharing:7,vulnerability:2,microchip:'',weight:'',medical:'',vet:'',emergencyContact:'',vaccinationStatus:'public-cleared',registrationExpiry:'',vaccinationDue:'',fleaTickDue:'',medicationDue:''},
      {id:'luna-demo',name:'Luna (demo)',dob:'2022-04-18',breed:'Demonstration profile',lifeStage:'adult',publicNote:'Gentle play; avoid rough greetings',notes:'Calm approach and sniff breaks.',sociability:8,reactivity:2,energy:6,playIntensity:5,tolerance:8,resourceSharing:7,vulnerability:2,vaccinationStatus:'public-cleared'},
      {id:'bear-demo',name:'Bear (demo)',dob:'2021-01-05',breed:'Demonstration profile',lifeStage:'adult',publicNote:'In training; needs space at gates',notes:'Do not rush at gate.',sociability:5,reactivity:6,energy:8,playIntensity:8,tolerance:4,resourceSharing:5,vulnerability:2,vaccinationStatus:'public-cleared'},
      {id:'rosie-demo',name:'Rosie (demo)',dob:'2015-07-10',breed:'Demonstration senior profile',lifeStage:'senior',publicNote:'Speak before touch',notes:'Vision impairment; calm voice and slower approach.',sociability:7,reactivity:3,energy:3,playIntensity:2,tolerance:8,resourceSharing:7,vulnerability:7,vaccinationStatus:'public-cleared'}
    ],
    departurePlans: [], arrivalChecks: [], checkins: [], supervisionReports: [], affinities: [], predictions: [], outcomes: [], observations: [], heatChecks: [], hazards: [], lostFound: [], incidents: [], maintenance: [], notices: [], trips: [], evidence: [],
    privacy: {discoverable:true,livePresence:true,affinityAlerts:true,recommendations:true,learningParticipation:true,preciseLocation:false,showMedicalToResponder:false,incognitoDefault:false},
    notifications: {bestMate:true,heat:true,hazards:true,documents:true,emergency:true,companion:false,quietStart:'20:00',quietEnd:'07:00',locationDetail:'park'},
    accessibility: {reducedMotion:false,largeText:false,highContrast:false},
    aloneTimerEnd: null
  };

  function deepMerge(base, saved) {
    if (!saved || typeof saved !== 'object') return structuredClone(base);
    const result = structuredClone(base);
    Object.keys(saved).forEach(key => {
      if (saved[key] && typeof saved[key] === 'object' && !Array.isArray(saved[key]) && result[key] && typeof result[key] === 'object' && !Array.isArray(result[key])) result[key] = {...result[key], ...saved[key]};
      else result[key] = saved[key];
    });
    result.version = VERSION;
    return result;
  }

  function loadState() {
    try { return deepMerge(defaultState, JSON.parse(localStorage.getItem(KEY) || 'null')); }
    catch { return structuredClone(defaultState); }
  }
  let state = loadState();
  function saveState() { state.version = VERSION; localStorage.setItem(KEY, JSON.stringify(state)); renderEvidenceCount(); }
  function evidence(type, payload={}) { state.evidence.unshift({id:uid('ev'),type,payload,appVersion:VERSION,time:now()}); state.evidence=state.evidence.slice(0,1500); saveState(); }
  function download(name, text, type='application/json') { const blob=new Blob([text],{type}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1500); }
  function dogById(id){ return state.dogs.find(d=>d.id===id); }
  function parkById(id){ return parks.find(p=>p.id===id) || parks[0]; }
  function selectedPark(){ return parkById(state.selectedParkId); }
  function currentCheckins(parkId=state.selectedParkId){ return state.checkins.filter(c=>c.parkId===parkId); }
  function channel(){ return new URLSearchParams(location.search).get('channel') || CFG.defaultChannel || 'web'; }
  function directionsUrl(park){ return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(park.query || `${park.name} ${park.suburb}`)}`; }
  function riskHtml(result, title='Risk result') {
    if(!result) return '<div class="answer yellow"><b>No result.</b></div>';
    return `<div class="answer ${result.level}"><b>${safe(result.score ?? result.riskScore)}% — ${safe(result.label)}</b><br>${safe(result.action || '')}</div><div class="risk-meter"><span class="risk-marker" style="left:${Math.max(0,Math.min(100,result.score ?? result.riskScore))}%"></span></div>${result.reasons?`<details><summary>Why this result?</summary><ul>${result.reasons.map(r=>`<li>${safe(r)}</li>`).join('')}</ul></details>`:''}${result.advice?`<ul>${result.advice.map(a=>`<li>${safe(a)}</li>`).join('')}</ul>`:''}`;
  }
  function recordCard(title, body, level='green', controls='') { return `<article class="record-card ${level}"><b>${safe(title)}</b><p>${safe(body)}</p>${controls}</article>`; }

  const groupForScreen = id => document.getElementById(id)?.dataset.group || 'more';
  function applyRoleVisibility(){
    const role=state.currentRole;
    $$('[data-role-button]').forEach(el=>{el.hidden=!el.dataset.roleButton.split(',').includes(role);});
    const select=$('#roleSelect'); if(select) select.value=role;
  }
  function setScreen(id, pushHash=true) {
    const target=document.getElementById(id); if(!target) return;
    if(target.dataset.role && !target.dataset.role.split(',').includes(state.currentRole)) { alert('This screen is available only to the Park Superintendent or System Administrator view.'); id='roles'; }
    $$('.screen').forEach(s=>s.classList.toggle('active',s.id===id));
    const group=groupForScreen(id);
    $$('[data-main]').forEach(b=>b.classList.toggle('active',b.dataset.main===group));
    if(pushHash) history.replaceState(null,'',`#${id}`);
    if(id==='park-details') renderParkDetails();
    if(id==='live-park') renderLivePark();
    if(id==='dog-profile') renderDogProfile(state.selectedDogId || state.dogs[0]?.id);
    if(id==='superintendent') renderSuperintendent();
    window.scrollTo({top:0,behavior:document.body.classList.contains('reduced-motion')?'auto':'smooth'});
  }

  function optionHtml(items, valueKey='id', labelKey='name'){ return items.map(item=>`<option value="${safe(item[valueKey])}">${safe(item[labelKey])}</option>`).join(''); }
  function refillSelect(select, items, preferred){
    if(!select) return; const previous=preferred ?? select.value; select.innerHTML=optionHtml(items); if(items.some(i=>String(i.id)===String(previous))) select.value=previous;
  }
  function refreshSelects(){
    $$('select[name="dog"],select[name="dogA"],select[name="dogB"],select[name="fromDog"],select[name="toDog"],#quickDogSelect,#emergencyDogSelect').forEach((select,index)=>refillSelect(select,state.dogs,index===1?state.dogs[1]?.id:select.value || state.dogs[0]?.id));
    $$('select[name="park"]').forEach(select=>refillSelect(select,parks,select.value || state.selectedParkId));
    if($('#quickDogSelect') && state.dogs[0]) $('#quickDogSelect').value=$('#quickDogSelect').value||state.dogs[0].id;
    const dogA=$('#compatibilityForm select[name="dogA"]'), dogB=$('#compatibilityForm select[name="dogB"]');
    if(dogA&&dogB&&dogA.value===dogB.value&&state.dogs[1]) dogB.value=state.dogs[1].id;
    const from=$('#affinityForm select[name="fromDog"]'), to=$('#affinityForm select[name="toDog"]');
    if(from&&to&&from.value===to.value&&state.dogs[1]) to.value=state.dogs[1].id;
  }

  function renderEvidenceCount(){ const el=$('#evidenceCount'); if(el) el.textContent=`${state.evidence.length} dated evidence events stored on this device.`; }
  function renderAccessibility(){
    document.body.classList.toggle('reduced-motion',state.accessibility.reducedMotion);
    document.body.classList.toggle('large-text',state.accessibility.largeText);
    document.body.classList.toggle('high-contrast',state.accessibility.highContrast);
    if($('#reducedMotion')) $('#reducedMotion').checked=state.accessibility.reducedMotion;
    if($('#largeText')) $('#largeText').checked=state.accessibility.largeText;
    if($('#highContrast')) $('#highContrast').checked=state.accessibility.highContrast;
  }
  function latestRisk(collection, predicate=()=>true){ return collection.find(predicate)?.riskScore; }
  function gateRisk(parkId){ const count=currentCheckins(parkId).length; const capacity=parkById(parkId).capacity; return Logic.round((count/capacity)*70 + (count>=Math.max(4,capacity*.55)?12:0)); }
  function renderToday(){
    const park=selectedPark(),checkins=currentCheckins(),dogId=$('#quickDogSelect')?.value || state.dogs[0]?.id;
    const heat=latestRisk(state.heatChecks,h=>h.parkId===park.id&&(!dogId||h.dogId===dogId));
    const interaction=latestRisk(state.predictions,p=>p.parkId===park.id&&(!dogId||(p.dogAId===dogId||p.dogBId===dogId)));
    const crowd=gateRisk(park.id);
    const overall=Logic.aggregateRisk([heat,interaction,crowd]);
    const answer=$('#todayAnswer'); if(answer){answer.className=`answer ${overall.level}`;answer.innerHTML=`<b>${overall.score}% overall visit risk — ${safe(overall.label)}</b><br>${safe(overall.action)} The highest current component is used so one serious risk is not averaged away.`;}
    const owners=new Set(checkins.map(c=>c.ownerKey||c.sessionOwner||'local-owner')).size;
    const needs=checkins.filter(c=>c.needsSpace||c.status==='needs-space').length;
    const spaces=Math.max(0,park.capacity-checkins.length);
    const snapshot=$('#snapshot'); if(snapshot) snapshot.innerHTML=`<div class="grid two"><div class="stat"><b>${safe(park.name)}</b>${safe(park.suburb)}</div><div class="stat"><b>${checkins.length} dogs · ${owners} owners</b>${spaces} working spaces remaining</div><div class="stat"><b>${crowd}% gate/crowd risk</b>${needs} dog${needs===1?'':'s'} currently need space</div><div class="stat"><b>${heat??'—'}% heat · ${interaction??'—'}% interaction</b>Run checks when conditions change</div></div>`;
    const duty=$('#todayOwnerDuty'); if(duty){ const mine=checkins.filter(c=>c.sessionOwner==='local-owner'); duty.innerHTML=mine.length?mine.map(c=>{const age=Math.max(0,Math.round((Date.now()-new Date(c.lastSupervision||c.time).getTime())/60000));const dog=dogById(c.dogId);return `<div class="stat"><b>${safe(dog?.name||'Dog')}</b>${age} min since supervision confirmation</div>`;}).join(''):'<div class="empty">No local dog is checked in.</div>'; }
    renderEvidenceCount();
  }
  function renderDocumentReminders(){
    const dog=dogById($('#departureForm select[name="dog"]')?.value)||state.dogs[0]; const el=$('#documentReminders'); if(!el||!dog)return;
    const fields=[['Registration',dog.registrationExpiry],['Vaccination',dog.vaccinationDue],['Flea/tick',dog.fleaTickDue],['Medication review',dog.medicationDue]];
    el.innerHTML=fields.map(([name,date])=>{let level='yellow',status='Not entered';if(date){const days=Math.ceil((new Date(date)-new Date())/86400000);if(days<0){level='red';status=`Overdue by ${Math.abs(days)} days`;}else if(days<=30){level='amber';status=`Due in ${days} days`;}else{level='green';status=`Due ${fmtDate(date)}`;}}return recordCard(name,status,level);}).join('');
  }
  function renderDepartureNeeds(){
    const form=$('#departureForm'); if(!form)return; const park=parkById(form.elements.park.value||state.selectedParkId); const dog=dogById(form.elements.dog.value)||state.dogs[0];
    const needs=new Set(['Lead','Waste bags']); if(park.features.includes('Beach'))needs.add('Tide and boundary check'); if(!park.features.includes('Water bowl'))needs.add('Own water'); if(!park.features.includes('Shade'))needs.add('Shade plan'); if((dog?.vulnerability||0)>=6)needs.add('Shorter visit / low stimulation');
    $('#departureNeeds').innerHTML=[...needs].map(n=>`<span class="chip">${safe(n)}</span>`).join('');
  }
  function renderRoute(){
    const park=selectedPark(); const card=$('#routeCard'); if(card) card.innerHTML=`<div class="stat"><b>${safe(park.name)}</b>${safe(park.suburb)} · ${safe(park.size)} · ${park.features.map(safe).join(' · ')}</div><div class="answer ${gateRisk(park.id)>=50?'amber':gateRisk(park.id)>=25?'yellow':'green'}"><b>${gateRisk(park.id)}% gate/crowd risk</b><br>${gateRisk(park.id)>=50?'Wait back from the gate and consider another time.':'Keep the dog on lead from the vehicle and assess the entrance before release.'}</div>`;
    const link=$('#directionsLink'); if(link){link.href=directionsUrl(park);link.setAttribute('aria-label',`Open directions to ${park.name}`);}
  }
  function renderParks(){
    const form=$('#parkFilterForm'); const query=String(form?.elements.query.value||'').toLowerCase(); const selected=$$('#parkNeedControls input:checked').map(i=>i.value);
    const matches=parks.filter(p=>{const hay=`${p.name} ${p.suburb} ${p.features.join(' ')}`.toLowerCase();return(!query||hay.includes(query))&&selected.every(n=>p.features.includes(n));});
    const el=$('#parkList'); if(!el)return; el.innerHTML=matches.length?matches.map(p=>{const count=currentCheckins(p.id).length;const risk=gateRisk(p.id);const band=Logic.riskBand(risk);return `<article class="park-card"><h3>${safe(p.name)}</h3><p>${safe(p.suburb)} · ${safe(p.size)} · ${count}/${p.capacity} dogs</p><div class="chips">${p.features.map(f=>`<span class="chip">${safe(f)}</span>`).join('')}</div><p class="muted">${safe(p.warning)}</p><div class="answer ${band.level}"><b>${risk}% current crowd/gate risk</b></div><div class="button-row compact"><button data-view-park="${p.id}">Park details</button><button data-live-park="${p.id}">Live state</button><button data-route-park="${p.id}" class="secondary">Plan journey</button></div></article>`;}).join(''):'<div class="empty">No park matches all selected needs. Clear one or more filters.</div>';
  }
  function renderParkDetails(){
    const p=selectedPark(); $('#parkDetailsTitle').textContent=p.name; const count=currentCheckins(p.id).length;
    $('#parkDetailsBody').innerHTML=`<section class="grid four"><div class="stat"><b>${safe(p.size)}</b>Park/area type</div><div class="stat"><b>${p.features.includes('Double gate')?'Double gate':'Gate details unverified'}</b>Entry arrangement</div><div class="stat"><b>${p.features.includes('Water bowl')?'Water listed':'Bring water'}</b>Verify on arrival</div><div class="stat"><b>${p.features.includes('Shade')?'Shade listed':'Limited/unverified shade'}</b>Check time of day</div></section><section class="grid two"><article class="card"><h2>Rules at this location</h2><div class="record-card green"><b>Lead before entering and leaving</b><p>Keep the dog on lead from the vehicle to the signed off-leash boundary and place the lead back on before leaving.</p></div><div class="record-card yellow"><b>Immediate owner supervision</b><p>Dog parks are not drop-off care. Remain close enough to see, reach and control the dog.</p></div><div class="record-card yellow"><b>Check signed boundaries and hours</b><p>Official signs and current council information override this planning record.</p></div></article><article class="card"><h2>Current local state</h2><div class="stat"><b>${count}/${p.capacity} dogs</b>${Math.max(0,p.capacity-count)} working spaces remaining</div><p class="muted">${safe(p.warning)}</p><div class="button-row"><button data-go="live-park">Open live state</button><a class="button-link secondary-link" href="${directionsUrl(p)}" target="_blank" rel="noopener">Directions</a></div></article></section>`;
  }
  function renderLivePark(){
    const p=selectedPark(),items=currentCheckins(p.id),owners=new Set(items.map(c=>c.sessionOwner||c.ownerKey||'local-owner')).size,needs=items.filter(c=>c.needsSpace||c.status==='needs-space').length,spaces=Math.max(0,p.capacity-items.length);
    $('#liveParkStats').innerHTML=`<div class="stat"><b>${items.length} dogs</b>${Logic.round(items.length/p.capacity*100)}% of working capacity</div><div class="stat"><b>${owners} owners</b>${items.filter(c=>supervisionAge(c)>10).length} supervision confirmation${items.filter(c=>supervisionAge(c)>10).length===1?'':'s'} due</div><div class="stat"><b>${spaces} spaces</b>Before working capacity</div><div class="stat"><b>${needs} need space</b>Anonymous current-state layer</div>`;
    const counts={};items.forEach(c=>counts[c.status]=(counts[c.status]||0)+1);$('#behaviourMix').innerHTML=Object.entries(counts).length?Object.entries(counts).map(([k,v])=>`<span class="chip">${safe(k)} ${v}</span>`).join(''):'<div class="empty">No dogs checked in locally.</div>';
    const alerts=[];const g=gateRisk(p.id);if(g>=25)alerts.push(riskHtml(Logic.riskBand(g),'Gate'));const hazards=state.hazards.filter(h=>h.parkId===p.id);hazards.slice(0,3).forEach(h=>alerts.push(recordCard(h.type,h.details,Logic.riskBand(h.riskScore).level)));const notices=activeNotices(p.id);notices.forEach(n=>alerts.push(recordCard(n.title,n.details,'yellow')));$('#liveParkAlerts').innerHTML=alerts.join('')||'<div class="answer green"><b>No local alerts recorded.</b><br>Still check the park directly.</div>';
  }
  function renderBeaches(){
    const form=$('#beachFilterForm');const location=String(form?.elements.location.value||'').toLowerCase();const type=form?.elements.type.value||'';const results=parks.filter(p=>p.features.includes('Beach')&&(!location||`${p.name} ${p.suburb}`.toLowerCase().includes(location)||location.includes('gold coast'))&&(!type||p.beachType===type));
    $('#beachResults').innerHTML=results.length?results.map(p=>`<article class="park-card"><h3>${safe(p.name)}</h3><p>${safe(p.suburb)} · ${safe(p.beachType||'rules unverified')}</p><p>${safe(p.warning)}</p><div class="button-row"><button data-view-park="${p.id}">Details</button><a class="button-link secondary-link" href="${directionsUrl(p)}" target="_blank" rel="noopener">Map</a></div></article>`).join(''):'<div class="empty">No sample beach matches. Use the map search and confirm official rules.</div>';
  }

  function renderDogs(){
    const el=$('#dogList'); if(!el)return;
    el.innerHTML=state.dogs.length?state.dogs.map(d=>`<article class="dog-card"><h3>${safe(d.name)}</h3><p>${safe(d.lifeStage||'adult')} · ${safe(d.breed||'')}</p><p>${safe(d.publicNote||'Ask owner before approach')}</p><div class="chips"><span class="chip">Sociability ${Number(d.sociability)||0}/10</span><span class="chip">Reactivity ${Number(d.reactivity)||0}/10</span><span class="chip">Energy ${Number(d.energy)||0}/10</span></div><div class="button-row compact"><button data-profile-dog="${d.id}">Open profile</button><button data-edit-dog="${d.id}" class="secondary">Edit</button>${d.id!=='mr-gruff'?`<button data-delete-dog="${d.id}" class="danger">Delete</button>`:''}</div></article>`).join(''):'<div class="empty">No dog profiles saved.</div>';
  }
  function renderDogProfile(id){
    const dog=dogById(id)||state.dogs[0]; if(!dog)return; state.selectedDogId=dog.id; $('#dogProfileTitle').textContent=`${dog.name}${dog.dob?` · born ${fmtDate(dog.dob)}`:''}`;
    const current=state.checkins.find(c=>c.dogId===dog.id); const dimensions=Logic.dims.map(k=>`<div class="stat"><b>${safe(k.replace(/([A-Z])/g,' $1'))}</b>${Number(dog[k])||0}/10</div>`).join('');
    $('#dogProfileBody').innerHTML=`<section class="grid three"><article class="card"><h2>Public safety view</h2><p><b>${safe(dog.publicNote||'Ask owner before approach')}</b></p><p>${safe(dog.notes||'No public needs recorded.')}</p><div class="chips"><span class="chip">${safe(current?.status||'not checked in')}</span>${current?.needsSpace?'<span class="chip">needs space</span>':''}${current?.onLead?'<span class="chip">on lead</span>':''}${current?.training?'<span class="chip">in training</span>':''}</div></article><article class="card field-panel"><h2>Behavioural profile</h2><div class="grid two">${dimensions}</div></article><article class="card warning-card"><h2>Restricted emergency</h2><p><b>Microchip:</b> ${safe(dog.microchip||'Not entered')}<br><b>Weight:</b> ${safe(dog.weight||'Not entered')}<br><b>Medical:</b> ${safe(dog.medical||'Not entered')}<br><b>Vet:</b> ${safe(dog.vet||'Not entered')}<br><b>Emergency contact:</b> ${safe(dog.emergencyContact||'Not entered')}</p><p class="muted">Visible only to the owner in this web build. Production responder access must be justified and audited.</p></article></section><section class="card"><h2>Owner controls</h2><div class="chips"><span class="chip">Public name</span><span class="chip">Hide exact location</span><span class="chip">Incognito</span><span class="chip">Needs space</span><span class="chip">On lead</span><span class="chip">In training</span><span class="chip">Export history</span></div></section>`;
  }
  function supervisionAge(checkin){ return Math.max(0,Math.round((Date.now()-new Date(checkin.lastSupervision||checkin.time).getTime())/60000)); }
  function renderCheckins(){
    const el=$('#checkinList');if(!el)return;el.innerHTML=state.checkins.length?state.checkins.map(c=>{const d=dogById(c.dogId),p=parkById(c.parkId);return `<article class="record-card ${c.needsSpace||c.status==='reactive'?'amber':'green'}"><b>${safe(d?.name||'Dog')} at ${safe(p.name)}</b><p>${safe(c.status)} · checked in ${fmtTime(c.time)} · supervision confirmed ${supervisionAge(c)} min ago</p><div class="chips">${c.incognito?'<span class="chip">incognito</span>':''}${c.needsSpace?'<span class="chip">needs space</span>':''}${c.onLead?'<span class="chip">on lead</span>':''}${c.training?'<span class="chip">in training</span>':''}</div><div class="button-row compact"><button data-confirm-supervision="${c.id}">Still supervising</button><button data-checkout="${c.id}" class="secondary">Check out</button></div></article>`;}).join(''):'<div class="empty">No dogs checked in on this device.</div>'; renderToday();renderLivePark();renderOwnerDuty();
  }
  function renderOwnerDuty(){
    const list=$('#ownerDutyList');if(list){const mine=state.checkins.filter(c=>c.sessionOwner==='local-owner');list.innerHTML=mine.length?mine.map(c=>{const dog=dogById(c.dogId),age=supervisionAge(c),band=Logic.riskBand(age>=20?80:age>=12?55:age>=8?30:10);return `<article class="record-card ${band.level}"><b>${safe(dog?.name||'Dog')}</b><p>${age} min since confirmation</p><button data-confirm-supervision="${c.id}">I’m still supervising</button></article>`;}).join(''):'<div class="empty">No local dog is checked in.</div>';}
    const reports=$('#unattendedReports');if(reports)reports.innerHTML=state.supervisionReports.length?state.supervisionReports.map(r=>recordCard(`${r.description} · ${parkById(r.parkId).name}`,`${r.ownerLocation}: ${r.concern}`,r.status==='resolved'?'green':'red',r.status==='resolved'?'':`<button data-resolve-unattended="${r.id}">Mark resolved</button>`)).join(''):'<div class="empty">No unattended-dog reports.</div>';
  }
  function renderAffinity(){
    const el=$('#affinityList');if(el)el.innerHTML=state.affinities.length?state.affinities.map(a=>{const from=dogById(a.fromDogId)?.name,to=dogById(a.toDogId)?.name,p=parkById(a.parkId);return `<article class="affinity-card"><b>${safe(from)} → ${safe(to)}</b><p>${safe(a.mode)} · ${safe(a.status)} · ${safe(p.name)}</p>${a.status!=='active'?`<button data-accept-affinity="${a.id}">Record reciprocal consent</button>`:''}<label>Private removal reason <select data-removal-reason="${a.id}"><option value="owner_preference">Owner preference</option><option value="incompatible_play">Incompatible play</option><option value="reactivity">Reactivity</option><option value="resource_guarding">Resource guarding</option><option value="stress">Stress</option></select></label><button data-remove-affinity="${a.id}" class="danger">Remove relationship</button></article>`;}).join(''):'<div class="empty">No best-mate relationships saved.</div>';
  }
  function renderPredictionSelect(){ const select=$('#outcomeForm select[name="prediction"]');if(select)select.innerHTML=state.predictions.slice(0,50).map(p=>`<option value="${p.id}">${safe(dogById(p.dogAId)?.name)} + ${safe(dogById(p.dogBId)?.name)} · ${p.riskScore}%</option>`).join('')||'<option value="">Run a prediction first</option>'; }
  function predictionHtml(p){ const a=dogById(p.dogAId),b=dogById(p.dogBId),band=Logic.riskBand(p.riskScore);return `<article class="prediction-card"><h3>${safe(a?.name||'Dog')} + ${safe(b?.name||'Dog')}</h3>${riskHtml({...band,reasons:p.reasons})}<p class="muted">${safe(parkById(p.parkId).name)} · model ${safe(p.modelVersion)}</p></article>`; }
  function renderHeatHistory(){ const el=$('#heatHistory');if(el)el.innerHTML=state.heatChecks.slice(0,8).map(h=>recordCard(`${dogById(h.dogId)?.name||'Dog'} · ${h.riskScore}%`,`${parkById(h.parkId).name} · ${fmtTime(h.time)}`,Logic.riskBand(h.riskScore).level)).join('')||'<div class="empty">No heat checks saved.</div>'; }
  function renderHazards(){ const el=$('#hazardList');if(el)el.innerHTML=state.hazards.filter(h=>h.parkId===state.selectedParkId).map(h=>recordCard(h.type,`${h.details} · ${fmtTime(h.time)}`,Logic.riskBand(h.riskScore).level)).join('')||'<div class="empty">No local hazard reports for the selected park.</div>'; }
  function renderLostFound(){ const el=$('#lostFoundList');if(el)el.innerHTML=state.lostFound.map(r=>recordCard(`${r.type.toUpperCase()} · ${r.description}`,`${r.location} · ${r.contact||'No public contact note'} · ${fmtTime(r.time)}`,r.urgency==='danger'?'red':r.urgency==='urgent'?'amber':'yellow')).join('')||'<div class="empty">No lost/found records.</div>'; }
  function renderIncidents(){ const el=$('#incidentList');if(el)el.innerHTML=state.incidents.map(r=>recordCard(`${r.type} · ${parkById(r.parkId).name}`,`${r.details} · ${fmtTime(r.time)}`,Logic.riskBand(r.severity).level)).join('')||'<div class="empty">No incident records.</div>'; }
  function activeNotices(parkId){ const t=Date.now();return state.notices.filter(n=>n.parkId===parkId&&(!n.expires||new Date(n.expires).getTime()>t)); }
  function renderNotices(){ const el=$('#noticeList');if(el){const all=state.notices.filter(n=>!n.expires||new Date(n.expires)>new Date());el.innerHTML=all.length?all.map(n=>recordCard(`${n.verified?'Verified':'Local draft'} · ${n.title}`,`${parkById(n.parkId).name}: ${n.details}${n.expires?` · expires ${fmtTime(n.expires)}`:''}`,'yellow')).join(''):'<div class="empty">No active notices.</div>';}}
  function renderMaintenance(){ const el=$('#maintenanceList');if(el)el.innerHTML=state.maintenance.map(m=>recordCard(`${m.facility} · ${parkById(m.parkId).name}`,`${m.task} · ${m.status}`,m.priority,m.status==='closed'?'':`<button data-close-maintenance="${m.id}">Mark complete</button>`)).join('')||'<div class="empty">No maintenance tasks.</div>'; }
  function renderSuperintendent(){
    const openMaintenance=state.maintenance.filter(m=>m.status!=='closed'),active=state.notices.filter(n=>!n.expires||new Date(n.expires)>new Date()),redIncidents=state.incidents.filter(i=>Number(i.severity)>=75),p=selectedPark();
    $('#superStats').innerHTML=`<div class="stat"><b>${openMaintenance.length} open task${openMaintenance.length===1?'':'s'}</b>Maintenance queue</div><div class="stat"><b>${active.length} active notice${active.length===1?'':'s'}</b>Publicly displayed</div><div class="stat"><b>${Logic.round(currentCheckins(p.id).length/p.capacity*100)}% capacity</b>${currentCheckins(p.id).length} dogs at ${safe(p.name)}</div><div class="stat"><b>${redIncidents.length} red incident${redIncidents.length===1?'':'s'}</b>Recorded locally</div>`;
    $('#superTrends').innerHTML=`<div class="chips"><span class="chip">crowding ${gateRisk(p.id)}%</span><span class="chip">needs space ${currentCheckins(p.id).filter(c=>c.needsSpace).length}</span><span class="chip">hazards ${state.hazards.filter(h=>h.parkId===p.id).length}</span><span class="chip">incidents ${state.incidents.filter(i=>i.parkId===p.id).length}</span><span class="chip">alerts acknowledged locally</span></div><p class="muted">No microchip numbers, medical records or owner contact details are shown in this operator view.</p>`;
    renderMaintenance();renderNotices();
  }

  function renderPrivacy(){
    const labels={discoverable:'Allow profile discoverability',livePresence:'Allow live-presence visibility',affinityAlerts:'Allow best-mate proximity alerts',recommendations:'Allow companion recommendations',learningParticipation:'Use outcomes and removal feedback for learning',preciseLocation:'Allow location only when I request current weather',showMedicalToResponder:'Allow authorised emergency responder access when production controls exist',incognitoDefault:'Use incognito by default'};
    const el=$('#privacyControls');if(el)el.innerHTML=Object.entries(labels).map(([k,v])=>`<label class="toggle"><input type="checkbox" name="${k}" ${state.privacy[k]?'checked':''}> ${safe(v)}</label>`).join('');
  }
  function renderNotifications(){
    const labels={bestMate:'Best mate at preferred park',heat:'Heat and weather risk',hazards:'Park closure or hazard',documents:'Registration and vaccination reminders',emergency:'Emergency and lost-dog alerts',companion:'Prospective companion suggestions'};
    const el=$('#notificationControls');if(el)el.innerHTML=Object.entries(labels).map(([k,v])=>`<label class="toggle"><input type="checkbox" name="${k}" ${state.notifications[k]?'checked':''}> ${safe(v)}</label>`).join('');
    const form=$('#notificationForm');if(form){form.elements.quietStart.value=state.notifications.quietStart||'';form.elements.quietEnd.value=state.notifications.quietEnd||'';form.elements.locationDetail.value=state.notifications.locationDetail||'park';}
  }
  function renderPlans(){
    const currentChannel=channel();const message=$('#billingChannelMessage');if(message)message.textContent=currentChannel==='web'?'Web channel: only verified Stripe Payment Links can open.':currentChannel==='apple'?'Apple channel: premium digital subscriptions must use the native Apple purchase bridge.':'Google Play channel: premium digital subscriptions must use the native Google Play billing bridge.';
    const el=$('#planList');if(!el)return;el.innerHTML=(CFG.products||[]).map(p=>`<article class="card"><h2>${safe(p.name)}</h2><p><b>${safe(p.priceLabel)}</b> ${safe(p.periodLabel)}</p><p>${safe(p.audience)}</p><p>${safe(p.trialLabel)}</p><button data-buy="${safe(p.id)}" ${currentChannel==='web'&&!p.stripePaymentLink?'disabled':''}>${currentChannel==='web'?'Subscribe on web':'Subscribe in app'}</button>${currentChannel==='web'&&!p.stripePaymentLink?'<p class="muted">Blocked until the correct verified Stripe link is mapped.</p>':''}</article>`).join('');
  }
  function publicUrls(){ const base=(CFG.publicWebsiteUrl||'').replace(/\/$/,'');return{website:base,privacy:base?`${base}/legal/privacy-policy.html`:'',terms:base?`${base}/legal/terms-of-use.html`:'',support:base?`${base}/legal/support.html`:'',deletion:base?`${base}/legal/account-deletion.html`:'',refund:base?`${base}/legal/refund-cancellation-policy.html`:''}; }
  function renderPublicUrls(){ const urls=publicUrls();const el=$('#publicUrlList');if(el)el.innerHTML=Object.entries(urls).map(([k,v])=>`<div class="stat"><b>${safe(k)}</b>${v?`<code>${safe(v)}</code>`:'BLOCKED — enter publicWebsiteUrl in config.js'}</div>`).join(''); }
  function renderTripResult(plan){
    const el=$('#tripResult');if(!el)return;if(!plan){el.innerHTML='<div class="empty">Create a route plan.</div>';return;}
    const map=`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(plan.from)}&destination=${encodeURIComponent(plan.to)}&travelmode=driving`;
    el.innerHTML=`<div class="stat"><b>${safe(plan.from)} → ${safe(plan.to)}</b>${plan.needs.map(safe).join(' · ')}</div><div class="record-card green"><b>Stop pattern</b><p>Quiet fenced exercise stop with water and shade every 2–3 hours, adjusted for the dog and weather.</p></div><div class="record-card yellow"><b>Stay and emergency backup</b><p>Confirm pet-friendly accommodation, current restrictions and the nearest after-hours veterinarian before departure.</p></div><a class="button-link" href="${map}" target="_blank" rel="noopener">Open route in Maps</a>`;
  }
  function renderAloneTimer(){
    const el=$('#aloneTimerStatus');if(!el)return;if(!state.aloneTimerEnd){el.textContent='No safety timer is running.';return;}const remaining=new Date(state.aloneTimerEnd).getTime()-Date.now();if(remaining<=0){el.textContent='Timer expired. In a production service this would follow the chosen escalation plan.';el.className='answer red';return;}el.className='muted';el.textContent=`Timer running: ${Math.ceil(remaining/60000)} minutes remaining.`;
  }
  function renderLaunchResults(tests){ const el=$('#launchResults');if(el)el.innerHTML=tests.map(t=>`<div class="${t.ok?'launch-pass':t.block?'launch-block':'launch-warn'}"><b>${t.ok?'PASS':t.block?'BLOCKED':'NOT CONNECTED'} — ${safe(t.name)}</b>${t.detail?`<br>${safe(t.detail)}`:''}</div>`).join(''); }
  async function runLaunchCheck(){
    const urls=publicUrls(),currentChannel=channel();const tests=[
      {name:'Public website/domain entered',ok:Boolean(urls.website),block:true,detail:urls.website||'Add publicWebsiteUrl in config.js.'},
      {name:'Public support email entered',ok:Boolean(CFG.publicSupportEmail&&CFG.publicSupportEmail.includes('@')),block:true,detail:CFG.publicSupportEmail||'Add publicSupportEmail in config.js and the legal pages.'},
      {name:'Privacy, support and deletion URLs can be formed',ok:Boolean(urls.privacy&&urls.support&&urls.deletion),block:true},
      {name:'All four subscription products exist in configuration',ok:(CFG.products||[]).length===4,block:true},
      {name:'Web Stripe links mapped',ok:currentChannel!=='web'||(CFG.products||[]).every(p=>p.stripePaymentLink),block:currentChannel==='web',detail:currentChannel==='web'?'Each product needs its verified matching Payment Link.':'Not required in native store channel.'},
      {name:'Supabase public backend configured',ok:Boolean(window.GenevieveBackend?.enabled),warn:true,detail:window.GenevieveBackend?.enabled?'Public URL and anon key present.':'Local-first mode only; no real multi-user accounts or live park data.'},
      {name:'Official logo and approved photos installed',ok:false,warn:true,detail:'The exact locked assets were not available in this workspace; a neutral paw utility icon remains.'},
      {name:'Current app channel',ok:true,detail:currentChannel},
      {name:'Risk engine logic tests included',ok:true,detail:'Run npm-free Node test from tests/test-logic.js or review docs/TEST_REPORT.md.'}
    ];
    if(window.GenevieveBackend?.enabled){const health=await window.GenevieveBackend.health();tests.push({name:'Backend health check',ok:health.ok,block:true,detail:health.message});}
    renderLaunchResults(tests);evidence('launch_check',{channel:currentChannel,tests});
  }
  function renderAll(){
    applyRoleVisibility();renderAccessibility();refreshSelects();renderToday();renderDocumentReminders();renderDepartureNeeds();renderRoute();renderParks();renderParkDetails();renderLivePark();renderBeaches();renderDogs();renderDogProfile(state.selectedDogId||state.dogs[0]?.id);renderCheckins();renderOwnerDuty();renderAffinity();renderPredictionSelect();renderHeatHistory();renderHazards();renderLostFound();renderIncidents();renderNotices();renderSuperintendent();renderPrivacy();renderNotifications();renderPlans();renderPublicUrls();renderTripResult(state.trips[0]);renderAloneTimer();
  }

  function bindGlobalClicks(){
    document.addEventListener('click', event => {
      const go=event.target.closest('[data-go]');if(go){setScreen(go.dataset.go);return;}
      const view=event.target.closest('[data-view-park]');if(view){state.selectedParkId=view.dataset.viewPark;saveState();renderAll();setScreen('park-details');return;}
      const live=event.target.closest('[data-live-park]');if(live){state.selectedParkId=live.dataset.livePark;saveState();renderAll();setScreen('live-park');return;}
      const route=event.target.closest('[data-route-park]');if(route){state.selectedParkId=route.dataset.routePark;saveState();renderAll();setScreen('route-arrival');return;}
      const profile=event.target.closest('[data-profile-dog]');if(profile){state.selectedDogId=profile.dataset.profileDog;saveState();renderDogProfile(state.selectedDogId);setScreen('dog-profile');return;}
      const edit=event.target.closest('[data-edit-dog]');if(edit){const dog=dogById(edit.dataset.editDog),form=$('#dogForm');if(!dog||!form)return;Object.entries(dog).forEach(([k,v])=>{if(form.elements[k])form.elements[k].value=v??'';});$$('#dogForm input[type="range"]').forEach(r=>r.nextElementSibling.textContent=r.value);setScreen('dog-list');form.elements.name.focus();return;}
      const del=event.target.closest('[data-delete-dog]');if(del&&confirm('Delete this dog profile and its local relationships/check-ins?')){const id=del.dataset.deleteDog;state.dogs=state.dogs.filter(d=>d.id!==id);state.checkins=state.checkins.filter(c=>c.dogId!==id);state.affinities=state.affinities.filter(a=>a.fromDogId!==id&&a.toDogId!==id);evidence('dog_deleted',{dogId:id});renderAll();return;}
      const checkout=event.target.closest('[data-checkout]');if(checkout){const c=state.checkins.find(x=>x.id===checkout.dataset.checkout);state.checkins=state.checkins.filter(x=>x.id!==checkout.dataset.checkout);evidence('check_out',{checkin:c});renderAll();return;}
      const confirm=event.target.closest('[data-confirm-supervision]');if(confirm){const c=state.checkins.find(x=>x.id===confirm.dataset.confirmSupervision);if(c){c.lastSupervision=now();evidence('supervision_confirmed',{checkinId:c.id,dogId:c.dogId});renderAll();}return;}
      const resolve=event.target.closest('[data-resolve-unattended]');if(resolve){const r=state.supervisionReports.find(x=>x.id===resolve.dataset.resolveUnattended);if(r){r.status='resolved';r.resolvedAt=now();evidence('unattended_report_resolved',{id:r.id});renderOwnerDuty();}return;}
      const accept=event.target.closest('[data-accept-affinity]');if(accept){const a=state.affinities.find(x=>x.id===accept.dataset.acceptAffinity);if(a){a.status='active';a.consentedAt=now();evidence('affinity_reciprocal_consent',{id:a.id});renderAffinity();}return;}
      const remove=event.target.closest('[data-remove-affinity]');if(remove){const id=remove.dataset.removeAffinity,reason=document.querySelector(`[data-removal-reason="${CSS.escape(id)}"]`)?.value||'owner_preference',a=state.affinities.find(x=>x.id===id);state.affinities=state.affinities.filter(x=>x.id!==id);evidence('affinity_removed',{affinity:a,reason,private:true});renderAffinity();return;}
      const close=event.target.closest('[data-close-maintenance]');if(close){const m=state.maintenance.find(x=>x.id===close.dataset.closeMaintenance);if(m){m.status='closed';m.closedAt=now();evidence('maintenance_closed',{id:m.id});renderSuperintendent();}return;}
      const buy=event.target.closest('[data-buy]');if(buy){const product=(CFG.products||[]).find(p=>p.id===buy.dataset.buy),ch=channel();if(ch==='web'){if(product?.stripePaymentLink)location.href=product.stripePaymentLink;else{$('#billingResult').className='answer red';$('#billingResult').innerHTML='<b>Payment link not configured.</b><br>Map and verify the exact product in config.js first.';}}else{const ok=window.GenevieveNativeBilling?.purchase(product?.id);$('#billingResult').className=`answer ${ok?'green':'red'}`;$('#billingResult').innerHTML=ok?'<b>Native store purchase requested.</b>':'<b>Native store billing is not connected.</b><br>The app correctly refused to open a web checkout inside the store channel.';}return;}
      const quick=event.target.closest('[data-quick-status]');if(quick){const dogId=$('#quickDogSelect').value;state.quickStatus[dogId]={status:quick.dataset.quickStatus,time:now()};const check=state.checkins.find(c=>c.dogId===dogId&&c.sessionOwner==='local-owner');if(check){check.status=quick.dataset.quickStatus;check.needsSpace=quick.dataset.quickStatus==='needs-space';check.training=quick.dataset.quickStatus==='training';}evidence('quick_status',{dogId,status:quick.dataset.quickStatus});$('#quickStatusMessage').textContent=`Saved ${quick.dataset.quickStatus} for ${dogById(dogId)?.name}.`;renderAll();return;}
      const breakAction=event.target.closest('[data-break-action]');if(breakAction){const action=breakAction.dataset.breakAction;const result=$('#etiquetteResult');result.className=action==='Leave park'?'answer red':'answer yellow';result.innerHTML=`<b>Action recorded: ${safe(action)}</b><br>Keep the dog under control and reassess before resuming interaction.`;evidence('etiquette_break_action',{action});return;}
    });
  }

  function bindForms(){
    $('#roleSelect').addEventListener('change',e=>{state.currentRole=e.target.value;evidence('role_view_changed',{role:state.currentRole});applyRoleVisibility();setScreen('more');});
    $('#quickDogSelect').addEventListener('change',renderToday);
    $('#todayStillSupervising').addEventListener('click',()=>{state.checkins.filter(c=>c.sessionOwner==='local-owner').forEach(c=>c.lastSupervision=now());evidence('all_supervision_confirmed');renderAll();});
    $('#confirmAllSupervision').addEventListener('click',()=>{state.checkins.filter(c=>c.sessionOwner==='local-owner').forEach(c=>c.lastSupervision=now());evidence('all_supervision_confirmed');renderAll();});

    $('#departureForm').addEventListener('change',()=>{renderDepartureNeeds();renderDocumentReminders();});
    $('#departureForm').addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.currentTarget),input={dogId:f.get('dog'),parkId:f.get('park'),temperament:f.get('temperament'),lead:f.has('lead'),bags:f.has('bags'),water:f.has('water'),idTag:f.has('idTag'),vaccination:f.has('vaccination')},result=Logic.departureRisk(input);state.selectedParkId=input.parkId;const plan={id:uid('plan'),...input,riskScore:result.riskScore,time:now()};state.departurePlans.unshift(plan);evidence('departure_plan',plan);$('#departureResult').className=`answer ${result.level}`;$('#departureResult').innerHTML=`<b>${result.riskScore}% departure risk — ${safe(result.label)}</b><br>${result.missing.length?`Fix before leaving: ${safe(result.missing.join(', '))}.`:safe(result.action)}`;renderAll();});
    $('#arrivalForm').addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.currentTarget),flags=['leadFromCar','pathControlled','gateAssessed','innerGateSecure'],missing=flags.filter(k=>!f.has(k)),score=Logic.clamp(missing.length*24),band=Logic.riskBand(score),record={id:uid('arrival'),parkId:state.selectedParkId,checks:Object.fromEntries(flags.map(k=>[k,f.has(k)])),riskScore:score,time:now()};state.arrivalChecks.unshift(record);evidence('arrival_check',record);$('#arrivalResult').className=`answer ${band.level}`;$('#arrivalResult').innerHTML=`<b>${score}% arrival-process risk — ${safe(band.label)}</b><br>${missing.length?'Complete all lead and gate checks before release.':'Arrival checklist complete. Continue direct supervision.'}`;renderToday();});

    $('#parkNeedControls').innerHTML=parkNeeds.map(n=>`<label class="toggle"><input type="checkbox" value="${safe(n)}"> ${safe(n)}</label>`).join('');
    $('#parkFilterForm').addEventListener('submit',e=>{e.preventDefault();renderParks();});
    $('#parkFilterForm').addEventListener('reset',()=>setTimeout(renderParks,0));
    $('#beachFilterForm').addEventListener('submit',e=>{e.preventDefault();renderBeaches();});

    $$('input[type="range"]').forEach(r=>r.addEventListener('input',()=>{if(r.nextElementSibling)r.nextElementSibling.textContent=r.value;}));
    $('#dogForm').addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.currentTarget),id=f.get('id')||uid('dog'),existing=dogById(id)||{};const dog={...existing,id,name:String(f.get('name')||'').trim(),dob:f.get('dob'),breed:f.get('breed'),lifeStage:f.get('lifeStage'),publicNote:f.get('publicNote'),notes:f.get('notes'),microchip:f.get('microchip'),weight:f.get('weight'),medical:f.get('medical'),vet:f.get('vet'),emergencyContact:f.get('emergencyContact'),vaccinationStatus:f.get('vaccinationStatus'),registrationExpiry:f.get('registrationExpiry'),vaccinationDue:f.get('vaccinationDue'),fleaTickDue:f.get('fleaTickDue'),medicationDue:f.get('medicationDue')};Logic.dims.forEach(k=>dog[k]=Number(f.get(k)));const index=state.dogs.findIndex(d=>d.id===id);if(index>=0)state.dogs[index]=dog;else state.dogs.push(dog);evidence(index>=0?'dog_updated':'dog_created',{dogId:id,name:dog.name});e.currentTarget.reset();e.currentTarget.elements.id.value='';$$('#dogForm input[type="range"]').forEach(r=>r.nextElementSibling.textContent=r.value);renderAll();});
    $('#dogForm').addEventListener('reset',e=>setTimeout(()=>{e.currentTarget.elements.id.value='';$$('#dogForm input[type="range"]').forEach(r=>r.nextElementSibling.textContent=r.value);},0));

    $('#puppyForm').addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.currentTarget),dog=dogById(f.get('dog')),result=Logic.puppyAssessment({clearance:f.get('clearance'),setting:f.get('setting'),mentor:f.get('mentor'),lifeStage:dog?.lifeStage});$('#puppyResult').className=`answer ${result.level}`;$('#puppyResult').innerHTML=`<b>${result.riskScore}% socialisation-plan risk — ${safe(result.label)}</b><br>${safe(result.action)}<ul>${result.reasons.map(r=>`<li>${safe(r)}</li>`).join('')}</ul>`;evidence('puppy_socialisation_assessment',{dogId:dog?.id,riskScore:result.riskScore,inputs:Object.fromEntries(f)});});

    $('#compatibilityForm').addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.currentTarget),a=dogById(f.get('dogA')),b=dogById(f.get('dogB')),p=parkById(f.get('park')),heat=latestRisk(state.heatChecks,h=>h.parkId===p.id),result=Logic.interactionRisk(a,b,{capacity:p.capacity,population:f.get('population'),groupEnergy:f.get('groupEnergy'),gateBusy:gateRisk(p.id)>=50,quiet:p.quiet,heatRisk:heat});if(!result){$('#compatibilityResult').innerHTML='<b>Choose two different dogs.</b>';return;}const prediction={id:uid('pred'),dogAId:a.id,dogBId:b.id,parkId:p.id,riskScore:result.riskScore,reasons:result.reasons,modelVersion:VERSION,reason:'manual',time:now()};state.predictions.unshift(prediction);state.predictions=state.predictions.slice(0,300);evidence('compatibility_prediction',prediction);$('#compatibilityResult').innerHTML=predictionHtml(prediction);renderPredictionSelect();renderToday();});
    $('#recommendationForm').addEventListener('submit',e=>{e.preventDefault();if(!state.privacy.recommendations){$('#recommendationList').innerHTML='<div class="answer yellow">Recommendations are disabled in Settings.</div>';return;}const f=new FormData(e.currentTarget),dog=dogById(f.get('dog')),p=parkById(f.get('park')),population=currentCheckins(p.id).length,results=state.dogs.filter(d=>d.id!==dog.id).map(other=>{const r=Logic.interactionRisk(dog,other,{capacity:p.capacity,population,groupEnergy:5,gateBusy:gateRisk(p.id)>=50,quiet:p.quiet,heatRisk:latestRisk(state.heatChecks,h=>h.parkId===p.id)});const pred={id:uid('pred'),dogAId:dog.id,dogBId:other.id,parkId:p.id,riskScore:r.riskScore,reasons:r.reasons,modelVersion:VERSION,reason:'prospective_recommendation',time:now()};state.predictions.unshift(pred);return pred;}).sort((x,y)=>x.riskScore-y.riskScore);evidence('prospective_recommendations',{dogId:dog.id,parkId:p.id,count:results.length});$('#recommendationList').innerHTML=results.map(predictionHtml).join('')||'<div class="empty">No other dog profiles available.</div>';renderPredictionSelect();});
    $('#outcomeForm').addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.currentTarget),prediction=state.predictions.find(p=>p.id===f.get('prediction'));if(!prediction)return;const outcome={id:uid('out'),predictionId:prediction.id,outcome:f.get('outcome'),note:f.get('note'),time:now()};state.outcomes.unshift(outcome);if(state.privacy.learningParticipation){const delta={positive:.25,neutral:0,stressful:-.3,conflict:-.55}[outcome.outcome]||0;[prediction.dogAId,prediction.dogBId].forEach(id=>{const d=dogById(id);if(d){d.sociability=Logic.clamp(d.sociability+delta,0,10);d.tolerance=Logic.clamp(d.tolerance+delta,0,10);if(delta<0)d.reactivity=Logic.clamp(d.reactivity-delta,0,10);}});}evidence('interaction_outcome',outcome);renderAll();e.currentTarget.reset();});

    $('#affinityForm').addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.currentTarget);if(f.get('fromDog')===f.get('toDog')){alert('Choose two different dogs.');return;}const a={id:uid('aff'),fromDogId:f.get('fromDog'),toDogId:f.get('toDog'),mode:f.get('mode'),status:f.get('mode')==='mutual'?'pending reciprocal consent':'active',parkId:f.get('park'),time:now()};state.affinities.unshift(a);evidence('affinity_created',a);renderAffinity();});
    $('#alertCheckForm').addEventListener('submit',e=>{e.preventDefault();const parkId=new FormData(e.currentTarget).get('park');if(!state.privacy.affinityAlerts||!state.privacy.livePresence){$('#affinityAlerts').innerHTML='<div class="answer yellow">Best-mate alerts or live presence are disabled.</div>';return;}const visible=new Set(state.checkins.filter(c=>c.parkId===parkId&&!c.incognito).map(c=>c.dogId));const matches=state.affinities.filter(a=>a.parkId===parkId&&a.status==='active'&&visible.has(a.toDogId));$('#affinityAlerts').innerHTML=matches.length?matches.map(a=>`<div class="answer green"><b>${safe(dogById(a.toDogId)?.name)} is checked in at ${safe(parkById(parkId).name)}</b><br>Exact position is not shown.</div>`).join(''):'<div class="answer yellow">No eligible visible best mate is checked in at this park.</div>';});

    $('#checkinForm').addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.currentTarget),existing=state.checkins.find(c=>c.dogId===f.get('dog')&&c.sessionOwner==='local-owner');if(existing){alert('This dog is already checked in. Check out first.');return;}const c={id:uid('check'),dogId:f.get('dog'),parkId:f.get('park'),status:f.get('status'),leadAgreement:f.has('leadAgreement'),gateAgreement:f.has('gateAgreement'),supervisionAgreement:f.has('supervisionAgreement'),needsSpace:f.has('needsSpace'),onLead:f.has('onLead'),training:f.has('training'),incognito:f.has('incognito')||state.privacy.incognitoDefault,sessionOwner:'local-owner',time:now(),lastSupervision:now()};state.selectedParkId=c.parkId;state.checkins.unshift(c);evidence('check_in',c);renderAll();});
    $('#unattendedForm').addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.currentTarget),r={id:uid('unattended'),parkId:f.get('park'),description:f.get('description'),ownerLocation:f.get('ownerLocation'),concern:f.get('concern'),status:'open',time:now()};state.supervisionReports.unshift(r);evidence('unattended_dog_report',r);e.currentTarget.reset();refreshSelects();renderOwnerDuty();});

    $('#etiquetteSignals').innerHTML=etiquetteSignals.map(([v,l])=>`<label class="toggle"><input type="checkbox" value="${v}"> ${safe(l)}</label>`).join('');
    $('#etiquetteForm').addEventListener('submit',e=>{e.preventDefault();const signals=$$('#etiquetteSignals input:checked').map(i=>i.value),result=Logic.etiquetteRisk(signals);$('#etiquetteResult').className=`answer ${result.level}`;$('#etiquetteResult').innerHTML=`<b>${result.riskScore}% observed interaction risk — ${safe(result.label)}</b><br>${result.actions.map(safe).join(' ')}`;evidence('etiquette_assessment',{signals,riskScore:result.riskScore});});

    $('#heatCheckForm').addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.currentTarget),input={apparentTemperature:f.get('apparentTemperature'),humidity:f.get('humidity'),uvIndex:f.get('uvIndex'),directSun:f.has('directSun'),shadeAvailable:f.has('shadeAvailable'),waterAvailable:f.has('waterAvailable'),hotSurface:f.has('hotSurface'),vulnerableDog:f.has('vulnerableDog')},result=Logic.heatRisk(input),record={id:uid('heat'),dogId:f.get('dog'),parkId:f.get('park'),riskScore:result.riskScore,inputs:input,time:now()};state.heatChecks.unshift(record);state.heatChecks=state.heatChecks.slice(0,200);evidence('heat_check',record);$('#heatResult').innerHTML=riskHtml(result);renderHeatHistory();renderToday();});
    $('#useCurrentWeather').addEventListener('click',async()=>{const status=$('#weatherStatus');if(!state.privacy.preciseLocation){status.className='answer yellow';status.innerHTML='<b>Location is off.</b><br>Enable “Allow location only when I request current weather” in Settings, or continue with manual entry.';return;}if(!navigator.geolocation){status.className='answer red';status.textContent='This browser does not support geolocation.';return;}status.className='answer yellow';status.textContent='Requesting location and current weather…';navigator.geolocation.getCurrentPosition(async pos=>{try{const {latitude,longitude}=pos.coords;const url=`https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}&current=apparent_temperature_2m,relative_humidity_2m,uv_index&timezone=auto`;const response=await fetch(url);if(!response.ok)throw new Error(`Weather service returned ${response.status}`);const data=await response.json(),current=data.current||{},form=$('#heatCheckForm');if(current.apparent_temperature!=null)form.elements.apparentTemperature.value=current.apparent_temperature;if(current.relative_humidity_2m!=null)form.elements.humidity.value=current.relative_humidity_2m;if(current.uv_index!=null)form.elements.uvIndex.value=current.uv_index;status.className='answer green';status.innerHTML=`<b>Current weather loaded.</b><br>Feels like ${safe(current.apparent_temperature)}°C · humidity ${safe(current.relative_humidity_2m)}% · UV ${safe(current.uv_index)}. Check the exact park and surface directly.`;evidence('weather_loaded',{provider:'Open-Meteo',coordinatesStored:false,time:now()});}catch(err){status.className='answer red';status.innerHTML=`<b>Weather could not be loaded.</b><br>${safe(err.message)}. Use manual entry.`;}},err=>{status.className='answer red';status.innerHTML=`<b>Location was not available.</b><br>${safe(err.message)}. Use manual entry.`;},{enableHighAccuracy:false,timeout:12000,maximumAge:300000});});
    $('#hazardForm').addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.currentTarget),h={id:uid('haz'),parkId:f.get('park'),type:f.get('type'),riskScore:Number(f.get('risk')),details:f.get('details'),time:now(),source:'community local report'};state.hazards.unshift(h);state.selectedParkId=h.parkId;evidence('hazard_report',h);e.currentTarget.reset();refreshSelects();renderAll();});

    $('#tripNeeds').innerHTML=tripNeedOptions.map(n=>`<label class="toggle"><input type="checkbox" value="${safe(n)}"> ${safe(n)}</label>`).join('');
    $('#tripForm').addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.currentTarget),plan={id:uid('trip'),from:f.get('from'),to:f.get('to'),needs:$$('#tripNeeds input:checked').map(i=>i.value),time:now()};state.trips.unshift(plan);evidence('trip_plan',plan);renderTripResult(plan);});

    $('#emergencyDogSelect').addEventListener('change',()=>$('#emergencySummary').innerHTML='');
    $('#showEmergencySummary').addEventListener('click',()=>{const dog=dogById($('#emergencyDogSelect').value);if(!dog)return;$('#emergencySummary').innerHTML=`<div class="answer amber"><b>${safe(dog.name)}</b><br>Microchip: ${safe(dog.microchip||'Not entered')}<br>Weight: ${safe(dog.weight||'Not entered')} kg<br>Allergies/medication: ${safe(dog.medical||'Not entered')}<br>Vet: ${safe(dog.vet||'Not entered')}<br>Emergency contact: ${safe(dog.emergencyContact||'Not entered')}</div>`;evidence('emergency_summary_viewed',{dogId:dog.id,role:state.currentRole});});
    const updateVetLink=()=>{$('#vetSearchLink').href=`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`emergency vet ${$('#vetLocation').value}`)}`;};$('#vetLocation').addEventListener('input',updateVetLink);updateVetLink();
    $('#startAloneTimer').addEventListener('click',()=>{const minutes=Number($('#aloneTimerMinutes').value);state.aloneTimerEnd=new Date(Date.now()+minutes*60000).toISOString();evidence('alone_timer_started',{minutes});renderAloneTimer();});
    $('#cancelAloneTimer').addEventListener('click',()=>{state.aloneTimerEnd=null;evidence('alone_timer_cancelled');renderAloneTimer();});

    $('#lostFoundForm').addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.currentTarget),r={id:uid('lost'),type:f.get('type'),description:f.get('description'),location:f.get('location'),urgency:f.get('urgency'),contact:f.get('contact'),time:now()};state.lostFound.unshift(r);evidence('lost_found_record',r);e.currentTarget.reset();renderLostFound();});
    $('#incidentForm').addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.currentTarget),r={id:uid('inc'),parkId:f.get('park'),type:f.get('type'),severity:Number(f.get('severity')),details:f.get('details'),witness:f.get('witness'),time:now(),status:'open'};state.incidents.unshift(r);evidence('incident_record',r);e.currentTarget.reset();refreshSelects();renderIncidents();renderSuperintendent();});
    $('#maintenanceForm').addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.currentTarget),m={id:uid('maint'),parkId:f.get('park'),facility:f.get('facility'),priority:f.get('priority'),task:f.get('task'),status:'open',time:now()};state.maintenance.unshift(m);evidence('maintenance_created',m);e.currentTarget.reset();refreshSelects();renderSuperintendent();});
    $('#noticeForm').addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.currentTarget),n={id:uid('notice'),parkId:f.get('park'),title:f.get('title'),details:f.get('details'),expires:f.get('expires'),verified:true,createdByRole:state.currentRole,time:now()};state.notices.unshift(n);evidence('operator_notice_created',n);e.currentTarget.reset();refreshSelects();renderAll();});

    $('#notificationForm').addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.currentTarget);['bestMate','heat','hazards','documents','emergency','companion'].forEach(k=>state.notifications[k]=f.has(k));state.notifications.quietStart=f.get('quietStart');state.notifications.quietEnd=f.get('quietEnd');state.notifications.locationDetail=f.get('locationDetail');evidence('notification_settings',state.notifications);renderNotifications();});
    $('#privacyForm').addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.currentTarget);Object.keys(state.privacy).forEach(k=>state.privacy[k]=f.has(k));evidence('privacy_settings',state.privacy);renderPrivacy();});
    $('#reducedMotion').addEventListener('change',e=>{state.accessibility.reducedMotion=e.target.checked;evidence('accessibility_setting',{reducedMotion:e.target.checked});renderAccessibility();});
    $('#largeText').addEventListener('change',e=>{state.accessibility.largeText=e.target.checked;evidence('accessibility_setting',{largeText:e.target.checked});renderAccessibility();});
    $('#highContrast').addEventListener('change',e=>{state.accessibility.highContrast=e.target.checked;evidence('accessibility_setting',{highContrast:e.target.checked});renderAccessibility();});

    const exportData=()=>{evidence('data_exported');download(`GENEVIEVE-Dog-Park-data-${new Date().toISOString().slice(0,10)}.json`,JSON.stringify({exportedAt:now(),version:VERSION,state},null,2));};
    $('#exportEvidence').addEventListener('click',()=>{evidence('evidence_exported');download(`GENEVIEVE-patent-evidence-${new Date().toISOString().slice(0,10)}.json`,JSON.stringify({exportedAt:now(),version:VERSION,evidence:state.evidence,predictions:state.predictions,outcomes:state.outcomes,heatChecks:state.heatChecks,affinities:state.affinities,environment:parks.map(p=>({parkId:p.id,checkins:currentCheckins(p.id).length,capacity:p.capacity}))},null,2));});
    $('#exportAllData').addEventListener('click',exportData);$('#dataExportButton').addEventListener('click',exportData);
    const deleteData=()=>{if(confirm('Delete all local GENEVIEVE Dog Park data from this browser? This cannot be undone.')){localStorage.removeItem(KEY);state=structuredClone(defaultState);saveState();renderAll();setScreen('today');}};$('#deleteAllData').addEventListener('click',deleteData);$('#dataDeleteButton').addEventListener('click',deleteData);
    $('#restorePurchases').addEventListener('click',()=>{const ok=window.GenevieveNativeBilling?.restore?.();$('#billingResult').className=`answer ${ok?'green':'red'}`;$('#billingResult').innerHTML=ok?'<b>Restore requested.</b>':'<b>Native store restore is not connected in this web build.</b>';});
    $('#runLaunchCheck').addEventListener('click',runLaunchCheck);
  }

  function boot(){
    bindGlobalClicks();bindForms();
    $('#roleSelect').value=state.currentRole;
    renderAll();
    const hash=location.hash.slice(1);if(hash&&document.getElementById(hash))setScreen(hash,false);else setScreen('today',false);
    $('#modePill').textContent=`${channel().toUpperCase()} · ${window.GenevieveBackend?.enabled?'backend configured':'local-first mode'} · v${VERSION}`;
    if('serviceWorker' in navigator) navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
    setInterval(()=>{renderAloneTimer();if(state.aloneTimerEnd&&new Date(state.aloneTimerEnd)<=new Date()){const expiredEnd=state.aloneTimerEnd;state.aloneTimerEnd=null;evidence('alone_timer_expired',{end:expiredEnd});renderAloneTimer();}},30000);
    evidence('app_loaded',{channel:channel(),role:state.currentRole});
  }

  document.addEventListener('DOMContentLoaded',boot);
})();
