import {cleanString,requireSession} from './stage3.js';
import {STAGE5_GATES,STAGE5_POLICY_VERSION} from '../lib/stage5-policy.js';

export function requireStage5Mutation(req){
  const marker=req.headers?.['x-genevieve-stage5']??req.headers?.get?.('x-genevieve-stage5');
  if(String(marker??'')!=='1')throw Object.assign(new Error('stage5-mutation-marker-required'),{statusCode:403});
}

export function stage5Unavailable(res){return res.status(503).json({ok:false,error:'stage5-database-not-configured',message:'Stage 5 secure presence/privacy persistence is unavailable until V004 is applied.'});}

export function stage5SendError(res,error){
  const status=Number(error?.statusCode)||500;
  if(status>=500)console.error('Stage 5 API error',error instanceof Error?error.message:'unknown-error');
  return res.status(status).json({ok:false,error:status>=500?'stage5-server-error':(error?.message||'invalid-request')});
}

export async function requireStage5Ready(sql,req){
  const session=await requireSession(sql,req);
  const rows=await sql`SELECT policy_version,public_attendance_enabled,occupancy_policy_status,stale_visit_expiry_policy_status,boundary_policy_status,night_privacy_enabled FROM stage5.policy_state WHERE singleton_id=1 LIMIT 1`;
  const policy=rows[0]??null;
  if(!policy)throw Object.assign(new Error('stage5-policy-not-initialised'),{statusCode:503});
  return {session,policy};
}

export function publicStage5Policy(policy=null){return {policyVersion:cleanString(policy?.policy_version,120)||STAGE5_POLICY_VERSION,publicAttendanceEnabled:Boolean(policy?.public_attendance_enabled??STAGE5_GATES.publicAttendanceEnabled),occupancyPolicyStatus:cleanString(policy?.occupancy_policy_status,40)||STAGE5_GATES.occupancyPolicyStatus,staleVisitExpiryPolicyStatus:cleanString(policy?.stale_visit_expiry_policy_status,40)||STAGE5_GATES.staleVisitExpiryPolicyStatus,boundaryPolicyStatus:cleanString(policy?.boundary_policy_status,40)||STAGE5_GATES.boundaryPolicyStatus,nightPrivacyEnabled:Boolean(policy?.night_privacy_enabled??STAGE5_GATES.nightPrivacyEnabled)};}

export async function loadStage5OwnedDog(sql,sessionId,dogId){
  const rows=await sql`SELECT dog_id,name,visibility_mode FROM stage3.dog_profiles WHERE session_id=${sessionId} AND dog_id=${dogId} AND archived_at IS NULL LIMIT 1`;
  return rows[0]??null;
}

export async function loadStage5SelectedPark(sql,sessionId){
  const rows=await sql`SELECT p.park_id,p.name,p.locality,p.state_code,p.latitude,p.longitude,p.iana_timezone,p.verification_status,p.source_attributes,s.authority_name,s.last_verified_at FROM stage3.selected_parks sp JOIN stage3.parks p ON p.park_id=sp.park_id LEFT JOIN stage3.park_sources s ON s.source_id=p.source_id WHERE sp.session_id=${sessionId} AND p.retired_at IS NULL LIMIT 1`;
  const p=rows[0]??null;if(!p)return null;
  const attrs=p.source_attributes&&typeof p.source_attributes==='object'?p.source_attributes:{};
  const raw=attrs.stage5Boundary??attrs.stage5_boundary??null;
  const boundaryPolicy=raw&&typeof raw==='object'?{verified:raw.verified===true,type:cleanString(raw.type,20),radiusM:Number(raw.radiusM??raw.radius_m),maxAccuracyM:Number(raw.maxAccuracyM??raw.max_accuracy_m)}:null;
  return {parkId:p.park_id,name:p.name,locality:p.locality,stateCode:p.state_code,latitude:p.latitude===null?null:Number(p.latitude),longitude:p.longitude===null?null:Number(p.longitude),timeZone:cleanString(p.iana_timezone,80),verificationStatus:p.verification_status,boundaryPolicy,source:{authorityName:p.authority_name??null,lastVerifiedAt:p.last_verified_at??null}};
}

export async function loadActiveVisit(sql,sessionId,{visitId=null,dogId=null}={}){
  if(visitId){const rows=await sql`SELECT * FROM stage5.visits WHERE session_id=${sessionId} AND visit_id=${visitId} AND departure_at IS NULL LIMIT 1`;return rows[0]??null;}
  if(dogId){const rows=await sql`SELECT * FROM stage5.visits WHERE session_id=${sessionId} AND dog_id=${dogId} AND departure_at IS NULL LIMIT 1`;return rows[0]??null;}
  return null;
}
