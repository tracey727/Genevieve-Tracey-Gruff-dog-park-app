import crypto from 'node:crypto';
import {audit,cleanString,getSql,methodNotAllowed,readJson,setNoStore} from '../server/stage3.js';
import {loadActiveVisit,loadStage5OwnedDog,loadStage5SelectedPark,publicStage5Policy,requireStage5Mutation,requireStage5Ready,stage5SendError,stage5Unavailable} from '../server/stage5.js';
import {derivePresenceStatus,validateDutyMinutes,validateOwnerLocation,validatePrivacyMode,validateVisitState} from '../lib/stage5-policy.js';

const isoAfterMinutes=(minutes)=>new Date(Date.now()+minutes*60_000).toISOString();
function cleanKey(value,label){const key=cleanString(value,120);if(!key)throw Object.assign(new Error(`${label}-required`),{statusCode:400});return key;}
function publicVisit(v){return {visitId:v.visit_id,dogId:v.dog_id,parkId:v.park_id,dogStatus:v.dog_status,privacyMode:v.privacy_mode,ownerLocationState:v.owner_location_state,dutyIntervalMinutes:Number(v.duty_interval_minutes),dutyConfirmedAt:v.duty_confirmed_at,dutyDueAt:v.duty_due_at,arrivalAt:v.arrival_at,departureAt:v.departure_at??null,presenceStatus:derivePresenceStatus(v)};}
async function listPrivate(sql,sessionId){const rows=await sql`SELECT visit_id,dog_id,park_id,dog_status,privacy_mode,owner_location_state,duty_interval_minutes,duty_confirmed_at,duty_due_at,arrival_at,departure_at FROM stage5.visits WHERE session_id=${sessionId} AND departure_at IS NULL ORDER BY arrival_at DESC LIMIT 50`;return rows.map(publicVisit);}

export default async function handler(req,res){
  setNoStore(res);const sql=getSql();if(!sql)return stage5Unavailable(res);
  try{
    const {session,policy}=await requireStage5Ready(sql,req);
    if(req.method==='GET')return res.status(200).json({ok:true,scope:'PRIVATE_SESSION_ONLY',policy:publicStage5Policy(policy),visits:await listPrivate(sql,session.session_id)});
    if(req.method!=='POST')return methodNotAllowed(res,['GET','POST']);
    requireStage5Mutation(req);const body=await readJson(req),action=cleanString(body.action,40);
    if(action==='CHECK_IN'){
      const dogId=cleanString(body.dogId,80);if(!dogId)throw Object.assign(new Error('dog-id-required'),{statusCode:400});
      const dog=await loadStage5OwnedDog(sql,session.session_id,dogId);if(!dog)throw Object.assign(new Error('owned-dog-required'),{statusCode:404});
      const park=await loadStage5SelectedPark(sql,session.session_id);if(!park)throw Object.assign(new Error('selected-park-required'),{statusCode:409});
      const duty=validateDutyMinutes(body.dutyIntervalMinutes),dogStatus=validateVisitState(body.dogStatus),privacyMode=validatePrivacyMode(body.privacyMode),ownerLocationState=validateOwnerLocation(body.ownerLocationState),key=cleanKey(body.idempotencyKey,'idempotency-key');
      const prior=await sql`SELECT * FROM stage5.visits WHERE session_id=${session.session_id} AND checkin_idempotency_key=${key} LIMIT 1`;if(prior[0])return res.status(200).json({ok:true,idempotent:true,visit:publicVisit(prior[0])});
      const active=await loadActiveVisit(sql,session.session_id,{dogId});if(active){if(active.park_id!==park.parkId)throw Object.assign(new Error('dog-already-checked-in-elsewhere'),{statusCode:409});return res.status(200).json({ok:true,idempotent:true,visit:publicVisit(active)});}
      const id=crypto.randomUUID(),due=isoAfterMinutes(duty);
      try{const rows=await sql`INSERT INTO stage5.visits (visit_id,session_id,dog_id,park_id,dog_status,privacy_mode,owner_location_state,duty_interval_minutes,duty_confirmed_at,duty_due_at,checkin_idempotency_key) VALUES (${id},${session.session_id},${dogId},${park.parkId},${dogStatus},${privacyMode},${ownerLocationState},${duty},now(),${due}) RETURNING *`;await sql`INSERT INTO stage5.visit_events (visit_id,session_id,event_type,detail) VALUES (${id},${session.session_id},'CHECK_IN',${JSON.stringify({dogStatus,privacyMode,ownerLocationState,dutyIntervalMinutes:duty})}::jsonb)`;await audit(sql,session.session_id,'stage5_check_in','visit',id,{dogId,parkId:park.parkId,privacyMode,dutyIntervalMinutes:duty});return res.status(201).json({ok:true,idempotent:false,visit:publicVisit(rows[0])});}
      catch(error){if(error?.code==='23505'){const race=await loadActiveVisit(sql,session.session_id,{dogId});if(race)return res.status(200).json({ok:true,idempotent:true,visit:publicVisit(race)});}throw error;}
    }
    const visitId=cleanString(body.visitId,80);if(!visitId)throw Object.assign(new Error('visit-id-required'),{statusCode:400});
    if(action==='CHECK_OUT'){
      const key=cleanKey(body.idempotencyKey,'idempotency-key');const existing=await sql`SELECT * FROM stage5.visits WHERE session_id=${session.session_id} AND visit_id=${visitId} LIMIT 1`;const visit=existing[0];if(!visit)throw Object.assign(new Error('visit-not-found'),{statusCode:404});if(visit.departure_at||visit.checkout_idempotency_key===key)return res.status(200).json({ok:true,idempotent:true,visit:publicVisit(visit)});
      const rows=await sql`UPDATE stage5.visits SET departure_at=now(),checkout_idempotency_key=${key},owner_location_state='LEFT',updated_at=now() WHERE session_id=${session.session_id} AND visit_id=${visitId} AND departure_at IS NULL RETURNING *`;if(!rows[0])throw Object.assign(new Error('visit-not-active'),{statusCode:409});await sql`INSERT INTO stage5.visit_events (visit_id,session_id,event_type,detail) VALUES (${visitId},${session.session_id},'CHECK_OUT','{}'::jsonb)`;await audit(sql,session.session_id,'stage5_check_out','visit',visitId,{dogId:visit.dog_id,parkId:visit.park_id});return res.status(200).json({ok:true,idempotent:false,visit:publicVisit(rows[0])});
    }
    const active=await loadActiveVisit(sql,session.session_id,{visitId});if(!active)throw Object.assign(new Error('active-visit-required'),{statusCode:404});
    if(action==='RENEW_SUPERVISION'){
      const duty=validateDutyMinutes(body.dutyIntervalMinutes??active.duty_interval_minutes),due=isoAfterMinutes(duty);const rows=await sql`UPDATE stage5.visits SET duty_interval_minutes=${duty},duty_confirmed_at=now(),duty_due_at=${due},updated_at=now() WHERE session_id=${session.session_id} AND visit_id=${visitId} AND departure_at IS NULL RETURNING *`;await sql`INSERT INTO stage5.visit_events (visit_id,session_id,event_type,detail) VALUES (${visitId},${session.session_id},'SUPERVISION_RENEWED',${JSON.stringify({dutyIntervalMinutes:duty})}::jsonb)`;await audit(sql,session.session_id,'stage5_supervision_renewed','visit',visitId,{dutyIntervalMinutes:duty});return res.status(200).json({ok:true,visit:publicVisit(rows[0])});
    }
    if(action==='SET_OWNER_LOCATION'){
      const locationState=validateOwnerLocation(body.ownerLocationState);const rows=await sql`UPDATE stage5.visits SET owner_location_state=${locationState},updated_at=now() WHERE session_id=${session.session_id} AND visit_id=${visitId} AND departure_at IS NULL RETURNING *`;await sql`INSERT INTO stage5.visit_events (visit_id,session_id,event_type,detail) VALUES (${visitId},${session.session_id},'OWNER_LOCATION_CHANGED',${JSON.stringify({ownerLocationState:locationState})}::jsonb)`;await audit(sql,session.session_id,'stage5_owner_location_changed','visit',visitId,{ownerLocationState:locationState});return res.status(200).json({ok:true,checkoutRecommended:locationState==='LEFT',unattendedReportCreated:false,visit:publicVisit(rows[0])});
    }
    throw Object.assign(new Error('invalid-stage5-action'),{statusCode:400});
  }catch(error){return stage5SendError(res,error);}
}
