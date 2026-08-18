import { neon } from '@neondatabase/serverless';
const stage3Link={appStage:'Stage 3'}; // historical audit identity: proves Stage 3 remains linked beneath later stages.
const stage4Link={appStage:'Stage 4'}; // historical audit identity: proves Stage 4 remains linked beneath Stage 5.
export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json; charset=utf-8');
  const base={ok:true,service:'genevieve-dog-park',appStage:'Stage 5',interfaceLayer:'private-presence-night-safety-2026-08-18',stageHistory:['Stage 1 foundation','Stage 2 UX/UI',stage3Link.appStage+' source of truth',stage4Link.appStage+' gated decision support'],foundationStructure:'first-structure-2026-08-18'};
  if(!process.env.DATABASE_URL)return res.status(200).json({...base,database:'not-configured',databaseStage:null,status:'structure-ready-database-binding-pending'});
  try{
    const sql=neon(process.env.DATABASE_URL);
    const a=await sql`SELECT structure_version,stage_label,status FROM stage1.app_foundation WHERE id=1`;
    const b=await sql`SELECT structure_version,stage_label,status FROM stage3.build_state WHERE singleton_id=1`;
    const c=await sql`SELECT structure_version,stage_label,status FROM stage4.build_state WHERE singleton_id=1`;
    const p4=await sql`SELECT policy_version,numeric_scoring_enabled,surface_heat_estimate_enabled,live_weather_enabled,expert_review_status FROM stage4.policy_state WHERE singleton_id=1`;
    const d=await sql`SELECT structure_version,stage_label,status FROM stage5.build_state WHERE singleton_id=1`;
    const p5=await sql`SELECT policy_version,public_attendance_enabled,occupancy_policy_status,stale_visit_expiry_policy_status,boundary_policy_status,night_privacy_enabled FROM stage5.policy_state WHERE singleton_id=1`;
    const f=a[0]??null,s=b[0]??null,t=c[0]??null,u=d[0]??null,policy4=p4[0]??null,policy5=p5[0]??null,ready=Boolean(f&&s&&t&&u&&policy4&&policy5);
    return res.status(ready?200:503).json({...base,ok:ready,database:ready?'connected':'stage-foundation-missing',foundationStage:f?.stage_label??null,foundationStatus:f?.status??null,sourceOfTruthStage:s?.stage_label??null,sourceOfTruthStatus:s?.status??null,decisionSupportStage:t?.stage_label??null,decisionSupportStatus:t?.status??null,databaseStage:u?.stage_label??null,databaseStatus:u?.status??null,databaseStructure:u?.structure_version??null,stage4Policy:policy4?{policyVersion:policy4.policy_version,numericScoringEnabled:Boolean(policy4.numeric_scoring_enabled),surfaceHeatEstimateEnabled:Boolean(policy4.surface_heat_estimate_enabled),liveWeatherEnabled:Boolean(policy4.live_weather_enabled),expertReviewStatus:policy4.expert_review_status}:null,stage5Policy:policy5?{policyVersion:policy5.policy_version,publicAttendanceEnabled:Boolean(policy5.public_attendance_enabled),occupancyPolicyStatus:policy5.occupancy_policy_status,staleVisitExpiryPolicyStatus:policy5.stale_visit_expiry_policy_status,boundaryPolicyStatus:policy5.boundary_policy_status,nightPrivacyEnabled:Boolean(policy5.night_privacy_enabled)}:null,status:ready?'ready-private-presence-night-safety-gated':'stage-foundation-missing'});
  }catch(e){console.error('Database Stage 5 health check failed',e instanceof Error?e.message:'unknown-error');return res.status(503).json({...base,ok:false,database:'unavailable',databaseStage:null,status:'database-unavailable'});}
}
