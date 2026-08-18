import {cleanString,requireSession} from './stage3.js';
import {STAGE4_GATES,STAGE4_POLICY_VERSION} from '../lib/stage4-policy.js';

export function requireStage4Mutation(req){
  const marker=req.headers?.['x-genevieve-stage4']??req.headers?.get?.('x-genevieve-stage4');
  if(String(marker??'')!=='1')throw Object.assign(new Error('stage4-mutation-marker-required'),{statusCode:403});
}

export function stage4Unavailable(res){return res.status(503).json({ok:false,error:'stage4-database-not-configured',message:'Stage 4 secure decision-support persistence is unavailable until V003 is applied.'});}

export function stage4SendError(res,error){
  const status=Number(error?.statusCode)||500;
  if(status>=500)console.error('Stage 4 API error',error instanceof Error?error.message:'unknown-error');
  return res.status(status).json({ok:false,error:status>=500?'stage4-server-error':(error?.message||'invalid-request')});
}

export async function requireStage4Ready(sql,req){
  const session=await requireSession(sql,req);
  const rows=await sql`SELECT policy_version,numeric_scoring_enabled,surface_heat_estimate_enabled,live_weather_enabled,expert_review_status FROM stage4.policy_state WHERE singleton_id=1 LIMIT 1`;
  const policy=rows[0]??null;
  if(!policy)throw Object.assign(new Error('stage4-policy-not-initialised'),{statusCode:503});
  return {session,policy};
}

export function publicPolicy(policy=null){return {policyVersion:cleanString(policy?.policy_version,120)||STAGE4_POLICY_VERSION,numericScoringEnabled:Boolean(policy?.numeric_scoring_enabled??STAGE4_GATES.numericScoringEnabled),surfaceHeatEstimateEnabled:Boolean(policy?.surface_heat_estimate_enabled??STAGE4_GATES.surfaceHeatEstimateEnabled),liveWeatherEnabled:Boolean(policy?.live_weather_enabled??STAGE4_GATES.liveWeatherEnabled),expertReviewStatus:cleanString(policy?.expert_review_status,40)||STAGE4_GATES.expertReviewStatus};}

export async function loadOwnedDog(sql,sessionId,dogId){
  const rows=await sql`SELECT dog_id,name,age_years,size_group,energy_level,play_style,social_comfort,approach_preferences,likes,dislikes,known_triggers,sociability_notes,reactivity_notes,tolerance_notes,play_intensity,resource_sharing_notes,guarding_notes,extra_care_needs,swimming_ability,mobility_limitations,favourite_toys,exercise_level,confidence_level,visibility_mode FROM stage3.dog_profiles WHERE session_id=${sessionId} AND dog_id=${dogId} AND archived_at IS NULL LIMIT 1`;
  return rows[0]??null;
}

export async function loadOwnedDogs(sql,sessionId,dogIds){
  const unique=[...new Set(dogIds.map(x=>cleanString(x,80)).filter(Boolean))];
  if(!unique.length)return [];
  const rows=await sql`SELECT dog_id,name,age_years,size_group,energy_level,play_style,social_comfort,approach_preferences,likes,dislikes,known_triggers,sociability_notes,reactivity_notes,tolerance_notes,play_intensity,resource_sharing_notes,guarding_notes,extra_care_needs,swimming_ability,mobility_limitations,favourite_toys,exercise_level,confidence_level,visibility_mode FROM stage3.dog_profiles WHERE session_id=${sessionId} AND dog_id=ANY(${unique}) AND archived_at IS NULL ORDER BY name ASC`;
  return rows;
}

export async function loadSelectedPark(sql,sessionId){
  const rows=await sql`SELECT p.park_id,p.name,p.locality,p.state_code,p.postcode,p.park_type,p.area_m2,p.fenced,p.double_gate,p.separate_small_dog_area,p.separate_large_dog_area,p.beach_water_access,p.puppy_area,p.shade,p.dog_water_bowls,p.tap_water,p.toilets,p.seating,p.lighting,p.agility_equipment,p.training_friendly,p.accessible_features,p.easy_parking,p.caravan_parking,p.cafes_nearby,p.bbq_picnic,p.bins,p.waste_bags,p.official_rules,p.opening_hours,p.off_leash_schedule,p.source_attributes,p.source_updated_at,p.fetched_at,p.verification_status,s.source_id,s.authority_name,s.dataset_name,s.source_type,s.jurisdiction,s.attribution,s.last_verified_at FROM stage3.selected_parks sp JOIN stage3.parks p ON p.park_id=sp.park_id LEFT JOIN stage3.park_sources s ON s.source_id=p.source_id WHERE sp.session_id=${sessionId} AND p.retired_at IS NULL LIMIT 1`;
  const p=rows[0]??null;if(!p)return null;
  return {parkId:p.park_id,name:p.name,locality:p.locality,stateCode:p.state_code,postcode:p.postcode,parkType:p.park_type,areaM2:p.area_m2,facilities:{fenced:p.fenced,doubleGate:p.double_gate,separateSmallDogArea:p.separate_small_dog_area,separateLargeDogArea:p.separate_large_dog_area,beachWaterAccess:p.beach_water_access,puppyArea:p.puppy_area,shade:p.shade,dogWaterBowls:p.dog_water_bowls,tapWater:p.tap_water,toilets:p.toilets,seating:p.seating,lighting:p.lighting,agilityEquipment:p.agility_equipment,trainingFriendly:p.training_friendly,accessibleFeatures:p.accessible_features,easyParking:p.easy_parking,caravanParking:p.caravan_parking,cafesNearby:p.cafes_nearby,bbqPicnic:p.bbq_picnic,bins:p.bins,wasteBags:p.waste_bags},officialRules:p.official_rules,openingHours:p.opening_hours??{},offLeashSchedule:p.off_leash_schedule??{},sourceAttributes:p.source_attributes??{},verificationStatus:p.verification_status,sourceUpdatedAt:p.source_updated_at,fetchedAt:p.fetched_at,source:p.source_id?{sourceId:p.source_id,authorityName:p.authority_name,datasetName:p.dataset_name,sourceType:p.source_type,jurisdiction:p.jurisdiction,attribution:p.attribution,lastVerifiedAt:p.last_verified_at}:null};
}
