import fs from 'node:fs';
const h=fs.readFileSync('index.html','utf8'),a=fs.readFileSync('app.js','utf8'),s=fs.readFileSync('stage5.js','utf8'),c=fs.readFileSync('styles.css','utf8'),w=fs.readFileSync('sw.js','utf8'),health=fs.readFileSync('api/health.js','utf8');
for(const token of ['STAGE 5 · PRIVATE PRESENCE & NIGHT SAFETY','stage5-checkin-form','stage5-active-visits','stage5-boundary-result','stage5-night-banner','stage5-attendance-state','One active visit per mate','NIGHT SAFETY MODE ACTIVE','No exact low-attendance counts'])if(!h.includes(token))throw new Error(`Stage5 UI missing ${token}`);
const screens=['today','journey','dog','handler','emergency','hazards','travel','supervision','community'];let last=-1;for(const n of screens){const i=h.indexOf(`data-screen="${n}"`);if(i<0||i<=last)throw new Error(`Stage5 broke chronological screen order at ${n}`);last=i;}
if(!a.startsWith("import { initStage3 } from './stage3.js';\nimport { initStage4 } from './stage4.js';\nimport { initStage5 } from './stage5.js';"))throw new Error('Stage5 import chronology broken');
for(const call of ['await initStage3();','await initStage4();','await initStage5();'])if(!a.includes(call))throw new Error(`Stage5 init missing ${call}`);
if(!(a.indexOf('await initStage3();')<a.indexOf('await initStage4();')&&a.indexOf('await initStage4();')<a.indexOf('await initStage5();')))throw new Error('Stage5 init chronology not 3→4→5');
for(const token of ["'/api/checkin'","'/api/boundary'","'/api/night-safety'","'/api/attendance'",'navigator.geolocation.getCurrentPosition','maximumAge:0','precise location was retained'])if(!s.includes(token))throw new Error(`Stage5 client missing ${token}`);
if(s.includes('watchPosition'))throw new Error('continuous geolocation introduced');
if(s.includes('localStorage')||s.includes('sessionStorage'))throw new Error('precise/private Stage5 state stored in browser storage');
if(!c.includes('Stage 5 — private presence')||!c.includes('.night-safety-banner'))throw new Error('premium Stage5 styling missing');
if(!w.includes("'genevieve-stage5-v1'")||!w.includes("'/stage5.js'")||!w.includes("startsWith('/api/')"))throw new Error('Stage5 PWA cache linkage missing or APIs could be cached');
for(const token of ["appStage:'Stage 3'","appStage:'Stage 4'","appStage:'Stage 5'",'stage5.build_state','stage5.policy_state'])if(!health.includes(token))throw new Error(`health chronology missing ${token}`);
console.log('Stage 5 UI audit PASS: nine-screen premium shell is retained, Stage3→Stage4→Stage5 initialization is ordered, one-shot location is explicit, Night Safety is visible, and public attendance remains hidden.');
