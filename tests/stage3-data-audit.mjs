import fs from 'node:fs';
const sql=fs.readFileSync('db/V002_stage3_source_of_truth.sql','utf8');
for(const t of ['stage3.build_state','stage3.device_sessions','stage3.owner_profiles','stage3.dog_profiles','stage3.dog_private_details','stage3.park_sources','stage3.parks','stage3.park_source_snapshots','stage3.selected_parks','stage3.audit_events'])if(!sql.includes(t))throw new Error(`missing ${t}`);
const publicDog=sql.split('CREATE TABLE IF NOT EXISTS stage3.dog_profiles')[1].split('CREATE TABLE IF NOT EXISTS stage3.dog_private_details')[0];
for(const f of ['microchip_number','allergies','medications','veterinarian_name','emergency_notes'])if(publicDog.includes(f))throw new Error(`restricted field leaked: ${f}`);
for(const x of ['iana_timezone','verification_status','source_updated_at','payload_sha256 char(64)'])if(!sql.includes(x))throw new Error(`missing ${x}`);
for(const x of ['stage3.checkins','stage3.live_occupancy','stage3.risk_scores','stage3.payments'])if(sql.includes(`CREATE TABLE IF NOT EXISTS ${x}`))throw new Error(`chronology violation ${x}`);
console.log('Stage 3 data audit PASS: source-of-truth tables, restricted-data separation, provenance/freshness and chronology controls present.');
