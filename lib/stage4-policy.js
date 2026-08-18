export const STAGE4_POLICY_VERSION='stage4-candidate-2026-08-18';

export const STAGE4_GATES=Object.freeze({
  numericScoringEnabled:false,
  surfaceHeatEstimateEnabled:false,
  liveWeatherEnabled:false,
  expertReviewStatus:'PENDING'
});

export const RISK_SCALE=Object.freeze([
  Object.freeze({min:1,max:3,code:'GREEN',label:'Lower risk',guidance:'Proceed only while conditions remain consistent.'}),
  Object.freeze({min:4,max:5,code:'YELLOW',label:'Caution',guidance:'Add controls, recheck and stay ready to leave.'}),
  Object.freeze({min:6,max:7,code:'AMBER',label:'High concern',guidance:'Delay or choose another option.'}),
  Object.freeze({min:8,max:10,code:'RED',label:'Highest concern',guidance:'Do not proceed now; leave or avoid and use appropriate professional or emergency help.'})
]);

const text=v=>typeof v==='string'?v.trim():'';
const bool=v=>v===true?'YES':v===false?'NO':'UNKNOWN';
const known=v=>v!==null&&v!==undefined&&v!=='';

export function bandForScore(score){
  if(!Number.isInteger(score)||score<1||score>10)throw new RangeError('stage4-score-must-be-integer-1-to-10');
  return RISK_SCALE.find(x=>score>=x.min&&score<=x.max);
}

export function sourceState(park){
  if(!park)return {status:'UNKNOWN',authority:'Unknown',freshness:'UNKNOWN',verified:false};
  const status=text(park.verificationStatus)||text(park.verification_status)||'UNKNOWN';
  const authority=text(park.source?.authorityName)||text(park.authority_name)||'Unknown';
  const sourceDate=park.sourceUpdatedAt||park.source_updated_at||park.source?.lastVerifiedAt||park.last_verified_at||park.fetchedAt||park.fetched_at||null;
  let freshness='UNKNOWN';
  if(sourceDate){
    const d=new Date(sourceDate);
    if(!Number.isNaN(d.getTime())){
      const days=Math.max(0,Math.floor((Date.now()-d.getTime())/86400000));
      freshness=days===0?'CURRENT_TODAY':days<=30?'CURRENT_RECENT':`AGE_${days}_DAYS`;
    }
  }
  return {status,authority,freshness,verified:status==='VERIFIED_OFFICIAL'};
}

function facilities(park){return park?.facilities??park??{};}
function publicDog(d){
  return {
    dogId:d?.dog_id??d?.dogId??null,
    name:text(d?.name)||'Unnamed dog',
    ageYears:known(d?.age_years??d?.ageYears)?Number(d?.age_years??d?.ageYears):'UNKNOWN',
    sizeGroup:text(d?.size_group??d?.sizeGroup)||'UNKNOWN',
    energyLevel:text(d?.energy_level??d?.energyLevel)||'UNKNOWN',
    playStyle:text(d?.play_style??d?.playStyle)||'UNKNOWN',
    socialComfort:text(d?.social_comfort??d?.socialComfort)||'UNKNOWN',
    approachPreferences:text(d?.approach_preferences??d?.approachPreferences)||'UNKNOWN',
    knownTriggers:text(d?.known_triggers??d?.knownTriggers)||'UNKNOWN',
    reactivityNotes:text(d?.reactivity_notes??d?.reactivityNotes)||'UNKNOWN',
    toleranceNotes:text(d?.tolerance_notes??d?.toleranceNotes)||'UNKNOWN',
    playIntensity:text(d?.play_intensity??d?.playIntensity)||'UNKNOWN',
    resourceSharingNotes:text(d?.resource_sharing_notes??d?.resourceSharingNotes)||'UNKNOWN',
    guardingNotes:text(d?.guarding_notes??d?.guardingNotes)||'UNKNOWN',
    extraCareNeeds:text(d?.extra_care_needs??d?.extraCareNeeds)||'UNKNOWN',
    mobilityLimitations:text(d?.mobility_limitations??d?.mobilityLimitations)||'UNKNOWN',
    confidenceLevel:text(d?.confidence_level??d?.confidenceLevel)||'UNKNOWN'
  };
}

const obsValue=(o,k,allowed)=>{const v=text(o?.[k]).toUpperCase();return allowed.includes(v)?v:'UNKNOWN';};

export function assessSuitabilityContext({dog,park,observations={}}={}){
  if(!dog)throw new TypeError('dog-required');
  if(!park)throw new TypeError('park-required');
  const f=facilities(park),src=sourceState(park),d=publicDog(dog);
  const obs={
    dogState:obsValue(observations,'dogState',['BASELINE','OFF_GAME','REACTIVE','PLAYFUL','UNKNOWN']),
    ownerReady:obsValue(observations,'ownerReady',['YES','NO','UNKNOWN']),
    equipmentReady:obsValue(observations,'equipmentReady',['YES','NO','UNKNOWN']),
    waterCarried:obsValue(observations,'waterCarried',['YES','NO','UNKNOWN']),
    gateChecked:obsValue(observations,'gateChecked',['YES','NO','UNKNOWN']),
    spaceObserved:obsValue(observations,'spaceObserved',['YES','NO','UNKNOWN'])
  };
  const reasons=[
    {factor:'dog-age-years',value:String(d.ageYears),source:'owner-profile',meaning:'Life-stage information is surfaced for review without applying an unapproved medical or behavioural weight.'},
    {factor:'park-source',value:src.status,source:src.authority,meaning:src.verified?'Official park record is verified.':'Park verification is not confirmed as verified official.'},
    {factor:'fencing',value:bool(f.fenced),source:'park-record',meaning:'Fencing is considered as a structural park fact only.'},
    {factor:'double-gate',value:bool(f.doubleGate??f.double_gate),source:'park-record',meaning:'Gate structure is considered separately from a current physical gate check.'},
    {factor:'shade',value:bool(f.shade),source:'park-record',meaning:'Shade availability is relevant to planning but does not determine heat safety by itself.'},
    {factor:'dog-water',value:bool(f.dogWaterBowls??f.dog_water_bowls),source:'park-record',meaning:'Recorded dog-water availability is shown without assuming it is currently functioning.'},
    {factor:'tap-water',value:bool(f.tapWater??f.tap_water),source:'park-record',meaning:'Recorded tap-water availability is shown without assuming it is currently functioning.'},
    {factor:'selected-dog-state',value:obs.dogState,source:'owner-observation',meaning:'Temporary dog state is kept separate from the stable dog profile.'},
    {factor:'owner-readiness',value:obs.ownerReady,source:'owner-observation',meaning:'Handler readiness is a required planning input.'},
    {factor:'equipment-readiness',value:obs.equipmentReady,source:'owner-observation',meaning:'Equipment readiness is a required planning input.'},
    {factor:'water-carried',value:obs.waterCarried,source:'owner-observation',meaning:'Carried water is recorded separately from park facilities.'},
    {factor:'gate-currently-checked',value:obs.gateChecked,source:'owner-observation',meaning:'A current gate observation is not inferred from static park data.'},
    {factor:'space-currently-observed',value:obs.spaceObserved,source:'owner-observation',meaning:'Current space is not inferred from a future occupancy phase.'}
  ];
  const unknowns=[];
  if(!src.verified)unknowns.push('Verified-official source status is not available for this selected park.');
  for(const [label,v] of [['current dog state',obs.dogState],['owner readiness',obs.ownerReady],['equipment readiness',obs.equipmentReady],['carried water',obs.waterCarried],['current gate check',obs.gateChecked],['current available space',obs.spaceObserved]])if(v==='UNKNOWN')unknowns.push(`${label} is unknown.`);
  for(const [label,v] of [['fencing',f.fenced],['double-gate',f.doubleGate??f.double_gate],['shade',f.shade],['dog water',f.dogWaterBowls??f.dog_water_bowls],['tap water',f.tapWater??f.tap_water]])if(!known(v))unknowns.push(`${label} is not supplied by the selected park record.`);
  unknowns.push('Live weather and forecast heat conditions are not connected in Stage 4.');
  unknowns.push('Surface/path temperature estimation is disabled pending validation and expert review.');
  unknowns.push('Live occupancy, crowd mix and active on-site hazards belong to later chronological phases.');
  const controls=['Check current official signage, closures, gates and physical conditions on arrival.','Carry suitable drinking water and do not rely on a recorded facility being operational.','Recheck if the dog, handler, weather, crowd or park conditions change.','Choose another park, time or lower-intensity activity when important information is missing or current conditions do not fit the dog.'];
  if(obs.ownerReady==='NO'||obs.equipmentReady==='NO')controls.unshift('Resolve handler/equipment readiness before proceeding.');
  if(obs.gateChecked==='NO')controls.unshift('Do not rely on the park record for gate condition; use another controlled option until the gate can be physically checked.');
  if(obs.spaceObserved==='NO')controls.unshift('Choose another time or place with more space rather than relying on a static park suitability result.');
  return {
    policyVersion:STAGE4_POLICY_VERSION,
    assessmentStatus:'POLICY_GATED',
    score:null,
    band:'UNKNOWN',
    label:'Not numerically scored',
    guidance:'Review the reasons, unknowns and controls. A favourable structural match is never a safety guarantee.',
    numericScale:RISK_SCALE,
    sourceState:src,
    dog:{dogId:d.dogId,name:d.name,sizeGroup:d.sizeGroup},
    park:{parkId:park.parkId??park.park_id??null,name:text(park.name)||'Selected park'},
    observations:obs,
    reasons,unknowns:[...new Set(unknowns)],controls:[...new Set(controls)],
    heat:{status:'POLICY_GATED',liveWeatherEnabled:STAGE4_GATES.liveWeatherEnabled,surfaceHeatEstimateEnabled:STAGE4_GATES.surfaceHeatEstimateEnabled,shadeRecorded:bool(f.shade),dogWaterRecorded:bool(f.dogWaterBowls??f.dog_water_bowls),tapWaterRecorded:bool(f.tapWater??f.tap_water),score:null}
  };
}

export function assessCompatibilityContext({dogs,park=null,mode='PAIR'}={}){
  const list=Array.isArray(dogs)?dogs.map(publicDog):[];
  const m=text(mode).toUpperCase()==='GROUP'?'GROUP':'PAIR';
  if(m==='PAIR'&&list.length!==2)throw new TypeError('pair-requires-two-dogs');
  if(m==='GROUP'&&(list.length<3||list.length>5))throw new TypeError('group-requires-three-to-five-dogs');
  const fields=['ageYears','sizeGroup','energyLevel','playStyle','socialComfort','approachPreferences','knownTriggers','reactivityNotes','toleranceNotes','playIntensity','resourceSharingNotes','guardingNotes','extraCareNeeds','mobilityLimitations','confidenceLevel'];
  const factors=fields.map(field=>({factor:field,dogs:list.map(d=>({dogId:d.dogId,name:d.name,value:d[field]})),meaning:'Owner-entered behavioural/context information is surfaced for comparison; it is not converted into a breed-based or diagnostic verdict.'}));
  const unknowns=[];
  for(const d of list)for(const field of fields)if(d[field]==='UNKNOWN')unknowns.push(`${d.name}: ${field} is unknown.`);
  unknowns.push('Current crowd context is unknown until the later presence/occupancy phase.');
  unknowns.push('A previous friendship or favourable comparison never guarantees a safe interaction today.');
  const controls=['Use gradual, supervised introductions and maintain enough space to disengage.','Respect any dog or handler signalling a need for space.','Stop or lower interaction intensity if current behaviour differs from the stored profile.','Do not use breed alone as a compatibility decision.'];
  return {policyVersion:STAGE4_POLICY_VERSION,assessmentStatus:'POLICY_GATED',mode:m,score:null,band:'UNKNOWN',label:'Not numerically scored',guidance:'Review each factor and current behaviour; this is decision support, not a safe/unsafe verdict.',park:park?{parkId:park.parkId??park.park_id??null,name:text(park.name)||'Selected park',sourceState:sourceState(park)}:null,dogs:list.map(({dogId,name,sizeGroup})=>({dogId,name,sizeGroup})),factors,unknowns:[...new Set(unknowns)],controls};
}
