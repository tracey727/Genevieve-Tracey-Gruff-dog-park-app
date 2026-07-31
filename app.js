(() => {
  'use strict';

  const CFG = window.GENEVIEVE_CONFIG || {};
  const Logic = window.GenevieveLogic;
  const NotifyLogic = window.GenevieveNotificationLogic;
  const KEY = 'genevieve_dogpark_full_restore_state_v3';
  const VERSION = CFG.version || '2026.07.31.40';
  const LEGAL_VERSION = CFG.legalVersion || '2026-07-24';
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const now = () => new Date().toISOString();
  const uid = prefix => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const safe = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const fmtDate = value => value ? new Intl.DateTimeFormat('en-AU',{dateStyle:'medium'}).format(new Date(value)) : 'Not entered';
  const fmtTime = value => value ? new Intl.DateTimeFormat('en-AU',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value)) : '';
  const ALL_NOTIFICATION_ROLES = ['owner','visitor','worker','superintendent','responder','admin'];
  const OPERATIONS_NOTIFICATION_ROLES = ['worker','superintendent','responder','admin'];

  const parkNeeds = ['Accessibility','Beach','Café nearby','Caravan parking','Double gate','Fenced','Lighting','Quiet','Shade','Toilets','Water bowl'];
  const tripNeedOptions = ['Dog-friendly café','Dog-friendly restaurant','Dog-friendly pub','Dog-friendly bar','Dog park','Large quiet dog park near accommodation','Dog beach','Dog swimming spot','Dog-friendly campsite','Emergency vet','Fuel stop with dog-safe rest area','Pet supplies','Rest area','Quiet exercise area','Shade','Toilets','Fresh water'];
  const etiquetteSignals = [
    ['relaxed','Relaxed body'],['playBow','Play bow'],['sniffBreaks','Takes sniff breaks'],['respondsRecall','Responds to recall'],
    ['stiff','Stiff body'],['tucked','Tail tucked / shrinking'],['avoidance','Avoids contact'],['overAroused','Cannot settle'],
    ['obsessiveChasing','Obsessive chasing'],['pinning','Pinning another dog'],['guarding','Resource guarding'],['snapping','Snapping or attempted bite']
  ];

  const NATIONAL_PARK_DATASET = Object.freeze({
    status:'Verified national starter dataset',
    verifiedAt:'23 July 2026',
    coverage:'8 of 8 Australian states and territories',
    scope:'One official council or territory-government dog-park record per jurisdiction'
  });
  const parks = [
    {
      id:'lake-ginninderra-act',name:'Lake Ginninderra Dog Park',suburb:'Belconnen ACT',state:'ACT',
      address:'Diddams Close, Belconnen ACT 2617',query:'Lake Ginninderra Dog Park Diddams Close Belconnen ACT',
      latitude:-35.2288450,longitude:149.0732515,capacity:36,size:'11,435 m² · separate large and small fenced areas',
      features:['Fenced','Shade','Water bowl'],quiet:false,beachType:'',
      sourceAuthority:'ACT Government — City Services',
      officialUrl:'https://www.cityservices.act.gov.au/pets-and-wildlife/dogs/recreation-with-my-dog',
      verifiedAt:'23 July 2026',coordinateStatus:'Published Diddams Close location cross-checked on OpenStreetMap',
      verifiedSummary:'ACT Government lists this as a fenced dog park at Diddams Close, Lake Ginninderra. Its published visitor information describes separate large- and small-dog areas, grass and dirt surfaces, shade and benches.',
      rulesNote:'ACT dog-park rules require registration, desexing unless permitted, vaccination, effective control and no more than two dogs per supervisor. Check current signs and ACT water-quality advice before using the nearby lake.',
      warning:'The 36-dog figure is a GENEVIEVE working guide for voluntary crowd calculations, not an ACT Government capacity or headcount.'
    },
    {
      id:'sydney-park-nsw',name:'Sydney Park',suburb:'Alexandria NSW',state:'NSW',
      address:'Sydney Park Road, Alexandria NSW 2015',query:'Sydney Park dog off leash areas Alexandria NSW',
      latitude:-33.90983,longitude:151.18517,capacity:45,size:'Regional park · extensive designated off-leash areas',
      features:['Café nearby','Shade','Toilets'],quiet:false,beachType:'',
      sourceAuthority:'City of Sydney',
      officialUrl:'https://www.cityofsydney.nsw.gov.au/parks/sydney-park',
      verifiedAt:'23 July 2026',coordinateStatus:'City of Sydney published map point',
      verifiedSummary:'City of Sydney lists extensive off-leash areas available at all times and a dog paddling pool, with shade, toilets, parking and a café at the park.',
      rulesNote:'Dogs are prohibited from the wetlands, Alan Davidson Oval, cycling centre, playground and barbecue areas. Follow the signed off-leash boundaries and keep effective control.',
      warning:'The 45-dog figure is a GENEVIEVE working guide for voluntary crowd calculations, not a City of Sydney capacity or headcount.'
    },
    {
      id:'lakeside-dog-park-nt',name:'Lakeside Dog Park',suburb:'Alawa NT',state:'NT',
      address:'Next to Lakeside Drive Community Garden, Alawa NT 0810',query:'Lakeside Drive Dog Park Alawa NT 0810',
      latitude:-12.3797,longitude:130.8693,capacity:28,size:'Separate small- and large-dog fenced areas',
      features:['Fenced','Shade','Water bowl'],quiet:false,beachType:'',
      sourceAuthority:'City of Darwin',
      officialUrl:'https://www.darwin.nt.gov.au/projects/lakeside-dog-park',
      verifiedAt:'23 July 2026',coordinateStatus:'Approximate map point beside the published Community Garden location',
      approximatePoint:true,
      verifiedSummary:'City of Darwin records the completed park beside Lakeside Drive Community Garden, with separate small- and large-dog areas, 1500 mm chain-mesh fencing, access gates, water troughs, disposal bags and shade trees.',
      rulesNote:'Use the signed enclosure for the dog’s size and confirm gate, water and maintenance conditions on arrival.',
      warning:'The map marker is an approximate location reference and the 28-dog figure is a GENEVIEVE working guide, not a City of Darwin capacity or headcount.'
    },
    {
      id:'nick-pavlis-qld',name:'Nick Pavlis Park',suburb:'Labrador QLD',state:'QLD',
      address:'Whiting Street, Labrador QLD 4215',query:'Nick Pavlis Park Whiting Street Labrador QLD 4215',
      latitude:-27.9425199,longitude:153.3949674,capacity:24,size:'Fenced designated off-leash area with agility equipment',
      features:['Fenced','Water bowl'],quiet:false,beachType:'',
      sourceAuthority:'City of Gold Coast',
      officialUrl:'https://www.goldcoast.qld.gov.au/Things-to-do/Parks-gardens-reserves/Park-Finder/Nick-Pavlis-Park',
      verifiedAt:'23 July 2026',coordinateStatus:'City of Gold Coast published map point',
      verifiedSummary:'City of Gold Coast lists a fenced designated off-leash area, dog agility equipment, a drinking fountain and water tap at Nick Pavlis Park.',
      rulesNote:'Dogs must remain on leash unless inside the signed off-leash area and are prohibited from children’s playgrounds. Check signed boundaries and leave the area during mowing.',
      warning:'The 24-dog figure is a GENEVIEVE working guide for voluntary crowd calculations, not a City of Gold Coast capacity or headcount.'
    },
    {
      id:'north-adelaide-dog-park-sa',name:'North Adelaide Dog Park',suburb:'North Adelaide SA',state:'SA',
      address:'Entrance off Robe Terrace near Main North Road, North Adelaide SA 5006',query:'North Adelaide Dog Park Robe Terrace SA 5006',
      latitude:-34.9004701,longitude:138.5996420,capacity:30,size:'Fully fenced · separate smaller-dog and all-dog areas',
      features:['Fenced','Shade'],quiet:false,beachType:'',
      sourceAuthority:'City of Adelaide',
      officialUrl:'https://www.cityofadelaide.com.au/park/north-adelaide-dog-park/',
      verifiedAt:'23 July 2026',coordinateStatus:'Published entrance and park boundary cross-checked on OpenStreetMap',
      verifiedSummary:'City of Adelaide describes this Bragg Park / Ngampa Yarta facility as fully fenced, with a section for smaller dogs and puppies, a second section for all dogs, tunnels, shade and sheltered seating.',
      rulesNote:'Use the enclosure suited to the dog and follow the current entrance signs and City of Adelaide requirements.',
      warning:'The 30-dog figure is a GENEVIEVE working guide for voluntary crowd calculations, not a City of Adelaide capacity or headcount.'
    },
    {
      id:'john-turnbull-tas',name:'John Turnbull Dog Park',suburb:'Lenah Valley TAS',state:'TAS',
      address:'Corner Creek and Lenah Valley Roads, Lenah Valley TAS 7008',query:'John Turnbull Dog Park Lenah Valley Tasmania',
      latitude:-42.8666879,longitude:147.2724466,capacity:40,size:'15,000 m² · large and small fenced areas',
      features:['Double gate','Fenced','Shade','Water bowl'],quiet:false,beachType:'',
      sourceAuthority:'City of Hobart',
      officialUrl:'https://www.hobartcity.com.au/Things-To-Do/Parks-and-reserves/Find-a-park-or-reserve/John-Turnbull-Dog-Park',
      verifiedAt:'23 July 2026',coordinateStatus:'City of Hobart published map point',
      verifiedSummary:'City of Hobart lists two securely fenced areas, double airlock gates, watering stations, shade, a mulched agility area, sandpit and varied gravel, log and rock surfaces.',
      rulesNote:'Council lists a Wednesday maintenance closure from 9:30 am to 12:30 pm. Confirm the current closure and signs before travel.',
      warning:'The 40-dog figure is a GENEVIEVE working guide for voluntary crowd calculations, not a City of Hobart capacity or headcount.'
    },
    {
      id:'eades-dog-park-vic',name:'Eades Dog Park',suburb:'West Melbourne VIC',state:'VIC',
      address:'Eades Park, West Melbourne VIC 3003',query:'Eades Dog Park West Melbourne VIC 3003',
      latitude:-37.8074857,longitude:144.9515181,capacity:18,size:'Secure fenced dog off-leash area',
      features:['Fenced','Water bowl'],quiet:false,beachType:'',
      sourceAuthority:'City of Melbourne',
      officialUrl:'https://www.melbourne.vic.gov.au/eades-dog-park',
      verifiedAt:'23 July 2026',coordinateStatus:'Published Eades Park location cross-checked on OpenStreetMap',
      verifiedSummary:'City of Melbourne describes a secure dog space with a permanent perimeter fence and gates, sensory landscape features, seats, bins and a drinking fountain.',
      rulesNote:'Keep the dog under effective control and follow current City of Melbourne signs, including any temporary maintenance restrictions.',
      warning:'The 18-dog figure is a GENEVIEVE working guide for voluntary crowd calculations, not a City of Melbourne capacity or headcount.'
    },
    {
      id:'ozone-dog-agility-wa',name:'Ozone Reserve Dog Agility Park',suburb:'East Perth WA',state:'WA',
      address:'1 Adelaide Terrace, East Perth WA 6004',query:'Ozone Reserve Dog Agility Park East Perth WA 6004',
      latitude:-31.9627393,longitude:115.8774989,capacity:25,size:'Fenced agility park suitable for dogs of all sizes',
      features:['Accessibility','Fenced','Water bowl'],quiet:false,beachType:'',
      sourceAuthority:'City of Perth',
      officialUrl:'https://perth.wa.gov.au/hire-and-bookings/all-venues/ozone-reserve',
      verifiedAt:'23 July 2026',coordinateStatus:'City of Perth / Visit Perth published map point',
      verifiedSummary:'City of Perth lists a fenced agility park with jump bars, weave poles, a pyramid ramp, dog walk, resting podium, benches, a water fountain and a dog-waste bag bin.',
      rulesNote:'Dogs must be on lead outside designated dog exercise areas and owners must remove dog waste. Follow current signs and facility conditions.',
      warning:'The 25-dog figure is a GENEVIEVE working guide for voluntary crowd calculations, not a City of Perth capacity or headcount.'
    },
    {
      id:'musgrave-dog-park-qld',name:'Musgrave Park Dog Off-Leash Area',suburb:'Southport / Labrador QLD',state:'QLD',
      address:'Musgrave Avenue and Kumbari Avenue, Southport QLD 4215',query:'Musgrave Park Dog Off Leash Area Southport QLD 4215',
      latitude:-27.95545,longitude:153.38935,capacity:30,size:'Local dog-exercise area · verify current signed boundaries',
      features:['Fenced','Shade','Water bowl','Toilets','Accessibility'],quiet:false,beachType:'',
      sourceAuthority:'City of Gold Coast — verify current Park Finder record',
      officialUrl:'https://www.goldcoast.qld.gov.au/Things-to-do/Parks-gardens-reserves',
      verifiedAt:'28 July 2026',coordinateStatus:'Search point for the Musgrave Avenue and Kumbari Avenue area',
      verifiedSummary:'Local directory result included for Labrador and Southport searches. Confirm current facilities, boundaries, maintenance and rules through City of Gold Coast information and on-site signs.',
      rulesNote:'Keep the dog under effective control and follow every current sign. Facilities and conditions may change.',
      warning:'This is a location guide, not a live council capacity, safety or availability guarantee.',localDirectoryRecord:true
    },
    {
      id:'broadwater-dog-area-qld',name:'Broadwater Parklands Dog Exercise Search',suburb:'Southport QLD',state:'QLD',
      address:'Marine Parade, Southport QLD 4215',query:'dog off leash area Broadwater Parklands Southport QLD',
      latitude:-27.9655,longitude:153.4142,capacity:25,size:'Nearby search lead · verify designated dog area and current rules',
      features:['Accessibility','Lighting','Café nearby','Toilets','Caravan parking'],quiet:false,beachType:'',
      sourceAuthority:'City of Gold Coast — verify current designated area',
      officialUrl:'https://www.goldcoast.qld.gov.au/Things-to-do/Parks-gardens-reserves',
      verifiedAt:'28 July 2026',coordinateStatus:'Broadwater Parklands search point',
      verifiedSummary:'Nearby directory lead for users comparing Labrador and Southport options. It must not be treated as confirmation of an off-leash boundary.',
      rulesNote:'Confirm whether dogs are permitted, whether a designated off-leash area exists and the current signed boundaries before entering.',
      warning:'Search lead only. Current council rules and signs control.',localDirectoryRecord:true
    }
  ];

  const defaultState = {
    version: VERSION,
    selectedParkId: 'nick-pavlis-qld',
    currentRole: 'owner',
    quickStatus: {},
    dogs: [
      {id:'mr-gruff',name:'Mr Gruff',dob:'2021-08-08',breed:'Companion dog',lifeStage:'adult',publicNote:'Ask owner before approach',notes:'Playful. Calm introductions and current observation remain important.',sociability:8,reactivity:3,energy:7,playIntensity:7,tolerance:7,resourceSharing:7,vulnerability:2,microchip:'',weight:'',medical:'',vet:'',emergencyContact:'',vaccinationStatus:'public-cleared',reproductiveStatus:'not-shared',supportNeeds:'none',supportNote:'',registrationExpiry:'',vaccinationDue:'',fleaTickDue:'',medicationDue:'',insuranceExpiry:''},
      {id:'luna',name:'Luna',dob:'2022-04-18',breed:'Companion dog',lifeStage:'adult',publicNote:'Gentle play; avoid rough greetings',notes:'Calm approach and sniff breaks.',sociability:8,reactivity:2,energy:6,playIntensity:5,tolerance:8,resourceSharing:7,vulnerability:2,microchip:'',weight:'',medical:'',vet:'',emergencyContact:'',vaccinationStatus:'public-cleared',reproductiveStatus:'not-shared',supportNeeds:'none',supportNote:'',registrationExpiry:'',vaccinationDue:'',fleaTickDue:'',medicationDue:'',insuranceExpiry:''}
    ],
    departurePlans: [], arrivalChecks: [], checkins: [], supervisionReports: [], affinities: [], predictions: [], outcomes: [], observations: [], heatChecks: [], hazards: [], lostFound: [], incidents: [], maintenance: [], notices: [], trips: [], evidence: [],
    privacy: {discoverable:true,livePresence:true,affinityAlerts:true,recommendations:true,learningParticipation:true,preciseLocation:false,showMedicalToResponder:false,incognitoDefault:false},
    notifications: {bestMate:true,heat:true,hazards:true,documents:true,emergency:true,incidents:true,workerTasks:true,companion:false,quietStart:'20:00',quietEnd:'07:00',locationDetail:'park',permissionAsked:false,lastCheckedAt:null},
    notificationHistory: [],
    notificationCooldowns: {},
    notificationUnread: 0,
    inAppAlerts: [],
    inAppUnread: 0,
    accessibility: {
      reducedMotion:false,largeText:false,highContrast:false,
      auslanSupportEnabled:false,usesAuslan:false,deafOrHardOfHearing:false,learningAuslan:false,
      communicateSigning:false,communicateTyping:false,communicateCards:false,visualAttention:false,
      dogVisualCommands:false,shareCommunicationPreferences:false,emergencyVisualMode:false
    },
    aloneTimerEnd: null,
    legalAcceptance: {
      version: '',
      acceptedAt: '',
      termsAndPrivacyAccepted: false,
      safetyAccepted: false
    }
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
  // Repair migration: preserve owner-created records, remove untouched sample profiles and remove demo wording.
  state.dogs=(state.dogs||[]).filter(d=>!['bear-demo','rosie-demo'].includes(d.id)).map(d=>{
    if(d.id==='luna-demo')return {...d,id:'luna',name:String(d.name||'Luna').replace(/\s*\(demo\)\s*/gi,'').trim()||'Luna',breed:d.breed==='Demonstration profile'?'Companion dog':d.breed};
    return {...d,name:String(d.name||'').replace(/\s*\(demo\)\s*/gi,'').trim(),breed:d.breed==='Demonstration profile'?'Companion dog':d.breed};
  });
  if(!state.dogs.some(d=>d.id==='mr-gruff'))state.dogs.unshift(structuredClone(defaultState.dogs[0]));
  if(!state.dogs.some(d=>d.id==='luna'))state.dogs.push(structuredClone(defaultState.dogs[1]));
  state.dogs=state.dogs.map(d=>({reproductiveStatus:'not-shared',supportNeeds:'none',supportNote:'',insuranceExpiry:'',...d}));
  state.trips=Array.isArray(state.trips)?state.trips:[];
  let installPromptEvent = null;
  if (!parks.some(park => park.id === state.selectedParkId)) state.selectedParkId = defaultState.selectedParkId;
  state.accessibility.emergencyVisualMode = false;
  function saveState() { state.version = VERSION; try{localStorage.setItem(KEY, JSON.stringify(state));}catch{} renderEvidenceCount(); }
  function evidence(type, payload={}) { state.evidence.unshift({id:uid('ev'),type,payload,appVersion:VERSION,time:now()}); state.evidence=state.evidence.slice(0,1500); saveState(); }
  function download(name, text, type='application/json') { const blob=new Blob([text],{type}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1500); }
  function dogById(id){ return state.dogs.find(d=>d.id===id); }
  function parkById(id){ return parks.find(p=>p.id===id) || parks[0]; }
  function selectedPark(){ return parkById(state.selectedParkId); }
  const reproductiveStatusLabels={desexed:'Owner-declared: desexed',intact:'Owner-declared: intact','on-heat':'Owner-declared: on heat'};
  const supportNeedLabels={vision:'Vision-impaired / blind',hearing:'Deaf / hearing-impaired',mobility:'Mobility support','senior-frail':'Senior / frail',other:'Other support need'};
  function dogStatusMarkup(dog){
    const chips=[];
    if(reproductiveStatusLabels[dog?.reproductiveStatus])chips.push(`<span class="chip">${safe(reproductiveStatusLabels[dog.reproductiveStatus])}</span>`);
    if(supportNeedLabels[dog?.supportNeeds])chips.push(`<span class="chip">${safe(supportNeedLabels[dog.supportNeeds])}</span>`);
    if(dog?.supportNote)chips.push(`<span class="chip">${safe(dog.supportNote)}</span>`);
    const warning=dog?.reproductiveStatus==='on-heat'?'<div class="answer red"><b>Do not use an off-leash introduction.</b><br>Keep separated, check current council rules and choose a controlled alternative.</div>':'';
    return `${chips.length?`<div class="chips dog-owner-status">${chips.join('')}</div>`:''}${warning}`;
  }
  function pruneExpiredCheckins(){
    const cutoff = Date.now();
    const before = state.checkins.length;
    state.checkins = state.checkins.filter(c => !c.expiresAt || new Date(c.expiresAt).getTime() > cutoff);
    if (state.checkins.length !== before) saveState();
  }
  function currentCheckins(parkId=state.selectedParkId){
    pruneExpiredCheckins();
    return state.checkins.filter(c=>c.parkId===parkId);
  }
  function channel(){ return new URLSearchParams(location.search).get('channel') || CFG.defaultChannel || 'web'; }
  function directionsUrl(park){
    const destination=park?.approximatePoint
      ? park.query||`${park.name||''} ${park.address||park.suburb||''}`.trim()
      : Number.isFinite(Number(park?.latitude))&&Number.isFinite(Number(park?.longitude))
      ? `${park.latitude},${park.longitude}`
      : park?.query||`${park?.name||''} ${park?.suburb||''}`.trim();
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=driving`;
  }
  function openStreetMapEmbedUrl(park){
    const latitude=Number(park?.latitude),longitude=Number(park?.longitude);
    if(!Number.isFinite(latitude)||!Number.isFinite(longitude))return 'about:blank';
    const west=(longitude-.018).toFixed(6),south=(latitude-.012).toFixed(6),east=(longitude+.018).toFixed(6),north=(latitude+.012).toFixed(6);
    return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(`${west},${south},${east},${north}`)}&layer=mapnik&marker=${encodeURIComponent(`${latitude},${longitude}`)}`;
  }
  function openStreetMapUrl(park){
    const latitude=Number(park?.latitude),longitude=Number(park?.longitude);
    return `https://www.openstreetmap.org/?mlat=${encodeURIComponent(latitude)}&mlon=${encodeURIComponent(longitude)}#map=15/${encodeURIComponent(latitude)}/${encodeURIComponent(longitude)}`;
  }
  function australiaParkSearchUrl(query=''){
    const destination=String(query||'').trim();
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`dog parks${destination?` ${destination}`:' Australia'}`)}`;
  }
  const WEATHER_REFRESH_MS = 5 * 60 * 1000;
  const WEATHER_CACHE_KEY = 'genevieve_selected_park_weather_v1';
  let headerWeatherRequest = null;
  let headerWeatherParkId = '';

  function weatherDescription(code) {
    if(code===0)return ['Clear','☀️'];
    if([1,2].includes(code))return ['Partly cloudy','🌤️'];
    if(code===3)return ['Overcast','☁️'];
    if([45,48].includes(code))return ['Fog','🌫️'];
    if(code>=51&&code<=57)return ['Drizzle','🌦️'];
    if(code>=61&&code<=67)return ['Rain','🌧️'];
    if(code>=71&&code<=77)return ['Snow','🌨️'];
    if(code>=80&&code<=82)return ['Showers','🌦️'];
    if(code>=85&&code<=86)return ['Snow showers','🌨️'];
    if(code>=95)return ['Thunderstorm','⛈️'];
    return ['Current conditions','🌡️'];
  }
  function weatherCache() {
    try { return JSON.parse(localStorage.getItem(WEATHER_CACHE_KEY) || '{}'); }
    catch { return {}; }
  }
  function saveWeatherCache(parkId,data) {
    try { const cache=weatherCache();cache[parkId]=data;localStorage.setItem(WEATHER_CACHE_KEY,JSON.stringify(cache)); }
    catch {}
  }
  function weatherNumber(value,digits=0) {
    if(value===null||value===undefined||value==='')return '—';
    const number=Number(value);
    return Number.isFinite(number)?number.toFixed(digits):'—';
  }
  function renderHeaderWeather(data, freshness='Current') {
    if(!data)return;
    const park=parkById(data.parkId),[description,icon]=weatherDescription(Number(data.weatherCode));
    $('#headerWeatherIcon').textContent=icon;
    $('#headerWeatherTemperature').textContent=`${weatherNumber(data.temperature)}°`;
    $('#headerWeatherCondition').textContent=description;
    $('#headerWeatherFeelsLike').textContent=`Feels like ${weatherNumber(data.apparentTemperature)}°C`;
    $('#headerWeatherUv').textContent=weatherNumber(data.uvIndex,1);
    $('#headerWeatherWind').textContent=`${weatherNumber(data.windSpeed)} km/h`;
    $('#headerWeatherRain').textContent=`${weatherNumber(data.rainChance)}%`;
    $('#headerWeatherHumidity').textContent=`${weatherNumber(data.humidity)}%`;
    $('#headerWeatherPark').textContent=park.name;
    const updated=new Date(data.updatedAt);
    const time=Number.isNaN(updated.getTime())?'':new Intl.DateTimeFormat('en-AU',{hour:'numeric',minute:'2-digit'}).format(updated);
    $('#headerWeatherFreshness').textContent=time?`${freshness} · ${time}`:freshness;
    $('#headerWeatherPanel').dataset.weatherStatus=freshness.toLowerCase();
  }
  function renderHeaderWeatherLoading(park,message='Updating…') {
    $('#headerWeatherPark').textContent=park.name;
    $('#headerWeatherFreshness').textContent=message;
    $('#headerWeatherPanel').dataset.weatherStatus='updating';
  }
  async function refreshHeaderWeather(force=false) {
    const park=selectedPark();
    if(!park||!Number.isFinite(park.latitude)||!Number.isFinite(park.longitude))return;
    const cached=weatherCache()[park.id];
    const cacheAge=cached?.updatedAt?Date.now()-new Date(cached.updatedAt).getTime():Infinity;
    if(headerWeatherParkId!==park.id){
      headerWeatherParkId=park.id;
      if(cached)renderHeaderWeather(cached,cacheAge<=WEATHER_REFRESH_MS?'Current':'Saved');
      else renderHeaderWeatherLoading(park);
    }
    if(!force&&cached&&cacheAge<=WEATHER_REFRESH_MS){renderHeaderWeather(cached,'Current');return;}
    if(headerWeatherRequest)headerWeatherRequest.abort();
    const controller=new AbortController();
    headerWeatherRequest=controller;
    renderHeaderWeatherLoading(park,cached?'Refreshing…':'Updating…');
    const url=`https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(park.latitude)}&longitude=${encodeURIComponent(park.longitude)}&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,uv_index&daily=precipitation_probability_max,uv_index_max&forecast_days=1&timezone=auto`;
    try{
      const response=await fetch(url,{cache:'no-store',signal:controller.signal});
      if(!response.ok)throw new Error(`Weather service returned ${response.status}`);
      const payload=await response.json(),current=payload.current||{};
      const data={
        parkId:park.id,
        temperature:current.temperature_2m,
        apparentTemperature:current.apparent_temperature,
        humidity:current.relative_humidity_2m,
        weatherCode:current.weather_code,
        windSpeed:current.wind_speed_10m,
        uvIndex:current.uv_index??payload.daily?.uv_index_max?.[0],
        rainChance:payload.daily?.precipitation_probability_max?.[0]??0,
        updatedAt:now()
      };
      saveWeatherCache(park.id,data);
      if(selectedPark().id===park.id)renderHeaderWeather(data,'Live');
    }catch(error){
      if(error.name==='AbortError')return;
      if(cached)renderHeaderWeather(cached,navigator.onLine?'Saved':'Offline');
      else{
        renderHeaderWeatherLoading(park,navigator.onLine?'Weather unavailable':'Offline');
        $('#headerWeatherCondition').textContent='Weather unavailable';
        $('#headerWeatherFeelsLike').textContent='The app will retry automatically';
      }
    }finally{
      if(headerWeatherRequest===controller)headerWeatherRequest=null;
    }
  }
  function riskHtml(result, title='Risk result') {
    if(!result) return '<div class="answer yellow"><b>No result.</b></div>';
    return `<div class="answer ${result.level}"><b>${safe(result.score ?? result.riskScore)}% — ${safe(result.label)}</b><br>${safe(result.action || '')}</div><div class="risk-meter"><span class="risk-marker" style="left:${Math.max(0,Math.min(100,result.score ?? result.riskScore))}%"></span></div>${result.reasons?`<details><summary>Why this result?</summary><ul>${result.reasons.map(r=>`<li>${safe(r)}</li>`).join('')}</ul></details>`:''}${result.advice?`<ul>${result.advice.map(a=>`<li>${safe(a)}</li>`).join('')}</ul>`:''}`;
  }
  function recordCard(title, body, level='green', controls='') { return `<article class="record-card ${level}"><b>${safe(title)}</b><p>${safe(body)}</p>${controls}</article>`; }

  let appHistoryDepth = Number(history.state?.genevieveDepth || 0);
  const screenTitle = id => {
    const screen = document.getElementById(id);
    return screen?.querySelector('h2')?.textContent?.trim()
      || screen?.querySelector('h1')?.textContent?.trim()
      || id.replaceAll('-', ' ');
  };
  function updateStepNavigation(id) {
    const back = $('#backStepButton');
    if (back) {
      back.disabled = appHistoryDepth <= 0;
      back.setAttribute('aria-disabled', String(appHistoryDepth <= 0));
    }
    const title = $('#currentPageTitle');
    if (title) title.textContent = screenTitle(id);
  }
  function backOneStep() {
    if (appHistoryDepth > 0) history.back();
  }

  const groupForScreen = id => document.getElementById(id)?.dataset.group || 'more';
  function applyRoleVisibility(){
    const role=state.currentRole;
    $$('[data-role-button]').forEach(el=>{
      const allowed=el.dataset.roleButton.split(',').includes(role);
      el.hidden=false;
      el.dataset.locked=allowed?'false':'true';
      el.setAttribute('aria-label',allowed?'Open Park Superintendent tools':'Park Superintendent tools. Choose Park Superintendent view to open.');
    });
    ['#roleSelect','#mobileRoleSelect'].forEach(selector=>{const select=$(selector);if(select)select.value=role;});
    const names={owner:'Dog Owner',visitor:'Park Visitor',worker:'Park Worker / Contractor',superintendent:'Park Superintendent',responder:'Authorised Responder',admin:'System Administrator'};
    const help=$('#roleHelp');
    if(help) help.innerHTML=`<b>${safe(names[role]||role)} view is active.</b> ${role==='superintendent'?'The facilities, maintenance, notices and trend tools are now available.':role==='worker'?'Worker safety, hazard, incident and maintenance-task notification rules are active. Verified operator tools still require an authorised account.':'Use the selector above when you need a different authorised view on this device.'}`;
  }
  function setScreen(id, pushHistory=true) {
    let target=document.getElementById(id); if(!target) return;
    if(target.dataset.role && !target.dataset.role.split(',').includes(state.currentRole)) {
      alert('Choose Park Superintendent from More → App View to open these tools.');
      id='more';
      target=document.getElementById(id);
    }
    const currentId=document.querySelector('.screen.active')?.id || null;
    $$('.screen').forEach(s=>s.classList.toggle('active',s.id===id));
    document.body.dataset.currentScreen=id;
    document.body.classList.toggle('first-page-active',id==='today');
    const group=groupForScreen(id);
    $$('[data-main]').forEach(b=>b.classList.toggle('active',b.dataset.main===group));
    if(pushHistory && currentId && currentId!==id) {
      appHistoryDepth += 1;
      history.pushState({genevieveScreen:id,genevieveDepth:appHistoryDepth},'',`#${id}`);
    } else {
      const initialTodayUrl = id === 'today' && !pushHistory
        ? `${location.pathname}${location.search}`
        : `#${id}`;
      history.replaceState({genevieveScreen:id,genevieveDepth:appHistoryDepth},'',initialTodayUrl);
    }
    if(id==='park-details') renderParkDetails();
    if(id==='live-park') renderLivePark();
    if(id==='park-search'){renderParks();renderParkMap();}
    if(id==='dog-profile') renderDogProfile(state.selectedDogId || state.dogs[0]?.id);
    if(id==='superintendent') renderSuperintendent();
    if(id==='notifications'){
      state.notificationUnread=0;
      state.inAppUnread=0;
      saveState();
      if('clearAppBadge' in navigator) navigator.clearAppBadge().catch(()=>{});
      renderNotifications();
    }
    updateStepNavigation(id);
    if(currentId!==id){
      const header=document.querySelector('.topbar');
      const headerBottom=header?window.scrollY+header.getBoundingClientRect().bottom:0;
      window.scrollTo({top:Math.max(0,headerBottom),behavior:document.body.classList.contains('reduced-motion')?'auto':'smooth'});
    }
  }

  let emergencyHoldTimer=null;
  let emergencyHoldSource=null;
  function cancelEmergencyHold(){
    if(emergencyHoldTimer!==null)clearTimeout(emergencyHoldTimer);
    emergencyHoldTimer=null;
    emergencyHoldSource?.classList.remove('emergency-holding');
    emergencyHoldSource=null;
  }
  function completeEmergencyHold(){
    const source=emergencyHoldSource;
    emergencyHoldTimer=null;
    source?.classList.remove('emergency-holding');
    emergencyHoldSource=null;
    setScreen('emergency');
    const panel=$('#emergencyCallConfirm');
    const slider=$('#emergencyCallSlider');
    const status=$('#emergencyCallStatus');
    if(panel)panel.hidden=false;
    if(slider)slider.value='0';
    if(status){
      status.className='answer red';
      status.textContent='Slide all the way to the right only when you intend to call 000.';
    }
    evidence('emergency_hold_completed',{holdSeconds:3,callNotAutomatic:true});
    panel?.scrollIntoView?.({block:'start'});
    slider?.focus();
  }
  function beginEmergencyHold(button){
    cancelEmergencyHold();
    emergencyHoldSource=button;
    button.classList.add('emergency-holding');
    emergencyHoldTimer=setTimeout(completeEmergencyHold,3000);
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
    document.body.classList.toggle('accessibility-emergency-mode',state.accessibility.emergencyVisualMode);
    if($('#reducedMotion')) $('#reducedMotion').checked=state.accessibility.reducedMotion;
    if($('#largeText')) $('#largeText').checked=state.accessibility.largeText;
    if($('#highContrast')) $('#highContrast').checked=state.accessibility.highContrast;
    const form=$('#communicationPreferencesForm');
    if(form){
      Object.keys(state.accessibility).forEach(key=>{
        if(form.elements[key] && form.elements[key].type==='checkbox') form.elements[key].checked=Boolean(state.accessibility[key]);
      });
    }
    const status=$('#communicationPreferenceStatus');
    if(status){
      const selected=[
        state.accessibility.usesAuslan&&'uses Auslan',
        state.accessibility.deafOrHardOfHearing&&'Deaf or hard of hearing',
        state.accessibility.learningAuslan&&'learning Auslan',
        state.accessibility.communicateSigning&&'signing',
        state.accessibility.communicateTyping&&'typing',
        state.accessibility.communicateCards&&'visual cards',
        state.accessibility.visualAttention&&'visual attention requested',
        state.accessibility.dogVisualCommands&&'dog uses visual commands'
      ].filter(Boolean);
      status.className=`answer ${state.accessibility.shareCommunicationPreferences?'amber':'green'}`;
      status.innerHTML=state.accessibility.shareCommunicationPreferences
        ? `<b>Public sharing is on by your choice.</b><br>${selected.length?safe(selected.join(' · ')):'No communication preferences selected.'}`
        : '<b>Private by default.</b><br>No communication information is publicly shared.';
    }
  }
  function showCommunicationCard(message){
    const display=$('#communicationDisplay'),text=$('#communicationDisplayText');
    if(!display||!text)return;
    text.textContent=String(message||'').trim();
    display.hidden=false;
    display.scrollIntoView?.({behavior:state.accessibility.reducedMotion?'auto':'smooth',block:'center'});
  }
  function stopAccessibilityEmergency(){
    state.accessibility.emergencyVisualMode=false;
    saveState();
    renderAccessibility();
    if(navigator.vibrate) navigator.vibrate(0);
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
    const snapshot=$('#snapshot'); if(snapshot) snapshot.innerHTML=`<div class="grid two"><div class="stat"><b>${safe(park.name)}</b>${safe(park.suburb)}</div><div class="stat"><b>${checkins.length} voluntary check-in${checkins.length===1?'':'s'} · ${owners} participating owner${owners===1?'':'s'}</b>${spaces} estimated spaces based only on reported data</div><div class="stat"><b>${crowd}% gate/crowd risk</b>${needs} dog${needs===1?'':'s'} currently need space</div><div class="stat"><b>${heat??'—'}% heat · ${interaction??'—'}% interaction</b>Run checks when conditions change</div></div>`;
    const duty=$('#todayOwnerDuty'); if(duty){ const mine=checkins.filter(c=>c.sessionOwner==='local-owner'); duty.innerHTML=mine.length?mine.map(c=>{const age=Math.max(0,Math.round((Date.now()-new Date(c.lastSupervision||c.time).getTime())/60000));const dog=dogById(c.dogId);return `<div class="stat"><b>${safe(dog?.name||'Dog')}</b>${age} min since supervision confirmation</div>`;}).join(''):'<div class="empty">No local dog is checked in.</div>'; }
    renderEvidenceCount();
  }
  function renderDocumentReminders(){
    const dog=dogById($('#departureForm select[name="dog"]')?.value)||state.dogs[0]; const el=$('#documentReminders'); if(!el||!dog)return;
    const fields=[['Registration',dog.registrationExpiry],['Vaccination',dog.vaccinationDue],['Flea/tick',dog.fleaTickDue],['Medication review',dog.medicationDue],['Pet insurance (owner-only)',dog.insuranceExpiry]];
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
  function renderParkMap(){
    const park=selectedPark(),frame=$('#parkMapFrame');
    if(!park||!frame)return;
    const title=$('#parkMapTitle'),locationText=$('#parkMapLocation'),status=$('#parkMapStatus');
    if(title)title.textContent=park.name;
    if(locationText)locationText.textContent=`${park.address||park.suburb} · ${park.size}`;
    frame.title=`Interactive map of ${park.name}`;
    if($('#park-search')?.classList.contains('active')&&frame.dataset.parkId!==park.id){
      frame.dataset.parkId=park.id;
      frame.src=openStreetMapEmbedUrl(park);
    }
    const directions=$('#selectedParkDirections');
    if(directions){directions.href=directionsUrl(park);directions.setAttribute('aria-label',`Open Google directions to ${park.name}`);}
    const fullMap=$('#selectedParkFullMap');
    if(fullMap){fullMap.href=openStreetMapUrl(park);fullMap.setAttribute('aria-label',`Open a full map of ${park.name}`);}
    const query=$('#parkFilterForm')?.elements.query.value||'';
    const stateCode=$('#parkFilterForm')?.elements.state.value||'';
    const stateNames={ACT:'Australian Capital Territory',NSW:'New South Wales',NT:'Northern Territory',QLD:'Queensland',SA:'South Australia',TAS:'Tasmania',VIC:'Victoria',WA:'Western Australia'};
    const searchPlace=[query.trim(),stateNames[stateCode]||''].filter(Boolean).join(' ');
    const nationalSearch=$('#australiaParkSearch');
    if(nationalSearch){
      nationalSearch.href=australiaParkSearchUrl(searchPlace);
      nationalSearch.textContent=searchPlace?`Search “${searchPlace}” across Australia`:'Search all Australia';
    }
    if(status)status.innerHTML=`<b>Showing ${safe(park.name)} · official-source record checked ${safe(park.verifiedAt)}.</b> ${safe(park.coordinateStatus)}. Choose “Show on map” beside another listed park to move the map.`;
  }
  function renderParks(){
    const form=$('#parkFilterForm'); const query=String(form?.elements.query.value||'').toLowerCase(); const stateCode=form?.elements.state.value||''; const selected=$$('#parkNeedControls input:checked').map(i=>i.value);
    const matches=parks.filter(p=>{const hay=`${p.name} ${p.suburb} ${p.address||''} ${p.state||''} ${p.features.join(' ')}`.toLowerCase();return(!stateCode||p.state===stateCode)&&(!query||hay.includes(query))&&selected.every(n=>p.features.includes(n));});
    if(matches.length&&(stateCode||query||selected.length)&&!matches.some(p=>p.id===state.selectedParkId)){state.selectedParkId=matches[0].id;saveState();}
    const el=$('#parkList'); if(!el)return; el.innerHTML=matches.length?matches.map(p=>{const count=currentCheckins(p.id).length;const risk=gateRisk(p.id);const band=Logic.riskBand(risk);return `<article class="park-card"><h3>${safe(p.name)}</h3><p>${safe(p.address||p.suburb)} · ${safe(p.size)} · ${count} voluntary check-in${count===1?'':'s'} · working guide ${p.capacity}</p><div class="answer green"><b>✓ Official council/government source</b><br>${safe(p.sourceAuthority)} · checked ${safe(p.verifiedAt)}</div><div class="chips">${p.features.map(f=>`<span class="chip">${safe(f)}</span>`).join('')}</div><p>${safe(p.verifiedSummary)}</p><p class="muted">${safe(p.warning)}</p><div class="answer ${band.level}"><b>${risk}% current crowd/gate risk</b></div><div class="button-row compact"><button data-map-park="${p.id}">Show on map</button><button data-view-park="${p.id}">Park details</button><button data-live-park="${p.id}">Live state</button><button data-route-park="${p.id}" class="secondary">Plan journey</button><a class="button-link secondary-link" href="${safe(p.officialUrl)}" target="_blank" rel="noopener">Official source</a></div></article>`;}).join(''):`<div class="empty">No verified starter record matches all selected needs. Clear one or more filters, or use the Australia-wide map search above for ${safe(stateCode||query||'your destination')}.</div>`;
  }
  function renderParkDetails(){
    const p=selectedPark(); $('#parkDetailsTitle').textContent=p.name; const count=currentCheckins(p.id).length;
    $('#parkDetailsBody').innerHTML=`<section class="grid four"><div class="stat"><b>${safe(p.size)}</b>Park/area type</div><div class="stat"><b>${p.features.includes('Double gate')?'Double gate':p.features.includes('Fenced')?'Fenced':'Signed off-leash area'}</b>Published entry/area type</div><div class="stat"><b>${p.features.includes('Water bowl')?'Water listed':'Bring water'}</b>Verify on arrival</div><div class="stat"><b>${p.features.includes('Shade')?'Shade listed':'Limited/unverified shade'}</b>Check time of day</div></section><section class="grid two"><article class="card"><h2>Verified official information</h2><div class="record-card green"><b>${safe(p.sourceAuthority)} · checked ${safe(p.verifiedAt)}</b><p>${safe(p.verifiedSummary)}</p></div><div class="record-card yellow"><b>Published rules and cautions</b><p>${safe(p.rulesNote)}</p></div><div class="record-card yellow"><b>Map-point status</b><p>${safe(p.coordinateStatus)}. Confirm the signed entrance on arrival.</p></div><a class="button-link secondary-link" href="${safe(p.officialUrl)}" target="_blank" rel="noopener">Open official source</a></article><article class="card"><h2>GENEVIEVE community layer</h2><div class="stat"><b>${count} voluntary check-in${count===1?'':'s'}</b>${Math.max(0,p.capacity-count)} spaces against the GENEVIEVE working guide · not an official council limit</div><p class="muted">${safe(p.warning)}</p><div class="button-row"><button data-go="live-park">Open live state</button><a class="button-link secondary-link" href="${directionsUrl(p)}" target="_blank" rel="noopener">Directions</a></div></article></section>`;
  }
  function renderLivePark(){
    const p=selectedPark(),items=currentCheckins(p.id),owners=new Set(items.map(c=>c.sessionOwner||c.ownerKey||'local-owner')).size,needs=items.filter(c=>c.needsSpace||c.status==='needs-space').length,spaces=Math.max(0,p.capacity-items.length);
    $('#liveParkStats').innerHTML=`<div class="stat"><b>${items.length} voluntary check-in${items.length===1?'':'s'}</b>${Logic.round(items.length/p.capacity*100)}% of working capacity based only on reported data</div><div class="stat"><b>${owners} participating owner${owners===1?'':'s'}</b>${items.filter(c=>supervisionAge(c)>10).length} voluntary supervision reminder${items.filter(c=>supervisionAge(c)>10).length===1?'':'s'} due</div><div class="stat"><b>${spaces} estimated spaces</b>Not an official or complete capacity figure</div><div class="stat"><b>${needs} reported need-space state${needs===1?'':'s'}</b>Anonymous voluntary layer</div>`;
    const counts={};items.forEach(c=>counts[c.status]=(counts[c.status]||0)+1);$('#behaviourMix').innerHTML=Object.entries(counts).length?Object.entries(counts).map(([k,v])=>`<span class="chip">${safe(k)} ${v}</span>`).join(''):'<div class="empty">No voluntary check-ins are active on this device.</div>';
    const alerts=[];const g=gateRisk(p.id);if(g>=25)alerts.push(riskHtml(Logic.riskBand(g),'Gate'));const hazards=state.hazards.filter(h=>h.parkId===p.id);hazards.slice(0,3).forEach(h=>alerts.push(recordCard(h.type,h.details,Logic.riskBand(h.riskScore).level)));const notices=activeNotices(p.id);notices.forEach(n=>alerts.push(recordCard(n.title,n.details,'yellow')));$('#liveParkAlerts').innerHTML=alerts.join('')||'<div class="answer green"><b>No local alerts recorded.</b><br>Still check the park directly.</div>';
  }
  function renderBeaches(){
    const form=$('#beachFilterForm');const location=String(form?.elements.location.value||'').toLowerCase();const type=form?.elements.type.value||'';const results=parks.filter(p=>p.features.includes('Beach')&&(!location||`${p.name} ${p.suburb}`.toLowerCase().includes(location)||location.includes('gold coast'))&&(!type||p.beachType===type));
    $('#beachResults').innerHTML=results.length?results.map(p=>`<article class="park-card"><h3>${safe(p.name)}</h3><p>${safe(p.suburb)} · ${safe(p.beachType||'rules unverified')}</p><p>${safe(p.warning)}</p><div class="button-row"><button data-view-park="${p.id}">Details</button><a class="button-link secondary-link" href="${directionsUrl(p)}" target="_blank" rel="noopener">Map</a></div></article>`).join(''):'<div class="empty">No verified beach record is in this starter set yet. Use the Australia-wide map search and confirm the official council rules before travel.</div>';
  }

  function renderDogs(){
    const el=$('#dogList'); if(!el)return;
    el.innerHTML=state.dogs.length?state.dogs.map(d=>{const guide=Logic.dogProfileGuide(d);return `<article class="dog-card score-card ${guide.level}"><div class="dog-card-heading"><div><h3>${safe(d.name)}</h3><p>${safe(d.lifeStage||'adult')} · ${safe(d.breed||'')}</p></div><span class="dog-score-badge ${guide.level}">${guide.score}/10<br><small>${safe(guide.level)}</small></span></div><p>${safe(d.publicNote||'Ask owner before approach')}</p>${dogStatusMarkup(d)}<div class="score-components"><span>Sociability <b>${guide.components.sociability}/10</b></span><span>Reactivity <b>${guide.components.calmResponse}/10 calm-response</b></span><span>Energy <b>${guide.components.energy}/10</b></span></div><div class="answer ${guide.level}"><b>${safe(guide.label)}</b><br>${safe(guide.action)}</div><p class="muted">Profile guidance only. Current behaviour and environment override any saved score.</p><div class="button-row compact"><button data-profile-dog="${d.id}">Open profile</button><button data-edit-dog="${d.id}" class="secondary">Edit</button>${d.id!=='mr-gruff'?`<button data-delete-dog="${d.id}" class="danger">Delete</button>`:''}</div></article>`;}).join(''):'<div class="empty">No dog profiles saved.</div>';
  }
  function renderDogProfile(id){
    const dog=dogById(id)||state.dogs[0]; if(!dog)return; state.selectedDogId=dog.id; $('#dogProfileTitle').textContent=`${dog.name}${dog.dob?` · born ${fmtDate(dog.dob)}`:''}`;
    const current=state.checkins.find(c=>c.dogId===dog.id); const dimensions=Logic.dims.map(k=>`<div class="stat"><b>${safe(k.replace(/([A-Z])/g,' $1'))}</b>${Number(dog[k])||0}/10</div>`).join('');
    const guide=Logic.dogProfileGuide(dog);
    $('#dogProfileBody').innerHTML=`<section class="card dog-profile-score ${guide.level}"><div class="dog-card-heading"><div><p class="eyebrow">PROFILE COLOUR GUIDE</p><h2>${guide.score}/10 · ${safe(guide.label)}</h2></div><span class="dog-score-badge ${guide.level}">${guide.score}/10</span></div><p>${safe(guide.action)}</p><p class="muted">Average of sociability, inverse reactivity and energy manageability. Guidance only — not a diagnosis, prediction or safety guarantee.</p></section><section class="grid three"><article class="card"><h2>Public safety view</h2><p><b>${safe(dog.publicNote||'Ask owner before approach')}</b></p><p>${safe(dog.notes||'No public needs recorded.')}</p>${dogStatusMarkup(dog)}<div class="chips"><span class="chip">${safe(current?.status||'not checked in')}</span>${current?.needsSpace?'<span class="chip">needs space</span>':''}${current?.onLead?'<span class="chip">on lead</span>':''}${current?.training?'<span class="chip">in training</span>':''}</div></article><article class="card field-panel"><h2>Behavioural profile</h2><div class="grid two">${dimensions}</div></article><article class="card warning-card"><h2>Restricted emergency</h2><p><b>Microchip:</b> ${safe(dog.microchip||'Not entered')}<br><b>Weight:</b> ${safe(dog.weight||'Not entered')}<br><b>Medical:</b> ${safe(dog.medical||'Not entered')}<br><b>Vet:</b> ${safe(dog.vet||'Not entered')}<br><b>Emergency contact:</b> ${safe(dog.emergencyContact||'Not entered')}<br><b>Support need:</b> ${safe(supportNeedLabels[dog.supportNeeds]||'None recorded')} ${dog.supportNote?`— ${safe(dog.supportNote)}`:''}<br><b>Insurance expiry:</b> ${safe(dog.insuranceExpiry?fmtDate(dog.insuranceExpiry):'Not entered')}</p><p class="muted">Visible only to the owner in this web build. Production responder access must be justified and audited.</p></article></section><section class="card"><h2>Owner controls</h2><div class="chips"><span class="chip">Public name</span><span class="chip">Hide exact location</span><span class="chip">Incognito</span><span class="chip">Needs space</span><span class="chip">On lead</span><span class="chip">In training</span><span class="chip">Export history</span></div></section>`;
  }
  function supervisionAge(checkin){ return Math.max(0,Math.round((Date.now()-new Date(checkin.lastSupervision||checkin.time).getTime())/60000)); }
  function renderCheckins(){
    pruneExpiredCheckins();
    const el=$('#checkinList');if(!el)return;
    const active=state.checkins;
    el.innerHTML=active.length?active.map(c=>{const d=dogById(c.dogId),p=parkById(c.parkId),expiry=c.expiresAt?fmtTime(c.expiresAt):'not set';return `<article class="record-card ${c.needsSpace||c.status==='reactive'?'amber':'green'}"><b>${safe(d?.name||'Dog')} at ${safe(p.name)}</b><p>${safe(c.status)} · voluntarily checked in ${fmtTime(c.time)} · auto-expires ${safe(expiry)}</p><div class="chips"><span class="chip">voluntary</span>${c.incognito?'<span class="chip">incognito</span>':''}${c.needsSpace?'<span class="chip">needs space</span>':''}${c.onLead?'<span class="chip">on lead</span>':''}${c.training?'<span class="chip">in training</span>':''}${d?.reproductiveStatus==='on-heat'?'<span class="chip alert-chip">on heat — keep separated</span>':''}${supportNeedLabels[d?.supportNeeds]?`<span class="chip">${safe(supportNeedLabels[d.supportNeeds])}</span>`:''}</div><div class="button-row compact"><button data-confirm-supervision="${c.id}">Still supervising</button><button data-checkout="${c.id}" class="secondary">Voluntarily check out</button></div></article>`;}).join(''):'<div class="empty">No voluntary check-ins are active on this device.</div>';
    renderToday();renderLivePark();renderOwnerDuty();
  }
  function renderOwnerDuty(){
    const list=$('#ownerDutyList');if(list){const mine=state.checkins.filter(c=>c.sessionOwner==='local-owner');list.innerHTML=mine.length?mine.map(c=>{const dog=dogById(c.dogId),age=supervisionAge(c),band=Logic.riskBand(age>=20?80:age>=12?55:age>=8?30:10);return `<article class="record-card ${band.level}"><b>${safe(dog?.name||'Dog')}</b><p>${age} min since confirmation</p><button data-confirm-supervision="${c.id}">I’m still supervising</button></article>`;}).join(''):'<div class="empty">No local dog is checked in.</div>';}
    const reports=$('#unattendedReports');if(reports)reports.innerHTML=state.supervisionReports.length?state.supervisionReports.map(r=>recordCard(`${r.description} · ${parkById(r.parkId).name}`,`${r.ownerLocation}: ${r.concern}`,r.status==='resolved'?'green':'red',r.status==='resolved'?'':`<button data-resolve-unattended="${r.id}">Mark resolved</button>`)).join(''):'<div class="empty">No unattended-dog reports.</div>';
  }
  function renderAffinity(){
    const el=$('#affinityList');if(el)el.innerHTML=state.affinities.length?state.affinities.map(a=>{const from=dogById(a.fromDogId)?.name,to=dogById(a.toDogId)?.name,p=parkById(a.parkId);return `<article class="affinity-card"><b>${safe(from)} → ${safe(to)}</b><p>${safe(a.mode)} · ${safe(a.status)} · ${safe(p.name)}</p>${a.status!=='active'?`<button data-accept-affinity="${a.id}">Record reciprocal consent</button>`:''}<label>Private removal reason <select data-removal-reason="${a.id}"><option value="owner_preference">Owner preference</option><option value="incompatible_play">Incompatible play</option><option value="reactivity">Reactivity</option><option value="resource_guarding">Resource guarding</option><option value="stress">Stress</option></select></label><button data-remove-affinity="${a.id}" class="danger">Remove relationship</button></article>`;}).join(''):'<div class="empty">No best-mate relationships saved.</div>';
  }
  function renderPredictionSelect(){ const select=$('#outcomeForm select[name="prediction"]');if(select)select.innerHTML=state.predictions.slice(0,50).map(p=>`<option value="${p.id}">${safe(dogById(p.dogAId)?.name)} + ${safe(dogById(p.dogBId)?.name)} · ${p.riskScore}%</option>`).join('')||'<option value="">Run a prediction first</option>'; }
  function predictionHtml(p){ const a=dogById(p.dogAId),b=dogById(p.dogBId),band=Logic.riskBand(p.riskScore),pair=Logic.guidanceBand10(Math.max(0,10-p.riskScore/10)),ga=Logic.dogProfileGuide(a||{}),gb=Logic.dogProfileGuide(b||{}),statusWarning=(a?.reproductiveStatus==='on-heat'||b?.reproductiveStatus==='on-heat')?'<div class="answer red"><b>Owner-declared on-heat status.</b><br>Do not proceed with an off-leash introduction. Keep separated and check current local rules.</div>':'';return `<article class="prediction-card pair-score-card ${pair.level}"><h3>${safe(a?.name||'Dog')} + ${safe(b?.name||'Dog')}</h3><div class="dog-pair-colours"><span class="dog-score-badge ${ga.level}">${safe(a?.name||'Dog')}<br><b>${ga.score}/10</b></span><span class="pair-arrow" aria-hidden="true">↔</span><span class="dog-score-badge ${gb.level}">${safe(b?.name||'Dog')}<br><b>${gb.score}/10</b></span></div><div class="answer ${pair.level}"><b>Pair guidance ${pair.score}/10 — ${safe(pair.label)}</b><br>${safe(pair.action)}</div>${statusWarning}${riskHtml({...band,reasons:p.reasons})}<p class="muted">${safe(parkById(p.parkId).name)} · guidance only · model ${safe(p.modelVersion)}. A favourable colour never guarantees compatibility.</p></article>`; }
  function renderHeatHistory(){ const el=$('#heatHistory');if(el)el.innerHTML=state.heatChecks.slice(0,8).map(h=>recordCard(`${dogById(h.dogId)?.name||'Dog'} · ${h.riskScore}%`,`${parkById(h.parkId).name} · ${fmtTime(h.time)}`,Logic.riskBand(h.riskScore).level)).join('')||'<div class="empty">No heat checks saved.</div>'; }
  function renderHazards(){ const el=$('#hazardList');if(el)el.innerHTML=state.hazards.filter(h=>h.parkId===state.selectedParkId).map(h=>recordCard(h.type,`${h.details} · ${fmtTime(h.time)}`,Logic.riskBand(h.riskScore).level)).join('')||'<div class="empty">No local hazard reports for the selected park.</div>'; }
  function renderLostFound(){ const el=$('#lostFoundList');if(el)el.innerHTML=state.lostFound.map(r=>recordCard(`${r.type.toUpperCase()} · ${r.description}`,`${r.location} · ${r.contact||'No public contact note'} · ${fmtTime(r.time)}`,r.urgency==='danger'?'red':r.urgency==='urgent'?'amber':'yellow')).join('')||'<div class="empty">No lost/found records.</div>'; }
  function renderIncidents(){ const el=$('#incidentList');if(el)el.innerHTML=state.incidents.map(r=>recordCard(`${r.type} · ${parkById(r.parkId).name}`,`${r.details} · ${fmtTime(r.time)}`,Logic.riskBand(r.severity).level)).join('')||'<div class="empty">No incident records.</div>'; }
  function activeNotices(parkId){ const t=Date.now();return state.notices.filter(n=>n.parkId===parkId&&(!n.expires||new Date(n.expires).getTime()>t)); }
  function renderNotices(){ const el=$('#noticeList');if(el){const all=state.notices.filter(n=>!n.expires||new Date(n.expires)>new Date());el.innerHTML=all.length?all.map(n=>recordCard(`${n.verified?'Verified':'Local draft'} · ${n.title}`,`${parkById(n.parkId).name}: ${n.details}${n.expires?` · expires ${fmtTime(n.expires)}`:''}`,'yellow')).join(''):'<div class="empty">No active notices.</div>';}}
  function renderMaintenance(){ const el=$('#maintenanceList');if(el)el.innerHTML=state.maintenance.map(m=>recordCard(`${m.facility} · ${parkById(m.parkId).name}`,`${m.task} · ${m.status}`,m.priority,m.status==='closed'?'':`<button data-close-maintenance="${m.id}">Mark complete</button>`)).join('')||'<div class="empty">No maintenance tasks.</div>'; }
  function renderSuperintendent(){
    const openMaintenance=state.maintenance.filter(m=>m.status!=='closed'),active=state.notices.filter(n=>!n.expires||new Date(n.expires)>new Date()),redIncidents=state.incidents.filter(i=>Number(i.severity)>=75),p=selectedPark();
    $('#superStats').innerHTML=`<div class="stat"><b>${openMaintenance.length} open task${openMaintenance.length===1?'':'s'}</b>Maintenance queue</div><div class="stat"><b>${active.length} active notice${active.length===1?'':'s'}</b>Publicly displayed</div><div class="stat"><b>${Logic.round(currentCheckins(p.id).length/p.capacity*100)}% capacity</b>${currentCheckins(p.id).length} voluntary records at ${safe(p.name)}</div><div class="stat"><b>${redIncidents.length} red incident${redIncidents.length===1?'':'s'}</b>Recorded locally</div>`;
    $('#superTrends').innerHTML=`<div class="chips"><span class="chip">crowding ${gateRisk(p.id)}%</span><span class="chip">needs space ${currentCheckins(p.id).filter(c=>c.needsSpace).length}</span><span class="chip">hazards ${state.hazards.filter(h=>h.parkId===p.id).length}</span><span class="chip">incidents ${state.incidents.filter(i=>i.parkId===p.id).length}</span><span class="chip">alerts acknowledged locally</span></div><p class="muted">Check-in and capacity figures are voluntary estimates, not official headcounts. No microchip numbers, medical records or owner contact details are shown in this operator view.</p>`;
    renderMaintenance();renderNotices();
  }

  function renderPrivacy(){
    const labels={discoverable:'Allow profile discoverability',livePresence:'Allow live-presence visibility',affinityAlerts:'Allow best-mate proximity alerts',recommendations:'Allow companion recommendations',learningParticipation:'Use outcomes and removal feedback for learning',preciseLocation:'Allow location only when I request current weather',showMedicalToResponder:'Allow authorised emergency responder access when production controls exist',incognitoDefault:'Use incognito by default'};
    const el=$('#privacyControls');if(el)el.innerHTML=Object.entries(labels).map(([k,v])=>`<label class="toggle"><input type="checkbox" name="${k}" ${state.privacy[k]?'checked':''}> ${safe(v)}</label>`).join('');
  }
  function notificationPermission(){
    if(!('Notification' in window))return 'unsupported';
    return Notification.permission||'default';
  }
  function notificationContextReady(){
    return window.isSecureContext||['localhost','127.0.0.1'].includes(location.hostname);
  }
  function installedWebApp(){
    return Boolean(window.matchMedia?.('(display-mode: standalone)').matches||navigator.standalone);
  }
  function notificationPlatform(){
    return NotifyLogic?.detectPlatform?.(navigator.userAgent,navigator.platform,navigator.maxTouchPoints)||'This device';
  }
  function roleCanReceive(audiences){
    return NotifyLogic?.roleCanReceive?.(state.currentRole,audiences)!==false;
  }
  function updateAppBadge(){
    const unread=(Number(state.notificationUnread)||0)+(Number(state.inAppUnread)||0);
    if(unread>0&&'setAppBadge' in navigator)navigator.setAppBadge(unread).catch(()=>{});
    else if(unread===0&&'clearAppBadge' in navigator)navigator.clearAppBadge().catch(()=>{});
  }
  function setNotificationAction(message,level='yellow'){
    const el=$('#notificationActionStatus');
    if(!el)return;
    el.className=`answer ${level}`;
    el.innerHTML=`<b>${safe(message)}</b>`;
  }
  function renderNotificationHistory(){
    const el=$('#notificationHistory');
    if(!el)return;
    const history=Array.isArray(state.notificationHistory)?state.notificationHistory:[];
    el.innerHTML=history.length?history.slice(0,20).map(item=>recordCard(
      item.title,
      `${item.body} · ${fmtTime(item.deliveredAt)}`,
      item.priority==='critical'?'red':'green'
    )).join(''):'<div class="empty">No device notifications have been delivered yet.</div>';
  }
  function renderInAppAlerts(){
    const el=$('#inAppAlertHistory');
    if(!el)return;
    const alerts=Array.isArray(state.inAppAlerts)?state.inAppAlerts:[];
    el.innerHTML=alerts.length?alerts.slice(0,25).map(item=>recordCard(
      item.title,
      `${item.body} · ${safe(item.roleLabel||item.role||'all people')} · ${fmtTime(item.createdAt)}`,
      item.priority==='critical'?'red':item.priority==='urgent'?'amber':'yellow'
    )).join(''):'<div class="empty">No eligible safety alerts are waiting in this app.</div>';
  }
  function recordInAppAlert({key,category,title,body,url,critical=false}){
    if(!Array.isArray(state.inAppAlerts))state.inAppAlerts=[];
    const existing=state.inAppAlerts.find(item=>item.key===key);
    if(existing){
      existing.lastCheckedAt=now();
      return{created:false,item:existing};
    }
    const roleNames={owner:'Dog Owner',visitor:'Park Visitor',worker:'Park Worker / Contractor',superintendent:'Park Superintendent',responder:'Authorised Responder',admin:'System Administrator'};
    const item={id:uid('inapp'),key,category,title,body,url,priority:critical?'critical':'standard',role:state.currentRole,roleLabel:roleNames[state.currentRole]||state.currentRole,createdAt:now()};
    state.inAppAlerts.unshift(item);
    state.inAppAlerts=state.inAppAlerts.slice(0,75);
    state.inAppUnread=(Number(state.inAppUnread)||0)+1;
    saveState();
    updateAppBadge();
    renderInAppAlerts();
    return{created:true,item};
  }
  function clearInAppAlerts(){
    state.inAppAlerts=[];
    state.inAppUnread=0;
    evidence('in_app_alerts_acknowledged');
    updateAppBadge();
    renderInAppAlerts();
    setNotificationAction('In-app safety alerts acknowledged and cleared on this device.','green');
  }
  function renderNotificationPlatform(){
    const el=$('#notificationPlatformStatus'),install=$('#installNotificationApp');
    if(!el)return;
    const platform=notificationPlatform(),secure=notificationContextReady(),serviceWorker='serviceWorker' in navigator,notifications=notificationPermission()!=='unsupported';
    const push='PushManager' in window,badge='setAppBadge' in navigator,vibration='vibrate' in navigator,installed=installedWebApp();
    const layer=NotifyLogic?.deliveryLayer?.({secureContext:secure,notifications,serviceWorker})||'in-app-only';
    el.innerHTML=[
      `<div class="stat"><b>${safe(platform)}</b>${installed?'Installed app mode':'Browser mode'}</div>`,
      `<div class="stat"><b>${layer==='system-and-in-app'?'Two alert layers':'In-app fallback active'}</b>${layer==='system-and-in-app'?'System notifications plus the in-app safety inbox':'The safety inbox remains available even without system interruption'}</div>`,
      `<div class="chips"><span class="chip">${secure?'secure HTTPS':'HTTPS required'}</span><span class="chip">${serviceWorker?'service worker ready':'no service worker'}</span><span class="chip">${push?'push-capable browser':'remote push unavailable'}</span><span class="chip">${vibration?'vibration supported':'visual/text only'}</span><span class="chip">${badge?'app badge supported':'in-app count only'}</span></div>`,
      `<p class="muted">Active role: ${safe(state.currentRole)}. Alerts are filtered for this role and never expose private owner or medical details to a worker view.</p>`
    ].join('');
    if(install){
      install.hidden=!installPromptEvent;
      install.disabled=!installPromptEvent;
    }
  }
  function renderNotificationPermission(){
    const status=$('#notificationPermissionStatus'),enable=$('#enableNotifications'),test=$('#testNotification'),check=$('#checkNotifications');
    if(!status)return;
    const permission=notificationPermission(),platform=notificationPlatform();
    let level='yellow',message='';
    if(permission==='unsupported'){
      message=`${platform} cannot show GENEVIEVE system notifications in this browser. The in-app safety inbox still works; use a current supported browser or installed app for system alerts.`;
    }else if(!notificationContextReady()){
      message='System notifications require the secure published app (HTTPS). The in-app safety inbox still works on this page.';
    }else if(permission==='granted'){
      level='green';
      message=`System notifications are enabled on ${platform}. The in-app safety inbox remains as a second alert layer.`;
    }else if(permission==='denied'){
      level='red';
      message=`System notifications are blocked in ${platform} settings. Re-enable GENEVIEVE there; safety alerts will still remain in the in-app inbox.`;
    }else{
      message=platform==='iPhone / iPad'&&!installedWebApp()
        ? 'Add GENEVIEVE to the Home Screen first, open the installed app, then tap Enable device notifications.'
        : platform==='Android'
        ? 'Android system notifications are off. Tap Enable, then allow GENEVIEVE in the Android notification prompt and device settings.'
        : 'System notifications are off. Tap Enable device notifications to make a clear permission choice.';
    }
    status.className=`answer ${level}`;
    status.innerHTML=`<b>${safe(message)}</b>`;
    if(enable){
      enable.disabled=permission==='granted'||permission==='denied'||permission==='unsupported'||!notificationContextReady();
      enable.textContent=permission==='granted'?'Device notifications enabled':'Enable device notifications';
    }
    if(test)test.disabled=false;
    if(check)check.disabled=false;
  }
  async function notificationRegistration(){
    if(!('serviceWorker' in navigator))return null;
    let registration=await navigator.serviceWorker.getRegistration?.();
    if(!registration)registration=await navigator.serviceWorker.register('./service-worker.js?v=20260731.40',{updateViaCache:'none'});
    return registration;
  }
  async function showDeviceNotification({
    key,category,title,body,url='#notifications',critical=false,cooldownMinutes=60,
    bypassQuiet=false,bypassCooldown=false,bypassCategory=false,audiences=ALL_NOTIFICATION_ROLES
  }){
    if(!roleCanReceive(audiences))return{delivered:false,inApp:false,reason:'role'};
    if(!bypassCategory&&!state.notifications[category])return{delivered:false,inApp:false,reason:'category-off'};
    const inApp=recordInAppAlert({key,category,title,body,url,critical}).created;
    const quiet=NotifyLogic?.isQuietHours?.(new Date(),state.notifications.quietStart,state.notifications.quietEnd);
    const canBypass=critical&&state.notifications.emergency;
    if(quiet&&!bypassQuiet&&!canBypass)return{delivered:false,inApp,reason:'quiet-hours'};
    if(!bypassCooldown&&!NotifyLogic?.cooldownReady?.(state.notificationCooldowns[key],Date.now(),cooldownMinutes))return{delivered:false,inApp,reason:'cooldown'};
    if(notificationPermission()!=='granted')return{delivered:false,inApp,reason:'permission'};
    const locationUrl=new URL(url,location.href).href;
    const options={
      body,
      icon:new URL('./assets/ga-master-app-icon-192-v35.png',location.href).href,
      badge:new URL('./assets/ga-master-icon-64-v35.png',location.href).href,
      tag:`genevieve-${key}`,
      renotify:Boolean(critical),
      requireInteraction:Boolean(critical),
      vibrate:critical?[500,200,500,200,700]:[250,100,250],
      lang:'en-AU',
      timestamp:Date.now(),
      data:{url:locationUrl,category,key,priority:critical?'critical':'standard',role:state.currentRole}
    };
    if(Number(Notification.maxActions||0)>0)options.actions=critical
      ?[{action:'open',title:'Open alert'},{action:'emergency',title:'Emergency help'}]
      :[{action:'open',title:'Open GENEVIEVE'}];
    try{
      const registration=await notificationRegistration();
      if(registration?.showNotification)await registration.showNotification(title,options);
      else if('Notification' in window)new Notification(title,options);
      else throw new Error('No notification delivery method is available.');
      const deliveredAt=now();
      state.notificationCooldowns[key]=deliveredAt;
      state.notificationHistory.unshift({id:uid('notify'),key,category,title,body,priority:critical?'critical':'standard',deliveredAt});
      state.notificationHistory=state.notificationHistory.slice(0,50);
      state.notificationUnread=(Number(state.notificationUnread)||0)+1;
      saveState();
      updateAppBadge();
      renderNotificationHistory();
      return{delivered:true,inApp};
    }catch(error){
      console.warn('GENEVIEVE notification could not be delivered.',error);
      return{delivered:false,inApp,reason:'delivery',error};
    }
  }
  function notificationLocation(park){
    return NotifyLogic?.locationLabel?.(park,state.notifications.locationDetail)||'';
  }
  async function runNotificationChecks({manual=false}={}){
    const alerts=[],park=selectedPark(),locationText=notificationLocation(park),today=new Date().toISOString().slice(0,10);
    if(state.notifications.documents){
      const documentFields=[['registration', 'Registration', 'registrationExpiry'],['vaccination','Vaccination','vaccinationDue'],['flea-tick','Flea/tick','fleaTickDue'],['medication','Medication review','medicationDue']];
      state.dogs.forEach(dog=>documentFields.forEach(([code,label,field])=>{
        const days=NotifyLogic?.daysUntil?.(dog[field]);
        if(days!==null&&days<=30&&days>=-365){
          alerts.push({
            key:`document:${dog.id}:${code}:${dog[field]}`,category:'documents',
            title:`${label} ${days<0?'overdue':'reminder'} — ${dog.name}`,
            body:days<0?`${label} was due ${Math.abs(days)} day${Math.abs(days)===1?'':'s'} ago.`:days===0?`${label} is due today.`:`${label} is due in ${days} day${days===1?'':'s'}.`,
            url:'#dog-list',cooldownMinutes:1440,audiences:['owner','admin']
          });
        }
      }));
    }
    if(state.notifications.hazards){
      state.hazards.filter(item=>item.parkId===park.id).forEach(item=>alerts.push({
        key:`hazard:${item.id}`,category:'hazards',title:`${item.riskScore>=75?'Critical ':''}park hazard — ${item.type}`,
        body:`${item.details}${locationText?` · ${locationText}`:''}`,url:'#heat-hazards',
        critical:Number(item.riskScore)>=75,cooldownMinutes:1440,audiences:ALL_NOTIFICATION_ROLES
      }));
      activeNotices(park.id).forEach(item=>alerts.push({
        key:`notice:${item.id}`,category:'hazards',title:`Verified park notice — ${item.title}`,
        body:`${item.details}${locationText?` · ${locationText}`:''}`,url:'#notices',cooldownMinutes:1440,audiences:ALL_NOTIFICATION_ROLES
      }));
    }
    if(state.notifications.heat){
      const weather=weatherCache()[park.id],apparent=Number(weather?.apparentTemperature),uv=Number(weather?.uvIndex);
      if(Number.isFinite(apparent)&&apparent>=32)alerts.push({
        key:`weather-heat:${park.id}:${today}`,category:'heat',title:'High heat risk at the selected park',
        body:`Feels like ${Math.round(apparent)}°C${locationText?` · ${locationText}`:''}. Check shade, water and the ground before entering.`,
        url:'#heat-hazards',critical:apparent>=38,cooldownMinutes:180,audiences:ALL_NOTIFICATION_ROLES
      });
      if(Number.isFinite(uv)&&uv>=11)alerts.push({
        key:`weather-uv:${park.id}:${today}`,category:'heat',title:'Extreme UV at the selected park',
        body:`UV index ${uv.toFixed(1)}${locationText?` · ${locationText}`:''}. Limit exposure and check current conditions.`,
        url:'#heat-hazards',cooldownMinutes:180,audiences:ALL_NOTIFICATION_ROLES
      });
    }
    if(state.notifications.bestMate&&state.privacy.affinityAlerts&&state.privacy.livePresence){
      const visible=new Set(currentCheckins(park.id).filter(c=>!c.incognito).map(c=>c.dogId));
      state.affinities.filter(a=>a.parkId===park.id&&a.status==='active'&&visible.has(a.toDogId)).forEach(item=>{
        const dog=dogById(item.toDogId);
        alerts.push({
          key:`best-mate:${item.id}:${park.id}`,category:'bestMate',title:`${dog?.name||'A best mate'} is at the preferred park`,
          body:`Visible voluntary check-in${locationText?` · ${locationText}`:''}. Exact position is not shown.`,
          url:'#best-mates',cooldownMinutes:60,audiences:['owner','admin']
        });
      });
    }
    if(state.notifications.emergency){
      state.lostFound.filter(item=>item.urgency!=='watch'&&Date.now()-new Date(item.time).getTime()<172800000).forEach(item=>alerts.push({
        key:`lost-found:${item.id}`,category:'emergency',title:`${item.urgency==='danger'?'Critical ':'Urgent '}${item.type} dog alert`,
        body:`${item.description} · ${item.location}`,url:'#lost-found',critical:item.urgency==='danger',cooldownMinutes:1440,audiences:ALL_NOTIFICATION_ROLES
      }));
    }
    if(state.notifications.workerTasks&&roleCanReceive(OPERATIONS_NOTIFICATION_ROLES)){
      state.maintenance.filter(item=>item.parkId===park.id&&item.status!=='closed').forEach(item=>alerts.push({
        key:`maintenance:${item.id}`,category:'workerTasks',title:`${item.priority==='red'?'Critical ':''}worker task — ${item.facility}`,
        body:`${item.task}${locationText?` · ${locationText}`:''}`,url:'#superintendent',
        critical:item.priority==='red',cooldownMinutes:720,audiences:OPERATIONS_NOTIFICATION_ROLES
      }));
      state.supervisionReports.filter(item=>item.parkId===park.id&&item.status!=='resolved').forEach(item=>alerts.push({
        key:`unattended:${item.id}`,category:'workerTasks',title:'Unattended-dog safety report',
        body:`${item.description} · ${item.concern}${locationText?` · ${locationText}`:''}`,url:'#owner-duty',
        critical:true,cooldownMinutes:720,audiences:OPERATIONS_NOTIFICATION_ROLES
      }));
    }
    if(state.notifications.incidents&&roleCanReceive(OPERATIONS_NOTIFICATION_ROLES)){
      state.incidents.filter(item=>item.parkId===park.id&&item.status!=='closed'&&Number(item.severity)>=60).forEach(item=>alerts.push({
        key:`incident:${item.id}`,category:'incidents',title:`${item.severity>=75?'Critical ':'Urgent '}incident — ${item.type}`,
        body:`${item.details}${locationText?` · ${locationText}`:''}`,url:'#incident',
        critical:item.severity>=75,cooldownMinutes:720,audiences:OPERATIONS_NOTIFICATION_ROLES
      }));
    }
    let delivered=0,inAppAdded=0;
    for(const alert of alerts){
      const result=await showDeviceNotification(alert);
      if(result.delivered)delivered+=1;
      if(result.inApp)inAppAdded+=1;
    }
    state.notifications.lastCheckedAt=now();
    saveState();
    if(manual)setNotificationAction(
      delivered||inAppAdded
        ?`${delivered} system notification${delivered===1?'':'s'} delivered; ${inAppAdded} new alert${inAppAdded===1?'':'s'} added to the universal in-app safety inbox.`
        :`No new eligible alerts for the ${state.currentRole} role. Existing alerts may be inside their duplicate-prevention period.`,
      delivered||inAppAdded?'green':'yellow'
    );
    renderNotifications();
    return{delivered,inAppAdded,checked:alerts.length};
  }
  function renderNotifications(){
    const labels={bestMate:'Best mate at preferred park — owner',heat:'Heat and weather risk — all roles',hazards:'Park closure, notice or hazard — all roles',documents:'Registration and vaccination reminders — owner',emergency:'Emergency and lost-dog alerts — all roles',incidents:'Serious incident alerts — workers and authorised teams',workerTasks:'Maintenance and unattended-dog alerts — workers and authorised teams',companion:'Prospective companion suggestions — owner'};
    const el=$('#notificationControls');if(el)el.innerHTML=Object.entries(labels).map(([k,v])=>`<label class="toggle"><input type="checkbox" name="${k}" ${state.notifications[k]?'checked':''}> ${safe(v)}</label>`).join('');
    const form=$('#notificationForm');if(form){form.elements.quietStart.value=state.notifications.quietStart||'';form.elements.quietEnd.value=state.notifications.quietEnd||'';form.elements.locationDetail.value=state.notifications.locationDetail||'park';}
    renderNotificationPermission();
    renderNotificationPlatform();
    renderNotificationHistory();
    renderInAppAlerts();
  }
  function renderPlans(){
    const currentChannel=channel();const message=$('#billingChannelMessage');if(message)message.textContent=currentChannel==='web'?'Web channel: only verified Stripe Payment Links can open.':currentChannel==='apple'?'Apple channel: premium digital subscriptions must use the native Apple purchase bridge.':'Google Play channel: premium digital subscriptions must use the native Google Play billing bridge.';
    const el=$('#planList');if(!el)return;el.innerHTML=(CFG.products||[]).map(p=>`<article class="card"><h2>${safe(p.name)}</h2><p><b>${safe(p.priceLabel)}</b> ${safe(p.periodLabel)}</p><p>${safe(p.audience)}</p><p>${safe(p.trialLabel)}</p><button data-buy="${safe(p.id)}" ${currentChannel==='web'&&!p.stripePaymentLink?'disabled':''}>${currentChannel==='web'?'Subscribe on web':'Subscribe in app'}</button>${currentChannel==='web'&&!p.stripePaymentLink?'<p class="muted">Blocked until the correct verified Stripe link is mapped.</p>':''}</article>`).join('');
  }
  function publicUrls(){ const base=(CFG.publicWebsiteUrl||'').replace(/\/$/,'');return{website:base,privacy:base?`${base}/legal/privacy-policy.html`:'',terms:base?`${base}/legal/terms-of-use.html`:'',support:base?`${base}/legal/support.html`:'',deletion:base?`${base}/legal/account-deletion.html`:'',refund:base?`${base}/legal/refund-cancellation-policy.html`:''}; }
  function renderPublicUrls(){ const urls=publicUrls();const el=$('#publicUrlList');if(el)el.innerHTML=Object.entries(urls).map(([k,v])=>`<div class="stat"><b>${safe(k)}</b>${v?`<code>${safe(v)}</code>`:'BLOCKED — enter publicWebsiteUrl in config.js'}</div>`).join(''); }
  function legalAccepted(){
    const acceptance=state.legalAcceptance||{};
    return acceptance.version===LEGAL_VERSION
      && acceptance.termsAndPrivacyAccepted===true
      && acceptance.safetyAccepted===true
      && Boolean(acceptance.acceptedAt);
  }
  function renderLegalAcceptance(){
    const el=$('#legalAcceptanceSummary');
    if(!el)return;
    const terms=$('#legalTermsAcceptance');
    const safety=$('#legalSafetyAcceptance');
    const button=$('#acceptLegal');
    if(legalAccepted()){
      el.className='answer green';
      el.innerHTML=`<b>Accepted on this device.</b><br>Legal version ${safe(LEGAL_VERSION)} · ${safe(fmtTime(state.legalAcceptance.acceptedAt))}.`;
      if(terms)terms.checked=true;
      if(safety)safety.checked=true;
      if(button){button.disabled=true;button.textContent='Acceptance saved';}
    }else{
      el.className='answer yellow';
      el.innerHTML=`<b>Acceptance required.</b><br>Review and accept legal version ${safe(LEGAL_VERSION)}. The app navigation remains available while you read each policy.`;
      if(terms)terms.checked=false;
      if(safety)safety.checked=false;
      if(button){button.disabled=true;button.textContent='Accept and continue';}
    }
  }
  function syncLegalAcceptButton(){
    const terms=$('#legalTermsAcceptance'),safety=$('#legalSafetyAcceptance'),button=$('#acceptLegal');
    if(button)button.disabled=!(terms?.checked&&safety?.checked);
  }
  function openLegalAcceptance(focusFirstBox=false){
    setScreen('legal');
    renderLegalAcceptance();
    const message=$('#legalAcceptanceMessage');
    if(message)message.textContent='Both boxes must be selected. Acceptance is recorded on this device with the legal version and time.';
    syncLegalAcceptButton();
    $('#legalAcceptancePanel')?.scrollIntoView?.({block:'start'});
    if(focusFirstBox&&!legalAccepted())$('#legalTermsAcceptance')?.focus();
  }
  function renderTripResult(plan){
    const el=$('#tripResult');if(!el)return;if(!plan){el.innerHTML='<div class="empty">Create a route plan.</div>';return;}
    const map=`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(plan.from)}&destination=${encodeURIComponent(plan.to)}&travelmode=driving`;
    el.innerHTML=`<div class="stat"><b>${safe(plan.from)} → ${safe(plan.to)}</b>${plan.needs.map(safe).join(' · ')}</div><div class="record-card green"><b>Stop pattern</b><p>Quiet fenced exercise stop with water and shade every 2–3 hours, adjusted for the dog and weather.</p></div><div class="record-card yellow"><b>Stay and emergency backup</b><p>Confirm pet-friendly accommodation, current restrictions and the nearest after-hours veterinarian before departure.</p></div><a class="button-link" href="${map}" target="_blank" rel="noopener">Open route in Maps</a>`;
  }
  function renderAloneTimer(){
    const el=$('#aloneTimerStatus');if(!el)return;if(!state.aloneTimerEnd){el.textContent='No safety timer is running.';return;}const remaining=new Date(state.aloneTimerEnd).getTime()-Date.now();if(remaining<=0){el.textContent='Timer expired. If device notifications are enabled, this phone will alert you. The timer does not contact emergency services.';el.className='answer red';return;}el.className='muted';el.textContent=`Timer running: ${Math.ceil(remaining/60000)} minutes remaining.`;
  }
  function renderLaunchResults(tests){ const el=$('#launchResults');if(el)el.innerHTML=tests.map(t=>`<div class="${t.ok?'launch-pass':t.block?'launch-block':'launch-warn'}"><b>${t.ok?'PASS':t.block?'BLOCKED':'NOT CONNECTED'} — ${safe(t.name)}</b>${t.detail?`<br>${safe(t.detail)}`:''}</div>`).join(''); }
  async function runLaunchCheck(){
    const urls=publicUrls(),currentChannel=channel();const tests=[
      {name:'Public website/domain entered',ok:Boolean(urls.website),block:true,detail:urls.website||'Add publicWebsiteUrl in config.js.'},
      {name:'Public support email entered',ok:Boolean(CFG.publicSupportEmail&&CFG.publicSupportEmail.includes('@')),block:true,detail:CFG.publicSupportEmail||'Add publicSupportEmail in config.js and the legal pages.'},
      {name:'Privacy, support and deletion URLs can be formed',ok:Boolean(urls.privacy&&urls.support&&urls.deletion),block:true},
      {name:'Current legal version actively accepted on this device',ok:legalAccepted(),block:true,detail:legalAccepted()?`Legal version ${LEGAL_VERSION} accepted ${fmtTime(state.legalAcceptance.acceptedAt)}.`:`Legal version ${LEGAL_VERSION} requires both acceptance boxes.`},
      {name:'All four subscription products exist in configuration',ok:(CFG.products||[]).length===4,block:true},
      {name:'Web Stripe links mapped',ok:currentChannel!=='web'||(CFG.products||[]).every(p=>p.stripePaymentLink),block:currentChannel==='web',detail:currentChannel==='web'?'Each product needs its verified matching Payment Link.':'Not required in native store channel.'},
      {name:'Supabase public backend configured',ok:Boolean(window.GenevieveBackend?.enabled),warn:true,detail:window.GenevieveBackend?.enabled?'Public URL and anon key present.':'Local-first mode only; no real multi-user accounts or live park data.'},
      {name:'Working device notification capability',ok:notificationPermission()!=='unsupported'&&notificationContextReady(),warn:true,detail:notificationPermission()==='granted'?'Permission granted on this device.':notificationPermission()==='denied'?'Supported, but blocked in this device’s settings.':'Supported; each owner must enable permission on their own device.'},
      {name:'Approved GA and tree logo assets installed',ok:true,detail:'The original approved files are preserved. Mobile display and install icons use the same GA pixels without distortion.'},
      {name:'Current app channel',ok:true,detail:currentChannel},
      {name:'Risk engine logic tests included',ok:true,detail:'Run npm-free Node test from tests/test-logic.js or review docs/TEST_REPORT.md.'}
    ];
    if(window.GenevieveBackend?.enabled){const health=await window.GenevieveBackend.health();tests.push({name:'Backend health check',ok:health.ok,block:true,detail:health.message});}
    renderLaunchResults(tests);evidence('launch_check',{channel:currentChannel,tests});
  }
  function renderAll(){
    pruneExpiredCheckins();
    applyRoleVisibility();renderAccessibility();refreshSelects();renderToday();renderDocumentReminders();renderDepartureNeeds();renderRoute();renderParks();renderParkMap();renderParkDetails();renderLivePark();renderBeaches();renderDogs();renderDogProfile(state.selectedDogId||state.dogs[0]?.id);renderCheckins();renderOwnerDuty();renderAffinity();renderPredictionSelect();renderHeatHistory();renderHazards();renderLostFound();renderIncidents();renderNotices();renderSuperintendent();renderPrivacy();renderNotifications();renderPlans();renderPublicUrls();renderLegalAcceptance();renderTripResult(state.trips[0]);renderAloneTimer();
    refreshHeaderWeather();
  }

  function bindGlobalClicks(){
    document.addEventListener('click', event => {
      const go=event.target.closest('[data-go]');if(go){setScreen(go.dataset.go);return;}
      const map=event.target.closest('[data-map-park]');if(map){state.selectedParkId=map.dataset.mapPark;saveState();renderParkMap();renderRoute();refreshHeaderWeather(true);$('#parkMapTitle')?.scrollIntoView?.({behavior:state.accessibility.reducedMotion?'auto':'smooth',block:'start'});return;}
      const view=event.target.closest('[data-view-park]');if(view){state.selectedParkId=view.dataset.viewPark;saveState();renderAll();setScreen('park-details');return;}
      const live=event.target.closest('[data-live-park]');if(live){state.selectedParkId=live.dataset.livePark;saveState();renderAll();setScreen('live-park');return;}
      const route=event.target.closest('[data-route-park]');if(route){state.selectedParkId=route.dataset.routePark;saveState();renderAll();setScreen('route-arrival');return;}
      const profile=event.target.closest('[data-profile-dog]');if(profile){state.selectedDogId=profile.dataset.profileDog;saveState();renderDogProfile(state.selectedDogId);setScreen('dog-profile');return;}
      const edit=event.target.closest('[data-edit-dog]');if(edit){const dog=dogById(edit.dataset.editDog),form=$('#dogForm');if(!dog||!form)return;Object.entries(dog).forEach(([k,v])=>{if(form.elements[k])form.elements[k].value=v??'';});$$('#dogForm input[type="range"]').forEach(r=>r.nextElementSibling.textContent=r.value);setScreen('dog-list');form.elements.name.focus();return;}
      const del=event.target.closest('[data-delete-dog]');if(del&&confirm('Delete this dog profile and its local relationships/check-ins?')){const id=del.dataset.deleteDog;state.dogs=state.dogs.filter(d=>d.id!==id);state.checkins=state.checkins.filter(c=>c.dogId!==id);state.affinities=state.affinities.filter(a=>a.fromDogId!==id&&a.toDogId!==id);evidence('dog_deleted',{dogId:id});renderAll();return;}
      const checkout=event.target.closest('[data-checkout]');if(checkout){const c=state.checkins.find(x=>x.id===checkout.dataset.checkout);state.checkins=state.checkins.filter(x=>x.id!==checkout.dataset.checkout);evidence('voluntary_check_out',{checkin:c});renderAll();return;}
      const confirm=event.target.closest('[data-confirm-supervision]');if(confirm){const c=state.checkins.find(x=>x.id===confirm.dataset.confirmSupervision);if(c){c.lastSupervision=now();evidence('supervision_confirmed',{checkinId:c.id,dogId:c.dogId});renderAll();}return;}
      const resolve=event.target.closest('[data-resolve-unattended]');if(resolve){const r=state.supervisionReports.find(x=>x.id===resolve.dataset.resolveUnattended);if(r){r.status='resolved';r.resolvedAt=now();evidence('unattended_report_resolved',{id:r.id});renderOwnerDuty();}return;}
      const accept=event.target.closest('[data-accept-affinity]');if(accept){const a=state.affinities.find(x=>x.id===accept.dataset.acceptAffinity);if(a){a.status='active';a.consentedAt=now();evidence('affinity_reciprocal_consent',{id:a.id});renderAffinity();}return;}
      const remove=event.target.closest('[data-remove-affinity]');if(remove){const id=remove.dataset.removeAffinity,reason=document.querySelector(`[data-removal-reason="${CSS.escape(id)}"]`)?.value||'owner_preference',a=state.affinities.find(x=>x.id===id);state.affinities=state.affinities.filter(x=>x.id!==id);evidence('affinity_removed',{affinity:a,reason,private:true});renderAffinity();return;}
      const close=event.target.closest('[data-close-maintenance]');if(close){const m=state.maintenance.find(x=>x.id===close.dataset.closeMaintenance);if(m){m.status='closed';m.closedAt=now();evidence('maintenance_closed',{id:m.id});renderSuperintendent();}return;}
      const buy=event.target.closest('[data-buy]');if(buy){const product=(CFG.products||[]).find(p=>p.id===buy.dataset.buy),ch=channel();if(ch==='web'){if(product?.stripePaymentLink)location.href=product.stripePaymentLink;else{$('#billingResult').className='answer red';$('#billingResult').innerHTML='<b>Payment link not configured.</b><br>Map and verify the exact product in config.js first.';}}else{const ok=window.GenevieveNativeBilling?.purchase(product?.id);$('#billingResult').className=`answer ${ok?'green':'red'}`;$('#billingResult').innerHTML=ok?'<b>Native store purchase requested.</b>':'<b>Native store billing is not connected.</b><br>The app correctly refused to open a web checkout inside the store channel.';}return;}
      const quick=event.target.closest('[data-quick-status]');if(quick){const dogId=$('#quickDogSelect').value;state.quickStatus[dogId]={status:quick.dataset.quickStatus,time:now()};const check=state.checkins.find(c=>c.dogId===dogId&&c.sessionOwner==='local-owner');if(check){check.status=quick.dataset.quickStatus;check.needsSpace=quick.dataset.quickStatus==='needs-space';check.training=quick.dataset.quickStatus==='training';}evidence('quick_status',{dogId,status:quick.dataset.quickStatus});$('#quickStatusMessage').textContent=`Saved ${quick.dataset.quickStatus} for ${dogById(dogId)?.name}.`;renderAll();return;}
      const breakAction=event.target.closest('[data-break-action]');if(breakAction){const action=breakAction.dataset.breakAction;const result=$('#etiquetteResult');result.className=action==='Leave park'?'answer red':'answer yellow';result.innerHTML=`<b>Action recorded: ${safe(action)}</b><br>Keep the dog under control and reassess before resuming interaction.`;evidence('etiquette_break_action',{action});return;}
      const communicationCard=event.target.closest('[data-communication-card]');if(communicationCard){showCommunicationCard(communicationCard.dataset.communicationCard);evidence('communication_card_opened',{card:communicationCard.textContent.trim()});return;}
    });
  }

  function bindForms(){
    $('#backStepButton')?.addEventListener('click', backOneStep);
    [$('#globalEmergencyButton'),$('#emergencyPageHoldButton')].filter(Boolean).forEach(button=>{
      button.addEventListener('pointerdown',event=>{
        if(event.button!==0)return;
        try{button.setPointerCapture?.(event.pointerId);}catch{}
        beginEmergencyHold(button);
      });
      ['pointerup','pointercancel'].forEach(type=>button.addEventListener(type,event=>{
        try{if(event.pointerId!==undefined&&button.hasPointerCapture?.(event.pointerId))button.releasePointerCapture(event.pointerId);}catch{}
        cancelEmergencyHold();
      }));
      button.addEventListener('keydown',event=>{
        if((event.key==='Enter'||event.key===' ')&&!event.repeat){event.preventDefault();beginEmergencyHold(button);}
      });
      button.addEventListener('keyup',event=>{
        if(event.key==='Enter'||event.key===' '){event.preventDefault();cancelEmergencyHold();}
      });
    });
    $('#emergencyCallSlider')?.addEventListener('input',event=>{
      const value=Number(event.currentTarget.value);
      const status=$('#emergencyCallStatus');
      if(status)status.textContent=value>=95?'Release the slider to open the phone dialler for 000.':'Slide all the way to the right only when you intend to call 000.';
    });
    $('#emergencyCallSlider')?.addEventListener('change',event=>{
      const slider=event.currentTarget;
      if(Number(slider.value)<95){slider.value='0';return;}
      evidence('emergency_call_dialler_requested',{number:'000',automaticContact:false});
      const status=$('#emergencyCallStatus');
      if(status){
        status.className='answer red';
        status.textContent='Opening the phone dialler for 000. GENEVIEVE has not contacted emergency services.';
      }
      window.location.href='tel:000';
      slider.value='0';
    });
    $('#cancelEmergencyCall')?.addEventListener('click',()=>{
      const panel=$('#emergencyCallConfirm');
      if(panel)panel.hidden=true;
      const slider=$('#emergencyCallSlider');
      if(slider)slider.value='0';
      evidence('emergency_call_control_cancelled');
    });
    $('#legalTermsAcceptance')?.addEventListener('change',syncLegalAcceptButton);
    $('#legalSafetyAcceptance')?.addEventListener('change',syncLegalAcceptButton);
    $('#reviewLegalAcceptance')?.addEventListener('click',()=>openLegalAcceptance());
    $('#withdrawLegalAcceptance')?.addEventListener('click',()=>{
      if(!confirm('Withdraw the legal acceptance stored on this device? The Legal Centre will show that current acceptance is required.'))return;
      const previousVersion=state.legalAcceptance?.version||'';
      state.legalAcceptance={version:'',acceptedAt:'',termsAndPrivacyAccepted:false,safetyAccepted:false};
      evidence('legal_acceptance_withdrawn',{previousVersion});
      renderLegalAcceptance();
      openLegalAcceptance(true);
    });
    $('#acceptLegal')?.addEventListener('click',()=>{
      const termsAccepted=$('#legalTermsAcceptance')?.checked===true;
      const safetyAccepted=$('#legalSafetyAcceptance')?.checked===true;
      if(!termsAccepted||!safetyAccepted){
        $('#legalAcceptanceMessage').textContent='Please select both acceptance boxes before continuing.';
        syncLegalAcceptButton();
        return;
      }
      state.legalAcceptance={
        version:LEGAL_VERSION,
        acceptedAt:now(),
        termsAndPrivacyAccepted:true,
        safetyAccepted:true
      };
      evidence('legal_acceptance_recorded',{legalVersion:LEGAL_VERSION,termsAndPrivacyAccepted:true,safetyAccepted:true,localDeviceRecord:true});
      renderLegalAcceptance();
      setScreen('today');
    });
    window.addEventListener('popstate', event => {
      appHistoryDepth = Number(event.state?.genevieveDepth || 0);
      const id = event.state?.genevieveScreen || location.hash.slice(1) || 'today';
      if(document.getElementById(id)) setScreen(id, false);
    });
    const changeRole=e=>{state.currentRole=e.target.value;evidence('role_view_changed',{role:state.currentRole});applyRoleVisibility();renderAll();setScreen('more');};
    $('#roleSelect').addEventListener('change',changeRole);
    $('#mobileRoleSelect').addEventListener('change',changeRole);
    $('#forceAppUpdate').addEventListener('click',async()=>{
      const message=$('#updateMessage');
      if(message) message.textContent='Removing old app cache and checking for the newest build…';
      try{
        if('serviceWorker' in navigator){const registrations=await navigator.serviceWorker.getRegistrations();await Promise.all(registrations.map(reg=>reg.unregister()));}
        if('caches' in window){const keys=await caches.keys();await Promise.all(keys.filter(key=>key.includes('genevieve')).map(key=>caches.delete(key)));}
        const url=new URL(location.href);url.searchParams.set('refresh',Date.now());url.hash='more';location.replace(url.toString());
      }catch(error){if(message)message.textContent='Automatic refresh could not complete. Close this tab, reopen the website and use a private window once.';}
    });
    $('#quickDogSelect').addEventListener('change',renderToday);
    $('#todayStillSupervising').addEventListener('click',()=>{state.checkins.filter(c=>c.sessionOwner==='local-owner').forEach(c=>c.lastSupervision=now());evidence('all_supervision_confirmed');renderAll();});
    $('#confirmAllSupervision').addEventListener('click',()=>{state.checkins.filter(c=>c.sessionOwner==='local-owner').forEach(c=>c.lastSupervision=now());evidence('all_supervision_confirmed');renderAll();});

    $('#departureForm').addEventListener('change',()=>{renderDepartureNeeds();renderDocumentReminders();});
    $('#departureForm').addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.currentTarget),input={dogId:f.get('dog'),parkId:f.get('park'),temperament:f.get('temperament'),lead:f.has('lead'),bags:f.has('bags'),water:f.has('water'),idTag:f.has('idTag'),vaccination:f.has('vaccination')},result=Logic.departureRisk(input);state.selectedParkId=input.parkId;const plan={id:uid('plan'),...input,riskScore:result.riskScore,time:now()};state.departurePlans.unshift(plan);evidence('departure_plan',plan);$('#departureResult').className=`answer ${result.level}`;$('#departureResult').innerHTML=`<b>${result.riskScore}% departure risk — ${safe(result.label)}</b><br>${result.missing.length?`Fix before leaving: ${safe(result.missing.join(', '))}.`:safe(result.action)}`;renderAll();});
    $('#arrivalForm').addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.currentTarget),flags=['leadFromCar','pathControlled','gateAssessed','innerGateSecure'],missing=flags.filter(k=>!f.has(k)),score=Logic.clamp(missing.length*24),band=Logic.riskBand(score),record={id:uid('arrival'),parkId:state.selectedParkId,checks:Object.fromEntries(flags.map(k=>[k,f.has(k)])),riskScore:score,time:now()};state.arrivalChecks.unshift(record);evidence('arrival_check',record);$('#arrivalResult').className=`answer ${band.level}`;$('#arrivalResult').innerHTML=`<b>${score}% arrival-process risk — ${safe(band.label)}</b><br>${missing.length?'Complete all lead and gate checks before release.':'Arrival checklist complete. Continue direct supervision.'}`;renderToday();});

    $('#parkNeedControls').innerHTML=parkNeeds.map(n=>`<label class="toggle"><input name="tripNeeds" type="checkbox" value="${safe(n)}"> ${safe(n)}</label>`).join('');
    $('#parkFilterForm').addEventListener('submit',e=>{e.preventDefault();renderParks();renderParkMap();});
    $('#parkFilterForm').addEventListener('reset',()=>setTimeout(()=>{renderParks();renderParkMap();},0));
    $('#beachFilterForm').addEventListener('submit',e=>{e.preventDefault();renderBeaches();});

    $$('input[type="range"]').forEach(r=>r.addEventListener('input',()=>{if(r.nextElementSibling)r.nextElementSibling.textContent=r.value;}));
    $('#dogForm').addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.currentTarget),id=f.get('id')||uid('dog'),existing=dogById(id)||{};const dog={...existing,id,name:String(f.get('name')||'').trim(),dob:f.get('dob'),breed:f.get('breed'),lifeStage:f.get('lifeStage'),publicNote:f.get('publicNote'),notes:f.get('notes'),microchip:f.get('microchip'),weight:f.get('weight'),medical:f.get('medical'),vet:f.get('vet'),emergencyContact:f.get('emergencyContact'),vaccinationStatus:f.get('vaccinationStatus'),reproductiveStatus:f.get('reproductiveStatus')||'not-shared',supportNeeds:f.get('supportNeeds')||'none',supportNote:f.get('supportNote'),registrationExpiry:f.get('registrationExpiry'),vaccinationDue:f.get('vaccinationDue'),fleaTickDue:f.get('fleaTickDue'),medicationDue:f.get('medicationDue'),insuranceExpiry:f.get('insuranceExpiry')};Logic.dims.forEach(k=>dog[k]=Number(f.get(k)));const index=state.dogs.findIndex(d=>d.id===id);if(index>=0)state.dogs[index]=dog;else state.dogs.push(dog);evidence(index>=0?'dog_updated':'dog_created',{dogId:id,name:dog.name});e.currentTarget.reset();e.currentTarget.elements.id.value='';$$('#dogForm input[type="range"]').forEach(r=>r.nextElementSibling.textContent=r.value);renderAll();});
    $('#dogForm').addEventListener('reset',e=>{const form=e.currentTarget;setTimeout(()=>{form.elements.id.value='';$$('#dogForm input[type="range"]').forEach(r=>r.nextElementSibling.textContent=r.value);},0);});

    $('#puppyForm').addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.currentTarget),dog=dogById(f.get('dog')),result=Logic.puppyAssessment({clearance:f.get('clearance'),setting:f.get('setting'),mentor:f.get('mentor'),lifeStage:dog?.lifeStage});$('#puppyResult').className=`answer ${result.level}`;$('#puppyResult').innerHTML=`<b>${result.riskScore}% socialisation-plan risk — ${safe(result.label)}</b><br>${safe(result.action)}<ul>${result.reasons.map(r=>`<li>${safe(r)}</li>`).join('')}</ul>`;evidence('puppy_socialisation_assessment',{dogId:dog?.id,riskScore:result.riskScore,inputs:Object.fromEntries(f)});});

    $('#compatibilityForm').addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.currentTarget),a=dogById(f.get('dogA')),b=dogById(f.get('dogB')),p=parkById(f.get('park')),heat=latestRisk(state.heatChecks,h=>h.parkId===p.id),result=Logic.interactionRisk(a,b,{capacity:p.capacity,population:f.get('population'),groupEnergy:f.get('groupEnergy'),gateBusy:gateRisk(p.id)>=50,quiet:p.quiet,heatRisk:heat});if(result&&(a?.reproductiveStatus==='on-heat'||b?.reproductiveStatus==='on-heat')){result.riskScore=Math.max(85,result.riskScore);result.reasons=['Owner-declared on-heat status requires separation and a controlled alternative.',...result.reasons];}if(!result){$('#compatibilityResult').innerHTML='<b>Choose two different dogs.</b>';return;}const prediction={id:uid('pred'),dogAId:a.id,dogBId:b.id,parkId:p.id,riskScore:result.riskScore,reasons:result.reasons,modelVersion:VERSION,reason:'manual',time:now()};state.predictions.unshift(prediction);state.predictions=state.predictions.slice(0,300);evidence('compatibility_prediction',prediction);$('#compatibilityResult').innerHTML=predictionHtml(prediction);renderPredictionSelect();renderToday();});
    $('#recommendationForm').addEventListener('submit',e=>{e.preventDefault();if(!state.privacy.recommendations){$('#recommendationList').innerHTML='<div class="answer yellow">Recommendations are disabled in Settings.</div>';return;}const f=new FormData(e.currentTarget),dog=dogById(f.get('dog')),p=parkById(f.get('park')),population=currentCheckins(p.id).length,results=state.dogs.filter(d=>d.id!==dog.id).map(other=>{const r=Logic.interactionRisk(dog,other,{capacity:p.capacity,population,groupEnergy:5,gateBusy:gateRisk(p.id)>=50,quiet:p.quiet,heatRisk:latestRisk(state.heatChecks,h=>h.parkId===p.id)});const pred={id:uid('pred'),dogAId:dog.id,dogBId:other.id,parkId:p.id,riskScore:r.riskScore,reasons:r.reasons,modelVersion:VERSION,reason:'prospective_recommendation',time:now()};state.predictions.unshift(pred);return pred;}).sort((x,y)=>x.riskScore-y.riskScore);evidence('prospective_recommendations',{dogId:dog.id,parkId:p.id,count:results.length});$('#recommendationList').innerHTML=results.map(predictionHtml).join('')||'<div class="empty">No other dog profiles available.</div>';renderPredictionSelect();});
    $('#outcomeForm').addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.currentTarget),prediction=state.predictions.find(p=>p.id===f.get('prediction'));if(!prediction)return;const outcome={id:uid('out'),predictionId:prediction.id,outcome:f.get('outcome'),note:f.get('note'),time:now()};state.outcomes.unshift(outcome);if(state.privacy.learningParticipation){const delta={positive:.25,neutral:0,stressful:-.3,conflict:-.55}[outcome.outcome]||0;[prediction.dogAId,prediction.dogBId].forEach(id=>{const d=dogById(id);if(d){d.sociability=Logic.clamp(d.sociability+delta,0,10);d.tolerance=Logic.clamp(d.tolerance+delta,0,10);if(delta<0)d.reactivity=Logic.clamp(d.reactivity-delta,0,10);}});}evidence('interaction_outcome',outcome);renderAll();e.currentTarget.reset();});

    $('#affinityForm').addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.currentTarget);if(f.get('fromDog')===f.get('toDog')){alert('Choose two different dogs.');return;}const a={id:uid('aff'),fromDogId:f.get('fromDog'),toDogId:f.get('toDog'),mode:f.get('mode'),status:f.get('mode')==='mutual'?'pending reciprocal consent':'active',parkId:f.get('park'),time:now()};state.affinities.unshift(a);evidence('affinity_created',a);renderAffinity();});
    $('#alertCheckForm').addEventListener('submit',e=>{e.preventDefault();const parkId=new FormData(e.currentTarget).get('park');if(!state.privacy.affinityAlerts||!state.privacy.livePresence){$('#affinityAlerts').innerHTML='<div class="answer yellow">Best-mate alerts or live presence are disabled.</div>';return;}const visible=new Set(state.checkins.filter(c=>c.parkId===parkId&&!c.incognito).map(c=>c.dogId));const matches=state.affinities.filter(a=>a.parkId===parkId&&a.status==='active'&&visible.has(a.toDogId));$('#affinityAlerts').innerHTML=matches.length?matches.map(a=>`<div class="answer green"><b>${safe(dogById(a.toDogId)?.name)} is checked in at ${safe(parkById(parkId).name)}</b><br>Exact position is not shown.</div>`).join(''):'<div class="answer yellow">No eligible visible best mate is checked in at this park.</div>';matches.forEach(item=>{const park=parkById(parkId),dog=dogById(item.toDogId),locationText=notificationLocation(park);void showDeviceNotification({key:`best-mate:${item.id}:${parkId}`,category:'bestMate',title:`${dog?.name||'A best mate'} is at the preferred park`,body:`Visible voluntary check-in${locationText?` · ${locationText}`:''}. Exact position is not shown.`,url:'#best-mates',cooldownMinutes:60,audiences:['owner','admin']});});});

    $('#checkinForm').addEventListener('submit',e=>{e.preventDefault();pruneExpiredCheckins();const f=new FormData(e.currentTarget),existing=state.checkins.find(c=>c.dogId===f.get('dog')&&c.sessionOwner==='local-owner');if(existing){alert('This dog already has an active voluntary check-in. You may check out first or wait for automatic expiry.');return;}const expectedMinutes=Math.max(30,Math.min(180,Number(f.get('expectedMinutes'))||90)),started=Date.now();const c={id:uid('check'),dogId:f.get('dog'),parkId:f.get('park'),status:f.get('status'),leadAgreement:f.has('leadAgreement'),gateAgreement:f.has('gateAgreement'),supervisionAgreement:f.has('supervisionAgreement'),needsSpace:f.has('needsSpace'),onLead:f.has('onLead'),training:f.has('training'),incognito:f.has('incognito')||state.privacy.incognitoDefault,voluntary:true,policyMode:'voluntary-community-pilot',expectedMinutes,sessionOwner:'local-owner',time:new Date(started).toISOString(),lastSupervision:new Date(started).toISOString(),expiresAt:new Date(started+expectedMinutes*60000).toISOString()};state.selectedParkId=c.parkId;state.checkins.unshift(c);evidence('voluntary_check_in',c);renderAll();});
    $('#unattendedForm').addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.currentTarget),r={id:uid('unattended'),parkId:f.get('park'),description:f.get('description'),ownerLocation:f.get('ownerLocation'),concern:f.get('concern'),status:'open',time:now()};state.supervisionReports.unshift(r);evidence('unattended_dog_report',r);e.currentTarget.reset();refreshSelects();renderOwnerDuty();const park=parkById(r.parkId),locationText=notificationLocation(park);void showDeviceNotification({key:`unattended:${r.id}`,category:'workerTasks',title:'Unattended-dog safety report',body:`${r.description} · ${r.concern}${locationText?` · ${locationText}`:''}`,url:'#owner-duty',critical:true,cooldownMinutes:720,audiences:OPERATIONS_NOTIFICATION_ROLES});});

    $('#etiquetteSignals').innerHTML=etiquetteSignals.map(([v,l])=>`<label class="toggle"><input type="checkbox" value="${v}"> ${safe(l)}</label>`).join('');
    $('#etiquetteForm').addEventListener('submit',e=>{e.preventDefault();const signals=$$('#etiquetteSignals input:checked').map(i=>i.value),result=Logic.etiquetteRisk(signals);$('#etiquetteResult').className=`answer ${result.level}`;$('#etiquetteResult').innerHTML=`<b>${result.riskScore}% observed interaction risk — ${safe(result.label)}</b><br>${result.actions.map(safe).join(' ')}`;evidence('etiquette_assessment',{signals,riskScore:result.riskScore});});

    $('#heatCheckForm').addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.currentTarget),input={apparentTemperature:f.get('apparentTemperature'),humidity:f.get('humidity'),uvIndex:f.get('uvIndex'),directSun:f.has('directSun'),shadeAvailable:f.has('shadeAvailable'),waterAvailable:f.has('waterAvailable'),hotSurface:f.has('hotSurface'),vulnerableDog:f.has('vulnerableDog')},result=Logic.heatRisk(input),record={id:uid('heat'),dogId:f.get('dog'),parkId:f.get('park'),riskScore:result.riskScore,inputs:input,time:now()};state.heatChecks.unshift(record);state.heatChecks=state.heatChecks.slice(0,200);evidence('heat_check',record);$('#heatResult').innerHTML=riskHtml(result);renderHeatHistory();renderToday();if(result.riskScore>=25){const park=parkById(record.parkId),dog=dogById(record.dogId),locationText=notificationLocation(park);void showDeviceNotification({key:`heat:${record.id}`,category:'heat',title:`${result.riskScore>=75?'Critical ':''}heat risk — ${dog?.name||'dog'}`,body:`${result.riskScore}% heat risk${locationText?` · ${locationText}`:''}. ${result.action||'Check current conditions before entering.'}`,url:'#heat-hazards',critical:result.riskScore>=75,cooldownMinutes:180});}});
    $('#useCurrentWeather').addEventListener('click',async()=>{const status=$('#weatherStatus');if(!state.privacy.preciseLocation){status.className='answer yellow';status.innerHTML='<b>Location is off.</b><br>Enable “Allow location only when I request current weather” in Settings, or continue with manual entry.';return;}if(!navigator.geolocation){status.className='answer red';status.textContent='This browser does not support geolocation.';return;}status.className='answer yellow';status.textContent='Requesting location and current weather…';navigator.geolocation.getCurrentPosition(async pos=>{try{const {latitude,longitude}=pos.coords;const url=`https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}&current=apparent_temperature,relative_humidity_2m,uv_index&timezone=auto`;const response=await fetch(url,{cache:'no-store'});if(!response.ok)throw new Error(`Weather service returned ${response.status}`);const data=await response.json(),current=data.current||{},form=$('#heatCheckForm');if(current.apparent_temperature!=null)form.elements.apparentTemperature.value=current.apparent_temperature;if(current.relative_humidity_2m!=null)form.elements.humidity.value=current.relative_humidity_2m;if(current.uv_index!=null)form.elements.uvIndex.value=current.uv_index;status.className='answer green';status.innerHTML=`<b>Current weather loaded.</b><br>Feels like ${safe(current.apparent_temperature)}°C · humidity ${safe(current.relative_humidity_2m)}% · UV ${safe(current.uv_index)}. Check the exact park and surface directly.`;evidence('weather_loaded',{provider:'Open-Meteo',coordinatesStored:false,time:now()});}catch(err){status.className='answer red';status.innerHTML=`<b>Weather could not be loaded.</b><br>${safe(err.message)}. Use manual entry.`;}},err=>{status.className='answer red';status.innerHTML=`<b>Location was not available.</b><br>${safe(err.message)}. Use manual entry.`;},{enableHighAccuracy:false,timeout:12000,maximumAge:300000});});
    $('#hazardForm').addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.currentTarget),h={id:uid('haz'),parkId:f.get('park'),type:f.get('type'),riskScore:Number(f.get('risk')),details:f.get('details'),time:now(),source:'community local report'};state.hazards.unshift(h);state.selectedParkId=h.parkId;evidence('hazard_report',h);e.currentTarget.reset();refreshSelects();renderAll();const park=parkById(h.parkId),locationText=notificationLocation(park);void showDeviceNotification({key:`hazard:${h.id}`,category:'hazards',title:`${h.riskScore>=75?'Critical ':''}park hazard — ${h.type}`,body:`${h.details}${locationText?` · ${locationText}`:''}`,url:'#heat-hazards',critical:h.riskScore>=75,cooldownMinutes:1440});});

    $('#tripNeeds').innerHTML=tripNeedOptions.map(n=>`<label class="toggle"><input name="tripNeeds" type="checkbox" value="${safe(n)}"> ${safe(n)}</label>`).join('');
    $('#tripForm').addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.currentTarget),plan={id:uid('trip'),from:f.get('from'),to:f.get('to'),needs:$$('#tripNeeds input:checked').map(i=>i.value),time:now()};state.trips.unshift(plan);evidence('trip_plan',plan);renderTripResult(plan);});
    const updateTravelLinks=()=>{
      const vetLocation=$('#travelVetLocation')?.value||'Australia';
      const stayLocation=$('#stayLocation')?.value||'Australia';
      if($('#travelVetMapsLink')) $('#travelVetMapsLink').href=`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`24 hour emergency vet ${vetLocation}`)}`;
      if($('#travelVetOpenNowLink')) $('#travelVetOpenNowLink').href=`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`veterinarian open now ${vetLocation}`)}`;
      if($('#airbnbPetLink')) $('#airbnbPetLink').href=`https://www.airbnb.com.au/s/${encodeURIComponent(stayLocation)}/homes?tab_id=home_tab&refinement_paths%5B%5D=%2Fhomes&query=${encodeURIComponent(stayLocation)}&flexible_trip_lengths%5B%5D=one_week&monthly_start_date=&monthly_length=3&monthly_end_date=&price_filter_input_type=0&channel=EXPLORE&amenities%5B%5D=12`;
      if($('#petHotelMapsLink')) $('#petHotelMapsLink').href=`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`pet friendly hotels ${stayLocation}`)}`;
      if($('#petCaravanMapsLink')) $('#petCaravanMapsLink').href=`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`pet friendly caravan parks ${stayLocation}`)}`;
    };
    $('#travelVetLocation')?.addEventListener('input',updateTravelLinks);
    $('#stayLocation')?.addEventListener('input',updateTravelLinks);
    updateTravelLinks();

    $('#emergencyDogSelect').addEventListener('change',()=>$('#emergencySummary').innerHTML='');
    $('#showEmergencySummary').addEventListener('click',()=>{const dog=dogById($('#emergencyDogSelect').value);if(!dog)return;$('#emergencySummary').innerHTML=`<div class="answer amber"><b>${safe(dog.name)}</b><br>Microchip: ${safe(dog.microchip||'Not entered')}<br>Weight: ${safe(dog.weight||'Not entered')} kg<br>Allergies/medication: ${safe(dog.medical||'Not entered')}<br>Vet: ${safe(dog.vet||'Not entered')}<br>Emergency contact: ${safe(dog.emergencyContact||'Not entered')}<br>Support need: ${safe(supportNeedLabels[dog.supportNeeds]||'None recorded')} ${dog.supportNote?`— ${safe(dog.supportNote)}`:''}<br>Insurance expiry: ${safe(dog.insuranceExpiry?fmtDate(dog.insuranceExpiry):'Not entered')}</div>`;evidence('emergency_summary_viewed',{dogId:dog.id,role:state.currentRole});});
    const updateVetLink=()=>{$('#vetSearchLink').href=`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`emergency vet ${$('#vetLocation').value}`)}`;};$('#vetLocation').addEventListener('input',updateVetLink);updateVetLink();
    $('#startAloneTimer').addEventListener('click',()=>{const minutes=Number($('#aloneTimerMinutes').value);state.aloneTimerEnd=new Date(Date.now()+minutes*60000).toISOString();evidence('alone_timer_started',{minutes});renderAloneTimer();});
    $('#cancelAloneTimer').addEventListener('click',()=>{state.aloneTimerEnd=null;evidence('alone_timer_cancelled');renderAloneTimer();});

    $('#lostFoundForm').addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.currentTarget),r={id:uid('lost'),type:f.get('type'),description:f.get('description'),location:f.get('location'),urgency:f.get('urgency'),contact:f.get('contact'),time:now()};state.lostFound.unshift(r);evidence('lost_found_record',r);e.currentTarget.reset();renderLostFound();if(r.urgency!=='watch')void showDeviceNotification({key:`lost-found:${r.id}`,category:'emergency',title:`${r.urgency==='danger'?'Critical ':'Urgent '}${r.type} dog alert`,body:`${r.description} · ${r.location}`,url:'#lost-found',critical:r.urgency==='danger',cooldownMinutes:1440,audiences:ALL_NOTIFICATION_ROLES});});
    $('#incidentForm').addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.currentTarget),r={id:uid('inc'),parkId:f.get('park'),type:f.get('type'),severity:Number(f.get('severity')),details:f.get('details'),witness:f.get('witness'),time:now(),status:'open'};state.incidents.unshift(r);evidence('incident_record',r);e.currentTarget.reset();refreshSelects();renderIncidents();renderSuperintendent();if(r.severity>=60){const park=parkById(r.parkId),locationText=notificationLocation(park),critical=r.severity>=75;void showDeviceNotification({key:`incident:${r.id}`,category:critical?'emergency':'incidents',title:`${critical?'Critical ':'Urgent '}incident — ${r.type}`,body:`${r.details}${locationText?` · ${locationText}`:''}`,url:'#incident',critical,cooldownMinutes:720,audiences:critical?ALL_NOTIFICATION_ROLES:OPERATIONS_NOTIFICATION_ROLES});}});
    $('#maintenanceForm').addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.currentTarget),m={id:uid('maint'),parkId:f.get('park'),facility:f.get('facility'),priority:f.get('priority'),task:f.get('task'),status:'open',time:now()};state.maintenance.unshift(m);evidence('maintenance_created',m);e.currentTarget.reset();refreshSelects();renderSuperintendent();const park=parkById(m.parkId),locationText=notificationLocation(park);void showDeviceNotification({key:`maintenance:${m.id}`,category:'workerTasks',title:`${m.priority==='red'?'Critical ':''}worker task — ${m.facility}`,body:`${m.task}${locationText?` · ${locationText}`:''}`,url:'#superintendent',critical:m.priority==='red',cooldownMinutes:720,audiences:OPERATIONS_NOTIFICATION_ROLES});});
    $('#noticeForm').addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.currentTarget),n={id:uid('notice'),parkId:f.get('park'),title:f.get('title'),details:f.get('details'),expires:f.get('expires'),verified:true,createdByRole:state.currentRole,time:now()};state.notices.unshift(n);evidence('operator_notice_created',n);e.currentTarget.reset();refreshSelects();renderAll();const park=parkById(n.parkId),locationText=notificationLocation(park);void showDeviceNotification({key:`notice:${n.id}`,category:'hazards',title:`Verified park notice — ${n.title}`,body:`${n.details}${locationText?` · ${locationText}`:''}`,url:'#notices',cooldownMinutes:1440});});

    $('#notificationForm').addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.currentTarget);['bestMate','heat','hazards','documents','emergency','incidents','workerTasks','companion'].forEach(k=>state.notifications[k]=f.has(k));state.notifications.quietStart=f.get('quietStart');state.notifications.quietEnd=f.get('quietEnd');state.notifications.locationDetail=f.get('locationDetail');evidence('notification_settings',state.notifications);renderNotifications();setNotificationAction(`Notification settings saved for the ${state.currentRole} role on this device.`,'green');});
    $('#enableNotifications').addEventListener('click',async()=>{
      if(!('Notification' in window)||!notificationContextReady()){renderNotificationPermission();return;}
      try{
        state.notifications.permissionAsked=true;
        const permission=await Notification.requestPermission();
        evidence('notification_permission_choice',{permission});
        renderNotifications();
        if(permission==='granted'){
          const result=await showDeviceNotification({key:`enabled:${Date.now()}`,category:'emergency',title:'GENEVIEVE device notifications enabled',body:`${notificationPlatform()} can now show the safety alert types selected for the ${state.currentRole} role.`,url:'#notifications',bypassQuiet:true,bypassCooldown:true,bypassCategory:true,audiences:ALL_NOTIFICATION_ROLES});
          setNotificationAction(result.delivered?'Notifications are enabled and a confirmation was delivered.':'Permission was granted, but this device could not display the confirmation.',result.delivered?'green':'red');
        }else setNotificationAction(permission==='denied'?'Notifications were blocked. Use this device’s browser settings to re-enable them.':'Permission was not granted. You can choose again when the browser allows it.','red');
        renderNotifications();
      }catch(error){
        setNotificationAction(`Notification permission could not be requested: ${error.message}`,'red');
      }
    });
    $('#testNotification').addEventListener('click',async()=>{
      const result=await showDeviceNotification({key:`test:${Date.now()}`,category:'emergency',title:'GENEVIEVE test notification',body:`Cross-platform test for ${notificationPlatform()} · ${state.currentRole} role.`,url:'#notifications',bypassQuiet:true,bypassCooldown:true,bypassCategory:true,audiences:ALL_NOTIFICATION_ROLES});
      setNotificationAction(result.delivered?'System test notification delivered and copied to the in-app safety inbox.':result.inApp?'System interruption was unavailable, but the test was stored successfully in the universal in-app safety inbox.':'The test could not be recorded. Review this device and browser settings.',result.delivered||result.inApp?'green':'red');
    });
    $('#checkNotifications').addEventListener('click',()=>{void runNotificationChecks({manual:true});});
    $('#clearInAppAlerts').addEventListener('click',clearInAppAlerts);
    $('#installNotificationApp').addEventListener('click',async()=>{
      if(!installPromptEvent)return;
      await installPromptEvent.prompt();
      const choice=await installPromptEvent.userChoice;
      evidence('pwa_install_choice',{outcome:choice?.outcome||'unknown',platform:notificationPlatform()});
      installPromptEvent=null;
      renderNotificationPlatform();
    });
    $('#privacyForm').addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.currentTarget);Object.keys(state.privacy).forEach(k=>state.privacy[k]=f.has(k));evidence('privacy_settings',state.privacy);renderPrivacy();});
    $('#reducedMotion').addEventListener('change',e=>{state.accessibility.reducedMotion=e.target.checked;evidence('accessibility_setting',{reducedMotion:e.target.checked});renderAccessibility();});
    $('#largeText').addEventListener('change',e=>{state.accessibility.largeText=e.target.checked;evidence('accessibility_setting',{largeText:e.target.checked});renderAccessibility();});
    $('#highContrast').addEventListener('change',e=>{state.accessibility.highContrast=e.target.checked;evidence('accessibility_setting',{highContrast:e.target.checked});renderAccessibility();});
    $('#communicationPreferencesForm').addEventListener('submit',e=>{
      e.preventDefault();
      const f=new FormData(e.currentTarget);
      ['auslanSupportEnabled','usesAuslan','deafOrHardOfHearing','learningAuslan','communicateSigning','communicateTyping','communicateCards','visualAttention','dogVisualCommands','shareCommunicationPreferences']
        .forEach(key=>state.accessibility[key]=f.has(key));
      evidence('communication_accessibility_preferences_saved',{
        enabled:state.accessibility.auslanSupportEnabled,
        publicSharing:state.accessibility.shareCommunicationPreferences
      });
      renderAccessibility();
    });
    $('#customCommunicationForm').addEventListener('submit',e=>{
      e.preventDefault();
      const message=String(new FormData(e.currentTarget).get('message')||'').trim();
      if(message)showCommunicationCard(message);
    });
    $('#closeCommunicationDisplay').addEventListener('click',()=>{
      $('#communicationDisplay').hidden=true;
      stopAccessibilityEmergency();
    });
    $('#showDeafEmergencyCard').addEventListener('click',()=>showCommunicationCard('I am Deaf or hard of hearing. Please face me and type your instructions.'));
    $('#startAccessibilityEmergency').addEventListener('click',()=>{
      state.accessibility.emergencyVisualMode=true;
      evidence('accessibility_emergency_mode_started');
      renderAccessibility();
      if(navigator.vibrate) navigator.vibrate([500,250,500,250,900]);
      showCommunicationCard('⚠ EMERGENCY. Please face me. Use clear written instructions. Confirm who has called Triple Zero (000), the ranger or a veterinarian.');
    });

    const exportData=()=>{evidence('data_exported');download(`GENEVIEVE-Dog-Park-data-${new Date().toISOString().slice(0,10)}.json`,JSON.stringify({exportedAt:now(),version:VERSION,state},null,2));};
    $('#exportEvidence').addEventListener('click',()=>{evidence('evidence_exported');download(`GENEVIEVE-patent-evidence-${new Date().toISOString().slice(0,10)}.json`,JSON.stringify({exportedAt:now(),version:VERSION,evidence:state.evidence,predictions:state.predictions,outcomes:state.outcomes,heatChecks:state.heatChecks,affinities:state.affinities,environment:parks.map(p=>({parkId:p.id,checkins:currentCheckins(p.id).length,capacity:p.capacity}))},null,2));});
    $('#exportAllData').addEventListener('click',exportData);$('#dataExportButton').addEventListener('click',exportData);
    const deleteData=()=>{if(confirm('Delete all local GENEVIEVE Dog Park data from this browser? This cannot be undone.')){localStorage.removeItem(KEY);state=structuredClone(defaultState);saveState();renderAll();openLegalAcceptance(true);}};$('#deleteAllData').addEventListener('click',deleteData);$('#dataDeleteButton').addEventListener('click',deleteData);
    $('#restorePurchases').addEventListener('click',()=>{const ok=window.GenevieveNativeBilling?.restore?.();$('#billingResult').className=`answer ${ok?'green':'red'}`;$('#billingResult').innerHTML=ok?'<b>Restore requested.</b>':'<b>Native store restore is not connected in this web build.</b>';});
    $('#runLaunchCheck').addEventListener('click',runLaunchCheck);
  }

  window.GenevieveAppBridge=Object.freeze({
    getState:()=>structuredClone(state),
    getParks:()=>structuredClone(parks),
    updateState:updater=>{if(typeof updater==='function')updater(state);saveState();renderAll();return structuredClone(state);},
    saveEvidence:(type,payload={})=>evidence(type,payload),
    selectPark:id=>{if(parks.some(p=>p.id===id)){state.selectedParkId=id;saveState();renderAll();refreshHeaderWeather(true);}},
    openScreen:id=>setScreen(id),
    renderAll:()=>renderAll()
  });

  function boot(){
    bindGlobalClicks();bindForms();
    $('#roleSelect').value=state.currentRole;
    renderAll();
    const params=new URLSearchParams(location.search),requested=params.get('open'),hash=location.hash.slice(1);
    const initialScreen=requested&&document.getElementById(requested)?requested:(hash&&document.getElementById(hash)?hash:'today');
    setScreen(initialScreen,false);
    if(initialScreen==='today'){
      requestAnimationFrame(()=>window.scrollTo({top:0,left:0,behavior:'auto'}));
      setTimeout(()=>window.scrollTo({top:0,left:0,behavior:'auto'}),120);
    }
    $('#modePill').textContent=`LIVE STATUS · ${window.GenevieveBackend?.enabled?'connected services configured':'active on this device'} · v${VERSION}`;
    // Legal acceptance remains available and visible, but it no longer hijacks the app landing screen.
    if('serviceWorker' in navigator) (async()=>{
      try{
        const resetKey='genevieve_v40_live_deploy_reset_done';
        if(!localStorage.getItem(resetKey)){
          if('serviceWorker' in navigator){
            const registrations=await navigator.serviceWorker.getRegistrations();
            await Promise.all(registrations.map(reg=>reg.unregister()));
          }
          if('caches' in window){
            const keys=await caches.keys();
            await Promise.all(keys.filter(key=>key.includes('genevieve')).map(key=>caches.delete(key)));
          }
          localStorage.setItem(resetKey,'yes');
          const freshUrl=new URL(location.href);
          freshUrl.searchParams.set('genevieveVersion','39');
          const requestedScreen=freshUrl.searchParams.get('open')||freshUrl.hash.slice(1);
          freshUrl.hash=document.getElementById(requestedScreen)?requestedScreen:'today';
          location.replace(freshUrl.toString());
          return;
        }
        if('serviceWorker' in navigator){
          const registration=await navigator.serviceWorker.register('./service-worker.js?v=20260731.40',{updateViaCache:'none'});
          await registration.update();
        }
      }catch(error){
        console.warn('GENEVIEVE build 2026.07.31.40 cache reset could not complete automatically.',error);
      }
    })();
    setInterval(()=>refreshHeaderWeather(true),WEATHER_REFRESH_MS);
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){refreshHeaderWeather();void runNotificationChecks();}});
    window.addEventListener('online',()=>{refreshHeaderWeather(true);void runNotificationChecks();});
    setTimeout(()=>{void runNotificationChecks();},2500);
    setInterval(()=>{void runNotificationChecks();},WEATHER_REFRESH_MS);
    setInterval(()=>{renderAloneTimer();if(state.aloneTimerEnd&&new Date(state.aloneTimerEnd)<=new Date()){const expiredEnd=state.aloneTimerEnd;state.aloneTimerEnd=null;evidence('alone_timer_expired',{end:expiredEnd});void showDeviceNotification({key:`alone-timer:${expiredEnd}`,category:'emergency',title:'Safety timer expired',body:'Your GENEVIEVE “I’m here alone” timer has expired. Check in now or follow your emergency plan.',url:'#emergency',critical:true,cooldownMinutes:1440});renderAloneTimer();}},30000);
    evidence('app_loaded',{channel:channel(),role:state.currentRole});
  }

  window.addEventListener('beforeinstallprompt',event=>{
    event.preventDefault();
    installPromptEvent=event;
    renderNotificationPlatform();
  });
  window.addEventListener('appinstalled',()=>{
    installPromptEvent=null;
    evidence('pwa_installed',{platform:notificationPlatform()});
    renderNotificationPlatform();
  });
  document.addEventListener('DOMContentLoaded',boot);
})();
