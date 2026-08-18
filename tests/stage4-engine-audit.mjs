import {RISK_SCALE,STAGE4_GATES,assessCompatibilityContext,assessSuitabilityContext,bandForScore} from '../lib/stage4-policy.js';
if(JSON.stringify(RISK_SCALE.map(x=>[x.min,x.max,x.code]))!==JSON.stringify([[1,3,'GREEN'],[4,5,'YELLOW'],[6,7,'AMBER'],[8,10,'RED']]))throw new Error('controlled 1-10 scale changed');
for(const [score,band] of [[1,'GREEN'],[3,'GREEN'],[4,'YELLOW'],[5,'YELLOW'],[6,'AMBER'],[7,'AMBER'],[8,'RED'],[10,'RED']])if(bandForScore(score).code!==band)throw new Error(`band mapping failed ${score}`);
for(const bad of [0,11,3.5,'4']){let threw=false;try{bandForScore(bad);}catch{threw=true;}if(!threw)throw new Error('invalid score accepted');}
if(STAGE4_GATES.numericScoringEnabled||STAGE4_GATES.surfaceHeatEstimateEnabled||STAGE4_GATES.liveWeatherEnabled)throw new Error('expert/provider gate enabled early');
const dog={dog_id:'d1',name:'Gruff',age_years:5,size_group:'MEDIUM',energy_level:'moderate',play_style:'parallel',reactivity_notes:'owner note'};
const park={parkId:'p1',name:'Test Park',verificationStatus:'VERIFIED_OFFICIAL',sourceUpdatedAt:new Date().toISOString(),source:{authorityName:'Council'},facilities:{fenced:true,doubleGate:null,shade:true,dogWaterBowls:false,tapWater:true}};
const a=assessSuitabilityContext({dog,park,observations:{dogState:'BASELINE',ownerReady:'YES',equipmentReady:'YES',waterCarried:'YES',gateChecked:'UNKNOWN',spaceObserved:'UNKNOWN'}});
if(a.score!==null||a.band!=='UNKNOWN'||a.assessmentStatus!=='POLICY_GATED')throw new Error('unapproved suitability score emitted');
if(!a.unknowns.some(x=>x.includes('Live weather'))||!a.unknowns.some(x=>x.includes('Surface/path')))throw new Error('heat/provider uncertainty missing');
if(a.heat.surfaceHeatEstimateEnabled!==false||a.heat.liveWeatherEnabled!==false)throw new Error('heat gates bypassed');
const b=assessCompatibilityContext({dogs:[dog,{...dog,dog_id:'d2',name:'Luna',size_group:'LARGE'}],park,mode:'PAIR'});
if(b.score!==null||b.band!=='UNKNOWN'||b.mode!=='PAIR')throw new Error('unapproved compatibility verdict emitted');
if(b.factors.some(f=>f.factor.toLowerCase().includes('breed'))||b.dogs.some(d=>Object.hasOwn(d,'breed')||Object.hasOwn(d,'breedMix')))throw new Error('breed data entered compatibility assessment');
let groupRejected=false;try{assessCompatibilityContext({dogs:[dog,{...dog,dog_id:'d2'}],mode:'GROUP'});}catch{groupRejected=true;}if(!groupRejected)throw new Error('invalid group size accepted');
console.log('Stage 4 engine audit PASS: controlled scale encoded, numeric/heat/provider gates closed, suitability and compatibility remain explainable without fabricated scores.');
