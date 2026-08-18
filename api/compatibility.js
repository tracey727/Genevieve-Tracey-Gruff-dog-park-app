import crypto from 'node:crypto';
import {audit,cleanEnum,cleanString,getSql,methodNotAllowed,readJson,setNoStore} from '../server/stage3.js';
import {assessCompatibilityContext} from '../lib/stage4-policy.js';
import {loadOwnedDogs,loadSelectedPark,publicPolicy,requireStage4Mutation,requireStage4Ready,stage4SendError,stage4Unavailable} from '../server/stage4.js';

export default async function handler(req,res){
  setNoStore(res);const sql=getSql();if(!sql)return stage4Unavailable(res);
  try{
    const {session,policy}=await requireStage4Ready(sql,req);
    if(req.method==='GET'){
      const rows=await sql`SELECT assessment_id,assessment_mode,dog_ids,park_id,assessment_status,score,risk_band,policy_version,factors,unknowns,controls,created_at FROM stage4.compatibility_assessments WHERE session_id=${session.session_id} ORDER BY created_at DESC LIMIT 10`;
      return res.status(200).json({ok:true,policy:publicPolicy(policy),assessments:rows});
    }
    if(req.method==='POST'){
      requireStage4Mutation(req);const body=await readJson(req),mode=cleanEnum(body.mode,['PAIR','GROUP'],'PAIR');
      const ids=Array.isArray(body.dogIds)?[...new Set(body.dogIds.map(x=>cleanString(x,80)).filter(Boolean))]:[];
      if(mode==='PAIR'&&ids.length!==2)throw Object.assign(new Error('pair-requires-two-dogs'),{statusCode:400});
      if(mode==='GROUP'&&(ids.length<3||ids.length>5))throw Object.assign(new Error('group-requires-three-to-five-dogs'),{statusCode:400});
      const [dogs,park]=await Promise.all([loadOwnedDogs(sql,session.session_id,ids),loadSelectedPark(sql,session.session_id)]);
      if(dogs.length!==ids.length)throw Object.assign(new Error('one-or-more-dogs-not-found'),{statusCode:404});
      const result=assessCompatibilityContext({dogs,park,mode}),id=crypto.randomUUID();
      await sql`INSERT INTO stage4.compatibility_assessments (assessment_id,session_id,assessment_mode,dog_ids,park_id,assessment_status,score,risk_band,policy_version,factors,unknowns,controls) VALUES (${id},${session.session_id},${mode},${JSON.stringify(ids)}::jsonb,${park?.parkId??null},${result.assessmentStatus},${result.score},${result.band==='UNKNOWN'?null:result.band},${result.policyVersion},${JSON.stringify(result.factors)}::jsonb,${JSON.stringify(result.unknowns)}::jsonb,${JSON.stringify(result.controls)}::jsonb)`;
      await audit(sql,session.session_id,'stage4_compatibility_reviewed','compatibility_assessment',id,{mode,dogIds:ids,parkId:park?.parkId??null,assessmentStatus:result.assessmentStatus,score:result.score,policyVersion:result.policyVersion});
      return res.status(201).json({ok:true,assessmentId:id,policy:publicPolicy(policy),assessment:result});
    }
    return methodNotAllowed(res,['GET','POST']);
  }catch(error){return stage4SendError(res,error);}
}
