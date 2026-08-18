import crypto from 'node:crypto';
import {audit,cleanString,getSql,methodNotAllowed,readJson,setNoStore} from '../server/stage3.js';
import {assessSuitabilityContext} from '../lib/stage4-policy.js';
import {loadOwnedDog,loadSelectedPark,publicPolicy,requireStage4Mutation,requireStage4Ready,stage4SendError,stage4Unavailable} from '../server/stage4.js';

const OBS_KEYS=['dogState','ownerReady','equipmentReady','waterCarried','gateChecked','spaceObserved'];
function observations(body){const out={};for(const k of OBS_KEYS)out[k]=cleanString(body?.[k],40);return out;}

export default async function handler(req,res){
  setNoStore(res);const sql=getSql();if(!sql)return stage4Unavailable(res);
  try{
    const {session,policy}=await requireStage4Ready(sql,req);
    if(req.method==='GET'){
      const rows=await sql`SELECT assessment_id,dog_id,park_id,assessment_status,score,risk_band,policy_version,observations,reasons,unknowns,controls,source_state,heat_state,created_at FROM stage4.suitability_assessments WHERE session_id=${session.session_id} ORDER BY created_at DESC LIMIT 10`;
      return res.status(200).json({ok:true,policy:publicPolicy(policy),assessments:rows});
    }
    if(req.method==='POST'){
      requireStage4Mutation(req);const body=await readJson(req),dogId=cleanString(body.dogId,80);if(!dogId)throw Object.assign(new Error('dog-id-required'),{statusCode:400});
      const [dog,park]=await Promise.all([loadOwnedDog(sql,session.session_id,dogId),loadSelectedPark(sql,session.session_id)]);
      if(!dog)throw Object.assign(new Error('dog-not-found'),{statusCode:404});
      if(!park)throw Object.assign(new Error('selected-park-required'),{statusCode:409});
      const result=assessSuitabilityContext({dog,park,observations:observations(body)}),id=crypto.randomUUID();
      await sql`INSERT INTO stage4.suitability_assessments (assessment_id,session_id,dog_id,park_id,assessment_status,score,risk_band,policy_version,observations,reasons,unknowns,controls,source_state,heat_state) VALUES (${id},${session.session_id},${dogId},${park.parkId},${result.assessmentStatus},${result.score},${result.band==='UNKNOWN'?null:result.band},${result.policyVersion},${JSON.stringify(result.observations)}::jsonb,${JSON.stringify(result.reasons)}::jsonb,${JSON.stringify(result.unknowns)}::jsonb,${JSON.stringify(result.controls)}::jsonb,${JSON.stringify(result.sourceState)}::jsonb,${JSON.stringify(result.heat)}::jsonb)`;
      await audit(sql,session.session_id,'stage4_suitability_reviewed','suitability_assessment',id,{dogId,parkId:park.parkId,assessmentStatus:result.assessmentStatus,score:result.score,policyVersion:result.policyVersion});
      return res.status(201).json({ok:true,assessmentId:id,policy:publicPolicy(policy),assessment:result});
    }
    return methodNotAllowed(res,['GET','POST']);
  }catch(error){return stage4SendError(res,error);}
}
