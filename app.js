const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];

const DATA = {
  owner:{name:"Tracey Kennedy",displayName:"Tracey"},
  dog:{
    name:"Mr Gruff", dob:"08/08/2021", weight:"20 kg", size:"Medium", sex:"Male", desexed:"Yes",
    status:"needs-space", note:"Needs extra room around unknown dogs. On lead and in training when busy.",
    triggers:["prams","skateboards","wheelchairs","mobility aids","bikes","children crowding","dogs rushing in","noisy dogs"],
    likes:["low crowd","shade","water","calm entry","space to move"]
  },
  parks:[
    {id:"witherside",name:"Witherside Park",type:"Dog Park",area:"3.2 ha",distance:"2.1 km",drive:"5 min",capacity:25,dogsNow:8,crowd:"Low",water:true,shade:true,fenced:true,dogBeach:false,risk:32,score:86,image:"./assets/park.svg",alerts:["Earlier reactive dog report near north gate","Gate area can crowd at 5pm"],amenities:["Accessibility","Agility area","Fenced","Parking","Shade","Small dog area","Toilets","Water bowls"],councilNotice:"Check local council signs before entering."},
    {id:"riverside",name:"Riverside Dog Park",type:"Dog Park",area:"2.4 ha",distance:"3.4 km",drive:"8 min",capacity:20,dogsNow:14,crowd:"Medium",water:true,shade:true,fenced:true,dogBeach:false,risk:58,score:64,image:"./assets/park.svg",alerts:["Crowded gate reported 15 min ago"],amenities:["Fenced","Parking","Shade","Toilets","Water bowls"],councilNotice:"Use caution around main gate."},
    {id:"greenway",name:"Greenway Reserve",type:"Dog Park",area:"1.8 ha",distance:"5.6 km",drive:"11 min",capacity:18,dogsNow:17,crowd:"High",water:false,shade:false,fenced:true,dogBeach:false,risk:82,score:28,image:"./assets/park.svg",alerts:["Reactive dog reported","Only 1 space left","Low shade"],amenities:["Fenced","Parking"],councilNotice:"Choose a calmer alternative for needs-space dogs."},
    {id:"wagginbeach",name:"Waggin’ Beach",type:"Dog Beach",area:"1.6 km beach",distance:"6.2 km",drive:"12 min",capacity:30,dogsNow:15,crowd:"Low",water:true,shade:false,fenced:false,dogBeach:true,risk:38,score:82,image:"./assets/beach.svg",alerts:["Check tide and council access times","Bring water and shade"],amenities:["Beach access","Dog beach","Parking","Water nearby"],councilNotice:"Dog beach access times may change. Check signs at beach entry."},
    {id:"caravan",name:"Pet Friendly Caravan Stop",type:"Trip Stop",area:"Large rest area",distance:"18 km",drive:"22 min",capacity:40,dogsNow:9,crowd:"Low",water:true,shade:true,fenced:false,dogBeach:false,risk:42,score:76,image:"./assets/park.svg",alerts:["Use lead around vehicles","Rest stop not fully fenced"],amenities:["Caravan parking","Fuel nearby","Pet friendly café","Toilets","Vets nearby","Water"],councilNotice:"Keep dogs on lead around traffic and other travellers."}
  ],
  mates:[
    {name:"Luna",breed:"Labrador",weight:"22 kg",status:"Low crowd at park",distance:"1.2 km",compatibility:89},
    {name:"Buddy",breed:"Border Collie",weight:"18 kg",status:"Calm energy",distance:"2.2 km",compatibility:74}
  ],
  tripNeeds:["Caravan Parks","Dog Beaches","Dog Friendly Cafes","Dog Friendly Hotels","Dog Parks","Emergency Vets","Fuel Stops","Low Crowd Stops","Pet Friendly Restaurants","Rest Stops","Road Hazard Check","Shade","Toilets","Vets","Water"]
};

const defaultState = {
  active:"home",
  selectedPark:"witherside",
  temperament:"needs-space",
  checkedIn:false,
  incognito:false,
  safetyShare:false,
  reports:[],
  lostFound:[],
  audit:[],
  tripNeeds:[...DATA.tripNeeds],
  liveSetup:{stripeFree:"",stripePremium:"",backendUrl:""},
  statusNote:""
};

let state = loadState();

function loadState(){
  try { return {...defaultState, ...JSON.parse(localStorage.getItem("genevieve_dogpark_blueprint_state") || "{}")}; }
  catch { return {...defaultState}; }
}
function saveState(){ localStorage.setItem("genevieve_dogpark_blueprint_state", JSON.stringify(state)); }
function audit(title, detail="", level="green"){
  state.audit.unshift({title, detail, level, at:new Date().toLocaleString()});
  state.audit = state.audit.slice(0,50);
  saveState();
  renderAudit();
}

function levelFromRisk(risk){
  if(risk >= 95) return "black";
  if(risk >= 75) return "red";
  if(risk >= 50) return "amber";
  if(risk >= 25) return "yellow";
  return "green";
}
function temperamentRisk(){
  return {
    calm:8, social:12, "needs-space":28, "on-lead":26, training:30, nervous:40, reactive:78, tired:22
  }[state.temperament] ?? 28;
}
function statusLabel(){
  return {
    calm:"Calm", social:"Social", "needs-space":"Needs Space", "on-lead":"On Lead", training:"On Lead — In Training", nervous:"Nervous / Unsure", reactive:"Reactive / Overwhelmed", tired:"Tired"
  }[state.temperament] || "Needs Space";
}
function actionColour(){
  const r = temperamentRisk();
  if(r >= 75) return "red";
  if(r >= 50) return "amber";
  if(r >= 25) return "amber";
  return "green";
}
function currentPark(){ return DATA.parks.find(p=>p.id===state.selectedPark) || DATA.parks[0]; }
function combinedRisk(park=currentPark()){
  let risk = Math.max(park.risk, temperamentRisk());
  if(state.temperament === "reactive") risk = Math.max(risk, 82);
  if(state.temperament === "needs-space" && park.crowd !== "Low") risk += 12;
  if(park.alerts.some(a=>/reactive|crowded/i.test(a))) risk += 8;
  return Math.min(100, risk);
}
function combinedLevel(park=currentPark()){ return levelFromRisk(combinedRisk(park)); }
function decisionText(level, park=currentPark()){
  const label = statusLabel();
  if(level === "black") return ["Black — official emergency only", "Follow emergency services and call 000 if life-threatening."];
  if(level === "red") return ["Red — leave, wait, or choose another place", `${label} plus current conditions mean Mr Gruff needs distance and a calmer option.`];
  if(level === "amber") return ["Amber — give space and review first", `${label}. Choose calm entry, low crowd and space. Slow the interaction down.`];
  if(level === "yellow") return ["Yellow — monitor and ask first", "Conditions are mostly workable, but keep watch and reassess."];
  return ["Green — suitable with normal supervision", "Low risk right now. Still follow signs and supervise."];
}

function go(id){
  $$(".screen").forEach(s=>s.classList.remove("active"));
  const screen = $("#" + id);
  if(screen) screen.classList.add("active");
  $$(".bottom-nav button").forEach(b=>b.classList.toggle("active", b.dataset.go === id));
  state.active = id;
  saveState();
  if (window.history?.replaceState) history.replaceState(null, "", `#${id}`);
  window.scrollTo({top:0, behavior:"smooth"});
  renderAll();
}

function renderTemperament(){
  const choices = [
    ["calm","😊 Calm / relaxed"],
    ["social","🐾 Happy to play"],
    ["needs-space","🟠 Needs space"],
    ["on-lead","🦮 On lead"],
    ["training","🎓 On lead — in training"],
    ["nervous","😟 Nervous / unsure"],
    ["reactive","🔴 Reactive / overwhelmed"],
    ["tired","💤 Tired"]
  ];
  $("#temperamentChoices").innerHTML = choices.map(([key,label])=>`<button class="choice ${state.temperament===key?'selected':''}" data-temper="${key}">${label}</button>`).join("");
  $("#statusOptions").innerHTML = choices.map(([key,label])=>`<button class="status-btn ${key==='reactive'?'red':''} ${state.temperament===key?'selected':''}" data-temper="${key}">${label}</button>`).join("");
  const level = actionColour();
  const [title, msg] = decisionText(level);
  $("#temperamentScore").className = `score-pill ${level}`;
  $("#temperamentScore").textContent = level[0].toUpperCase()+level.slice(1);
  $("#homeStatusChip").className = `chip ${level}`;
  $("#homeStatusChip").textContent = statusLabel();
  $("#todayDecision").className = `decision ${level}`;
  $("#todayDecision").innerHTML = `<b>${title}</b><span>${msg}</span>`;
  $("#needsDecision").className = `decision ${level}`;
  $("#needsDecision").innerHTML = `<b>${title}</b><span>${msg}</span>`;
  $("#visitStatusChip").className = `chip ${level}`;
  $("#visitStatusChip").textContent = statusLabel();
  $("#visitDecision").className = `decision ${level}`;
  $("#visitDecision").innerHTML = `<b>${statusLabel()}</b><span>${msg}</span>`;
}

function renderPlaces(filter="all"){
  const list = $("#placeList");
  if(!list) return;
  const q = ($("#placeSearch")?.value || "").toLowerCase().trim();
  list.innerHTML = DATA.parks
    .filter(p => filter==="all" || p.type===filter)
    .filter(p => !q || (p.name+" "+p.type+" "+p.amenities.join(" ")).toLowerCase().includes(q))
    .map(p=>{
      const level = combinedLevel(p);
      const spaces = Math.max(0, p.capacity - p.dogsNow);
      return `<article class="place-card">
        <img src="${p.image}" alt="">
        <div>
          <h3>${p.name}</h3>
          <p><b>${p.type}</b> • ${p.distance} • ${p.drive}</p>
          <p>${spaces} spaces left of ${p.capacity} • ${p.area} • ${p.crowd} crowd</p>
          <p>${p.amenities.slice(0,4).join(" • ")}</p>
        </div>
        <button class="risk-score ${level}" data-place="${p.id}" data-go="details">${p.score}%</button>
      </article>`;
    }).join("") || `<article class="card">No matching place. Try clearing filters.</article>`;
}
function renderMapPlaces(){
  const list = $("#mapPlaceList");
  if(!list) return;
  list.innerHTML = DATA.parks.map(p=>`<article class="place-card">
    <img src="${p.image}" alt="">
    <div><h3>${p.name}</h3><p>${p.type} • ${p.distance} • ${p.amenities.slice(0,3).join(" • ")}</p></div>
    <button data-place="${p.id}" data-go="details">Open</button>
  </article>`).join("");
}

function renderDetails(){
  const p = currentPark();
  const spaces = Math.max(0, p.capacity - p.dogsNow);
  const level = combinedLevel(p);
  const [title,msg] = decisionText(level,p);
  $("#placeTitle").textContent = p.name;
  $("#placeImage").src = p.image;
  $("#placeDecision").className = `decision ${level}`;
  $("#placeDecision").innerHTML = `<b>${title}</b><span>${msg}</span>`;
  $("#placeDogsNow").textContent = p.dogsNow;
  $("#placeSpacesLeft").textContent = spaces;
  $("#placeCrowd").textContent = p.crowd;
  $("#placeRules").innerHTML = [
    "Owner must remain present and supervise. No dog drop-off.",
    "Respect dogs marked needs space, on lead, in training or reactive.",
    p.dogBeach ? "Dog beach: check council access times, tide, heat and signs." : "Dog park: check gates, fencing and council signs before entry.",
    p.councilNotice
  ].map(x=>`<li>${x}</li>`).join("");
  $("#amenities").innerHTML = p.amenities.slice().sort().map(x=>`<span>${x}</span>`).join("");
  $("#placeAlerts").innerHTML = p.alerts.map(a=>`<div class="alert-item amber"><b>⚠️ ${a}</b><span>Direction: create space, slow down, or choose another place if needed.</span></div>`).join("");
  $("#visitPlaceName").textContent = p.name;
  $("#visitDogsNow").textContent = p.dogsNow;
  $("#visitSpacesLeft").textContent = spaces;
  $("#visitCrowd").textContent = p.crowd;
}

function renderTrip(){
  $("#tripNeedChips").innerHTML = state.tripNeeds.slice().sort().map(x=>`<button class="active" aria-pressed="true" data-trip-need="${x}">${x}</button>`).join("") || `<span>Cleared. Choose new destination needs.</span>`;
}

function renderProfileDetails(tab="medical"){
  const panel = $("#dogDetailPanel");
  $$(".mini-tabs button").forEach(b=>b.classList.toggle("active", b.dataset.detailTab===tab));
  const sections = {
    medical:`<h3>Medical priority</h3>
      <div class="record"><span>Allergies</span><b>Add allergy details</b></div>
      <div class="record"><span>Medication</span><b>Add medication details</b></div>
      <div class="record"><span>Condition</span><b>Sensitive skin / add condition</b></div>
      <div class="record"><span>Diet</span><b>Sensitive food / add diet notes</b></div>
      <div class="record"><span>Vet</span><b>Add vet contact</b></div>`,
    behaviour:`<h3>Behaviour, likes and triggers</h3>
      <p><b>Likes:</b> ${DATA.dog.likes.join(", ")}.</p>
      <p><b>Triggers:</b> ${DATA.dog.triggers.join(", ")}.</p>
      <p><b>Today:</b> ${statusLabel()}.</p>
      <p><b>Compatibility:</b> Green when calm/low crowd, amber when needs-space, red when reactive or crowded.</p>`,
    history:`<h3>History and notes</h3>
      <ul><li>Born 08/08/2021.</li><li>Desexed male, medium, 20 kg.</li><li>Needs extra room around unknown dogs.</li><li>Prefers calm entry and low-crowd spaces.</li></ul>`,
    privacy:`<h3>Restricted emergency profile</h3>
      <div class="record"><span>Microchip</span><b>Yes — hidden unless Tracey chooses</b></div>
      <div class="record"><span>Medical</span><b>Restricted</b></div>
      <div class="record"><span>Emergency contact</span><b>2 contacts</b></div>
      <div class="record"><span>Export/delete</span><b>Controlled in Settings</b></div>`
  };
  panel.innerHTML = sections[tab] || sections.medical;
}

function renderNeeds(){
  $("#triggerChips").innerHTML = DATA.dog.triggers.slice().sort().map(x=>`<button class="active" aria-pressed="true" data-trigger="${x}">${x}</button>`).join("");
  $("#statusNote").value = state.statusNote || "";
}

function renderMates(){
  $("#mateList").innerHTML = DATA.mates.map(m=>`<article class="mate-card">
    <img src="./assets/mr-gruff-avatar.jpg" alt="">
    <div><h3>${m.name}</h3><p>${m.breed} • ${m.weight} • ${m.status}</p><span class="chip green">${m.compatibility}% compatible</span></div>
    <button data-action="sendMateAlert" data-name="${m.name}">Send alert</button>
  </article>`).join("");
}

function renderAlerts(){
  const alerts = [
    {level:"amber", title:"Reactive dog nearby", msg:"Direction: create space, wait, use another entry, or choose a calmer place."},
    {level:"amber", title:"Crowded gate at Riverside Dog Park", msg:"Direction: avoid gate pressure and enter calmly."},
    {level:"yellow", title:"Heat warning", msg:"Direction: bring water, shade and avoid hot surfaces."},
    {level:"red", title:"Unsafe person / conflict", msg:"Direction: leave the area, stay near exits, get help if unsafe."}
  ];
  $("#alertList").innerHTML = alerts.map(a=>`<div class="alert-item ${a.level}"><b>${a.title}</b><span>${a.msg}</span></div>`).join("");
}

function renderReports(){
  $("#reportsList").innerHTML = state.reports.map(r=>`<div class="alert-item ${r.level}"><b>${r.category} — ${r.location}</b><span>${r.notes || "No notes"} • ${r.at}</span></div>`).join("") || "<p>No reports saved yet.</p>";
}

function renderLostFound(){
  $("#lostFoundLog").innerHTML = state.lostFound.map(x=>`<article class="card"><h3>${x.title}</h3><p>${x.detail}</p><p class="helper">${x.at}</p></article>`).join("") || "<article class='card'>No lost/found alerts created.</article>";
}

function renderAudit(){
  const el = $("#auditList");
  if(!el) return;
  el.innerHTML = state.audit.slice(0,12).map(a=>`<div class="alert-item ${a.level}"><b>${a.title}</b><span>${a.detail || ""} ${a.at}</span></div>`).join("") || "<p>No audit entries yet.</p>";
}

function renderSettings(){
  $("#safetyShare").checked = !!state.safetyShare;
  $("#stripeFree").value = state.liveSetup?.stripeFree || "";
  $("#stripePremium").value = state.liveSetup?.stripePremium || "";
  $("#backendUrl").value = state.liveSetup?.backendUrl || "";
}

function renderAll(){
  renderTemperament();
  renderPlaces();
  renderMapPlaces();
  renderDetails();
  renderTrip();
  renderProfileDetails($(".mini-tabs button.active")?.dataset.detailTab || "medical");
  renderNeeds();
  renderMates();
  renderAlerts();
  renderReports();
  renderLostFound();
  renderAudit();
  renderSettings();
}

document.addEventListener("click", e => {
  const goBtn = e.target.closest("[data-go]");
  if(goBtn){
    if(goBtn.dataset.place) state.selectedPark = goBtn.dataset.place;
    go(goBtn.dataset.go);
  }
  const filter = e.target.closest("[data-filter]");
  if(filter){
    $$(".filter-row button").forEach(b=>b.classList.remove("active"));
    filter.classList.add("active");
    renderPlaces(filter.dataset.filter);
  }
  const temper = e.target.closest("[data-temper]");
  if(temper){
    state.temperament = temper.dataset.temper;
    audit("Temperament updated", `Mr Gruff set to ${statusLabel()}`, actionColour());
    renderAll();
  }
  const detail = e.target.closest("[data-detail-tab]");
  if(detail) renderProfileDetails(detail.dataset.detailTab);

  const action = e.target.closest("[data-action]")?.dataset.action;
  if(!action) return;

  if(action === "checkIn"){
    state.checkedIn = true;
    audit("Checked in", `${DATA.dog.name} checked in at ${currentPark().name}`, combinedLevel());
    go("visit");
  }
  if(action === "checkOut"){
    state.checkedIn = false;
    audit("Checked out", `${DATA.dog.name} left ${currentPark().name}`, "green");
    alert("Checked out. Safety Share contacts can be notified if turned on.");
    go("home");
  }
  if(action === "bestMate"){
    $("#bestMateFlash").style.display = "flex";
    audit("Best mate alert", "Luna is here", "green");
    go("mates");
  }
  if(action === "incognito"){
    state.incognito = !state.incognito;
    audit("Incognito changed", state.incognito ? "Incognito on — presence hidden" : "Incognito off", "amber");
    alert(state.incognito ? "Incognito on. Best mate alerts are hidden." : "Incognito off.");
  }
  if(action === "stillHere"){
    audit("Owner supervision confirmed", "Tracey confirmed she is still with Mr Gruff", "green");
    alert("Owner supervision confirmed.");
  }
  if(action === "reportUnattended"){
    state.reports.unshift({level:"amber",category:"Unattended dog",location:currentPark().name,notes:"Dog left unattended / owner not watching",at:new Date().toLocaleString()});
    audit("Unattended dog report", currentPark().name, "amber");
    go("incident");
  }
  if(action === "clearTripNeeds"){
    state.tripNeeds = [];
    audit("Trip needs cleared", "Ready for new destination", "green");
    renderTrip();
  }
  if(action === "makeRoute"){
    $("#routeMap").innerHTML = `<b>${$("#tripFrom").value} → ${$("#tripTo").value}</b><span>Balanced dog-friendly itinerary generated: dog parks, dog beaches, caravan parks, vets, water, fuel, shade and rest stops.</span>`;
    audit("Trip route generated", `${$("#tripFrom").value} to ${$("#tripTo").value}`, "green");
  }
  if(action === "saveStatus"){
    state.statusNote = $("#statusNote").value;
    audit("Status saved", `${statusLabel()} — ${state.statusNote || "No extra note"}`, actionColour());
    alert("Status saved.");
    renderAll();
  }
  if(action === "sendMateAlert"){
    audit("Best mate alert sent", e.target.dataset.name || "Mate", "green");
    alert("Best mate alert sent to approved friend only.");
  }
  if(action === "shareLostDog"){
    state.lostFound.unshift({title:"Lost dog alert draft",detail:"Restricted emergency profile ready to share only if Tracey confirms.",at:new Date().toLocaleString()});
    audit("Lost dog alert draft created", "Restricted profile protected", "amber");
    renderLostFound();
  }
  if(action === "foundDog"){
    state.lostFound.unshift({title:"Found dog report",detail:"Found dog report saved locally. Add photo and location in production.",at:new Date().toLocaleString()});
    audit("Found dog report created", "Saved locally", "amber");
    renderLostFound();
  }
  if(action === "saveLiveSetup"){
    state.liveSetup = {stripeFree:$("#stripeFree").value, stripePremium:$("#stripePremium").value, backendUrl:$("#backendUrl").value};
    audit("Live setup saved", "Stripe/backend placeholders stored locally", "green");
    alert("Live setup saved locally.");
  }
  if(action === "exportData"){
    const blob = new Blob([JSON.stringify(state,null,2)], {type:"application/json"});
    const a = Object.assign(document.createElement("a"), {href:URL.createObjectURL(blob), download:"genevieve-dogpark-local-export.json"});
    document.body.appendChild(a); a.click(); a.remove();
    audit("Local app data exported", "JSON download created", "green");
  }
  if(action === "clearData"){
    if(confirm("Delete local demo data from this browser?")){
      localStorage.removeItem("genevieve_dogpark_blueprint_state");
      state = {...defaultState};
      audit("Local data reset", "Demo data cleared", "amber");
      renderAll();
    }
  }
  if(action === "openSos"){
    const d = $("#sosDialog");
    if(d?.showModal) d.showModal();
  }
});

document.addEventListener("change", e => {
  if(e.target.id === "safetyShare"){
    state.safetyShare = e.target.checked;
    audit("Safety Share changed", state.safetyShare ? "Safety Share on" : "Safety Share off", state.safetyShare ? "green" : "amber");
    saveState();
  }
});

$("#placeSearch")?.addEventListener("input", ()=> renderPlaces($(".filter-row button.active")?.dataset.filter || "all"));

$("#incidentForm")?.addEventListener("submit", e => {
  e.preventDefault();
  const f = new FormData(e.target);
  state.reports.unshift({
    level:f.get("level"), category:f.get("category"), location:f.get("location"), notes:f.get("notes"), at:new Date().toLocaleString()
  });
  audit("Incident report saved", `${f.get("category")} at ${f.get("location")}`, f.get("level"));
  e.target.reset();
  renderReports();
});

$("#closeSos")?.addEventListener("click", ()=> $("#sosDialog").close());
let sosTimer = null;
$("#holdSos")?.addEventListener("pointerdown", e => {
  e.target.textContent = "Holding... keep pressing";
  sosTimer = setTimeout(()=>{
    e.target.textContent = "Opening 000 call screen...";
    audit("Emergency call screen opened", "Protected hold completed", "black");
    window.location.href = "tel:000";
  }, 3000);
});
["pointerup","pointerleave","pointercancel"].forEach(evt => $("#holdSos")?.addEventListener(evt, e => {
  clearTimeout(sosTimer);
  e.target.textContent = "Press and hold 3 seconds";
}));

document.addEventListener("DOMContentLoaded", () => {
  renderAll();
  const requestedScreen = location.hash.replace(/^#/, "");
  const validRequestedScreen = requestedScreen && document.getElementById(requestedScreen)?.classList.contains("screen");
  go(validRequestedScreen ? requestedScreen : (state.active || "home"));
  if("serviceWorker" in navigator && location.protocol.startsWith("http")){
    navigator.serviceWorker.register("./sw.js").catch(()=>{});
  }
});