export const STAGE5_POLICY_VERSION='stage5-presence-privacy-2026-08-18';
export const OWNER_DUTY_MINUTES=Object.freeze([5,10,15,20]);
export const OWNER_LOCATION_STATES=Object.freeze(['UNKNOWN','INSIDE','AT_GATE','OUTSIDE','LEFT']);
export const DOG_VISIT_STATES=Object.freeze(['UNKNOWN','PLAYFUL','OFF_GAME','NEEDS_SPACE','REACTIVE','ON_LEAD','IN_TRAINING','UNWELL','ANXIOUS']);
export const PRIVACY_MODES=Object.freeze(['PRIVATE','INCOGNITO']);
export const STAGE5_GATES=Object.freeze({
  publicAttendanceEnabled:false,
  occupancyPolicyStatus:'PENDING',
  staleVisitExpiryPolicyStatus:'PENDING',
  boundaryPolicyStatus:'SOURCE_REQUIRED',
  nightPrivacyEnabled:true
});

const RAD=Math.PI/180;
const DEG=180/Math.PI;
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));

export function validateDutyMinutes(value){
  const n=Number(value);
  if(!OWNER_DUTY_MINUTES.includes(n))throw Object.assign(new Error('invalid-owner-duty-interval'),{statusCode:400});
  return n;
}

export function validateVisitState(value='UNKNOWN'){
  const v=String(value||'UNKNOWN').toUpperCase();
  if(!DOG_VISIT_STATES.includes(v))throw Object.assign(new Error('invalid-dog-visit-state'),{statusCode:400});
  return v;
}

export function validateOwnerLocation(value='UNKNOWN'){
  const v=String(value||'UNKNOWN').toUpperCase();
  if(!OWNER_LOCATION_STATES.includes(v))throw Object.assign(new Error('invalid-owner-location-state'),{statusCode:400});
  return v;
}

export function validatePrivacyMode(value='PRIVATE'){
  const v=String(value||'PRIVATE').toUpperCase();
  if(!PRIVACY_MODES.includes(v))throw Object.assign(new Error('invalid-privacy-mode'),{statusCode:400});
  return v;
}

export function derivePresenceStatus(visit,now=new Date()){
  if(!visit)return 'NOT_CHECKED_IN';
  if(visit.departure_at||visit.departureAt)return 'CHECKED_OUT';
  const owner=String(visit.owner_location_state??visit.ownerLocationState??'UNKNOWN').toUpperCase();
  if(owner==='LEFT')return 'OWNER_LEFT_CHECKOUT_DUE';
  const due=visit.duty_due_at??visit.dutyDueAt;
  if(!due)return 'UNCERTAIN';
  const dueMs=new Date(due).getTime(),nowMs=new Date(now).getTime();
  if(!Number.isFinite(dueMs)||!Number.isFinite(nowMs))return 'UNCERTAIN';
  return dueMs<=nowMs?'SUPERVISION_CONFIRMATION_DUE':'CONFIRMED_PRIVATE';
}

function localDateParts(now,timeZone){
  try{
    const f=new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit'});
    const parts=Object.fromEntries(f.formatToParts(now).filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));
    const y=Number(parts.year),m=Number(parts.month),d=Number(parts.day);
    if(!y||!m||!d)return null;
    return {year:y,month:m,day:d};
  }catch{return null;}
}

function dayOfYear({year,month,day}){
  const start=Date.UTC(year,0,0),current=Date.UTC(year,month-1,day);
  return Math.floor((current-start)/86400000);
}

function solarUtcMinutes(dateParts,latitude,longitude,zenithDeg){
  const n=dayOfYear(dateParts);
  const b=2*Math.PI*(n-81)/364;
  const equation=9.87*Math.sin(2*b)-7.53*Math.cos(b)-1.5*Math.sin(b);
  const declination=23.45*Math.sin(2*Math.PI*(284+n)/365)*RAD;
  const lat=latitude*RAD,zenith=zenithDeg*RAD;
  const cosH=(Math.cos(zenith)/(Math.cos(lat)*Math.cos(declination)))-Math.tan(lat)*Math.tan(declination);
  if(cosH>1||cosH<-1)return null;
  const hourAngle=Math.acos(clamp(cosH,-1,1))*DEG;
  const noon=720-(4*longitude)-equation;
  return {rise:noon-(4*hourAngle),set:noon+(4*hourAngle)};
}

function eventDate(parts,minutes){
  if(!finite(minutes))return null;
  return new Date(Date.UTC(parts.year,parts.month-1,parts.day,0,Math.round(minutes),0,0));
}

function formatLocal(date,timeZone){
  if(!(date instanceof Date)||Number.isNaN(date.getTime()))return null;
  try{return new Intl.DateTimeFormat('en-AU',{timeZone,hour:'numeric',minute:'2-digit'}).format(date);}catch{return null;}
}

export function getSolarState({latitude,longitude,timeZone,now=new Date()}={}){
  const lat=Number(latitude),lon=Number(longitude),instant=new Date(now);
  if(!finite(lat)||!finite(lon)||lat<-90||lat>90||lon<-180||lon>180||!timeZone||Number.isNaN(instant.getTime()))return {status:'UNAVAILABLE',phase:'UNKNOWN',nightPrivacy:true,reason:'verified-park-solar-inputs-required'};
  const parts=localDateParts(instant,timeZone);
  if(!parts)return {status:'UNAVAILABLE',phase:'UNKNOWN',nightPrivacy:true,reason:'invalid-or-unavailable-park-time-zone'};
  const sun=solarUtcMinutes(parts,lat,lon,90.833),civil=solarUtcMinutes(parts,lat,lon,96);
  if(!sun||!civil)return {status:'UNAVAILABLE',phase:'UNKNOWN',nightPrivacy:true,reason:'solar-events-unavailable-for-location'};
  const sunrise=eventDate(parts,sun.rise),sunset=eventDate(parts,sun.set),civilDawn=eventDate(parts,civil.rise),civilDusk=eventDate(parts,civil.set);
  if(!sunrise||!sunset||!civilDawn||!civilDusk)return {status:'UNAVAILABLE',phase:'UNKNOWN',nightPrivacy:true,reason:'solar-event-calculation-failed'};
  const t=instant.getTime(),sr=sunrise.getTime(),ss=sunset.getTime(),cd=civilDawn.getTime(),ck=civilDusk.getTime();
  let phase='NIGHT',next=sunrise;
  if(t>=cd&&t<sr){phase='PRE_DAWN';next=sunrise;}
  else if(t>=sr&&t<ss){phase='DAYLIGHT';next=sunset;}
  else if(t>=ss&&t<ck){phase='DUSK';next=civilDusk;}
  else if(t<cd){phase='NIGHT';next=civilDawn;}
  else {phase='NIGHT';next=null;}
  const nightPrivacy=phase!=='DAYLIGHT';
  return {status:'CALCULATED',phase,nightPrivacy,timeZone,date:`${parts.year}-${String(parts.month).padStart(2,'0')}-${String(parts.day).padStart(2,'0')}`,sunrise:sunrise.toISOString(),sunset:sunset.toISOString(),civilDawn:civilDawn.toISOString(),civilDusk:civilDusk.toISOString(),sunriseLocal:formatLocal(sunrise,timeZone),sunsetLocal:formatLocal(sunset,timeZone),civilDawnLocal:formatLocal(civilDawn,timeZone),civilDuskLocal:formatLocal(civilDusk,timeZone),nextTransition:next?.toISOString()??null,nextTransitionLocal:next?formatLocal(next,timeZone):null};
}

export function publicAttendanceState({solarState,policy=STAGE5_GATES}={}){
  if(solarState?.status!=='CALCULATED')return {available:false,state:'HIDDEN_SOLAR_UNKNOWN',wording:'Public park attendance is hidden because park-local solar status is unavailable or unverified.'};
  if(policy?.nightPrivacyEnabled!==false&&solarState?.nightPrivacy===true)return {available:false,state:'HIDDEN_NIGHT_SAFETY',wording:'NIGHT SAFETY MODE ACTIVE — Live park attendance is hidden from sunset until sunrise to protect park-user privacy and safety.'};
  if(policy?.publicAttendanceEnabled!==true)return {available:false,state:'HIDDEN_POLICY_PENDING',wording:'Public park attendance remains hidden while the reviewed delay, batching and anti-inference policy is pending.'};
  return {available:true,state:'COARSE_POLICY_READY',wording:'Only reviewed coarse, delayed attendance may be shown. Exact counts and identities remain prohibited.'};
}

export function boundaryDecision({userLatitude,userLongitude,accuracyM,parkLatitude,parkLongitude,boundaryPolicy}={}){
  const uLat=Number(userLatitude),uLon=Number(userLongitude),accuracy=Number(accuracyM),pLat=Number(parkLatitude),pLon=Number(parkLongitude);
  if(!boundaryPolicy||boundaryPolicy.verified!==true)return {decision:'UNKNOWN',reason:'verified-boundary-policy-required',preciseLocationStored:false};
  if(boundaryPolicy.type!=='CIRCLE'||!finite(Number(boundaryPolicy.radiusM))||!finite(Number(boundaryPolicy.maxAccuracyM)))return {decision:'UNKNOWN',reason:'supported-verified-boundary-definition-required',preciseLocationStored:false};
  if(![uLat,uLon,accuracy,pLat,pLon].every(finite)||uLat<-90||uLat>90||pLat<-90||pLat>90||uLon<-180||uLon>180||pLon<-180||pLon>180||accuracy<0)return {decision:'UNKNOWN',reason:'valid-current-location-required',preciseLocationStored:false};
  if(accuracy>Number(boundaryPolicy.maxAccuracyM))return {decision:'UNKNOWN',reason:'location-accuracy-insufficient',preciseLocationStored:false,accuracyState:'LOW_ACCURACY'};
  const dLat=(pLat-uLat)*RAD,dLon=(pLon-uLon)*RAD;
  const a=Math.sin(dLat/2)**2+Math.cos(uLat*RAD)*Math.cos(pLat*RAD)*Math.sin(dLon/2)**2;
  const distance=6371000*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
  const radius=Number(boundaryPolicy.radiusM);
  if(distance+accuracy<=radius)return {decision:'IN_BOUNDARY',reason:'verified-boundary-check',preciseLocationStored:false,accuracyState:'ACCEPTED'};
  if(distance-accuracy>radius)return {decision:'OUTSIDE',reason:'verified-boundary-check',preciseLocationStored:false,accuracyState:'ACCEPTED'};
  return {decision:'UNKNOWN',reason:'accuracy-overlaps-boundary-edge',preciseLocationStored:false,accuracyState:'EDGE_UNCERTAIN'};
}
