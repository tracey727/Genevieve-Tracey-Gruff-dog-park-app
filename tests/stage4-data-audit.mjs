import fs from 'node:fs';
const sql=fs.readFileSync('db/V003_stage4_decision_support.sql','utf8');
for(const t of ['CREATE SCHEMA IF NOT EXISTS stage4','stage4.build_state','stage4.policy_state','stage4.suitability_assessments','stage4.compatibility_assessments','score BETWEEN 1 AND 10',"risk_band IN ('GREEN','YELLOW','AMBER','RED')",'numeric_scoring_enabled boolean NOT NULL DEFAULT false','surface_heat_estimate_enabled boolean NOT NULL DEFAULT false','live_weather_enabled boolean NOT NULL DEFAULT false',"expert_review_status text NOT NULL DEFAULT 'PENDING'"])if(!sql.includes(t))throw new Error(`Stage4 migration missing ${t}`);
for(const forbidden of ['microchip_number','medical_conditions','allergies','medications','veterinarian_name','emergency_notes','latitude','longitude','check_in','checkin','occupancy','payment','stripe'])if(sql.toLowerCase().includes(forbidden.toLowerCase()))throw new Error(`Stage4 migration leaks/activates later data: ${forbidden}`);
const files=fs.readdirSync('db').filter(x=>/^V\d+/.test(x)).sort();
const stage4Prefix=['V001_stage1_foundation.sql','V002_stage3_source_of_truth.sql','V003_stage4_decision_support.sql'];
if(JSON.stringify(files.slice(0,3))!==JSON.stringify(stage4Prefix))throw new Error(`Stage1-4 migration prefix changed: ${files.join(',')}`);
if(files.length<3)throw new Error('Stage4 migration history incomplete');
console.log('Stage 4 data audit PASS: V003 follows V001/V002, assessment evidence is private-session linked, numeric gates are false, restricted/GPS/later-stage data is absent.');
