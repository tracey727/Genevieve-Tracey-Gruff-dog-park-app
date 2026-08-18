import fs from 'node:fs';
const files=fs.readdirSync('db').filter(x=>/^V\d+/.test(x)).sort();
const expected=['V001_stage1_foundation.sql','V002_stage3_source_of_truth.sql','V003_stage4_decision_support.sql','V004_stage5_presence_privacy.sql'];
if(JSON.stringify(files)!==JSON.stringify(expected))throw new Error(`Stage5 migration chronology changed: ${files.join(',')}`);
const sql=fs.readFileSync('db/V004_stage5_presence_privacy.sql','utf8'),low=sql.toLowerCase();
for(const token of ['CREATE SCHEMA IF NOT EXISTS stage5','stage5.policy_state','stage5.visits','stage5.visit_events','stage5.boundary_decisions','stage5_one_active_visit_per_dog_idx','WHERE departure_at IS NULL','duty_interval_minutes IN (5,10,15,20)','public_attendance_enabled boolean NOT NULL DEFAULT false',"occupancy_policy_status text NOT NULL DEFAULT 'PENDING'","stale_visit_expiry_policy_status text NOT NULL DEFAULT 'PENDING'",'night_privacy_enabled boolean NOT NULL DEFAULT true','precise_location_stored boolean NOT NULL DEFAULT false CHECK (precise_location_stored=false)','stage5.protect_closed_visit','stage5_closed_visit_immutable'])if(!sql.includes(token))throw new Error(`V004 missing ${token}`);
for(const forbidden of ['user_latitude','user_longitude','device_latitude','device_longitude','movement_trail','background_location'])if(low.includes(forbidden))throw new Error(`V004 contains forbidden precise-location storage: ${forbidden}`);
if(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?stage5\.(?:occupancy|attendance_count|public_presence)\b/i.test(sql))throw new Error('V004 introduced a public occupancy/count table while policy is pending');
for(const prior of expected.slice(0,3)){if(!fs.statSync(`db/${prior}`).size)throw new Error(`prior migration missing ${prior}`);}
console.log('Stage 5 data audit PASS: V004 follows V001–V003, one-active-visit and Owner Duty constraints exist, public attendance defaults closed, and precise device-coordinate storage is absent.');
