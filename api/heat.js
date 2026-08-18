import {getSql,methodNotAllowed,setNoStore} from '../server/stage3.js';
import {loadSelectedPark,publicPolicy,requireStage4Ready,stage4SendError,stage4Unavailable} from '../server/stage4.js';

const value=v=>v===true?'YES':v===false?'NO':'UNKNOWN';
export default async function handler(req,res){
  setNoStore(res);const sql=getSql();if(!sql)return stage4Unavailable(res);
  try{
    if(req.method!=='GET')return methodNotAllowed(res,['GET']);
    const {session,policy}=await requireStage4Ready(sql,req),park=await loadSelectedPark(sql,session.session_id),p=publicPolicy(policy),f=park?.facilities??{};
    return res.status(200).json({ok:true,status:'POLICY_GATED',policy:p,selectedPark:park?{parkId:park.parkId,name:park.name,verificationStatus:park.verificationStatus,shadeRecorded:value(f.shade),dogWaterRecorded:value(f.dogWaterBowls),tapWaterRecorded:value(f.tapWater)}:null,liveWeather:{status:p.liveWeatherEnabled?'ENABLED_BY_POLICY':'NOT_CONNECTED',value:null},surfaceHeatEstimate:{status:p.surfaceHeatEstimateEnabled?'ENABLED_BY_POLICY':'DISABLED_PENDING_VALIDATION',value:null},message:'Stage 4 exposes heat-related park facts and uncertainty without inventing a temperature model. Live weather remains a later provider-bound phase.'});
  }catch(error){return stage4SendError(res,error);}
}
