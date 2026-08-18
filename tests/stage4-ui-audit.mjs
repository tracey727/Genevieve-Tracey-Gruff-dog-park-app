import fs from 'node:fs';
const h=fs.readFileSync('index.html','utf8'),a=fs.readFileSync('app.js','utf8'),s=fs.readFileSync('stage4.js','utf8'),c=fs.readFileSync('styles.css','utf8'),w=fs.readFileSync('sw.js','utf8'),x=fs.readFileSync('api/health.js','utf8');
for(const t of ['STAGE 4 · DECISION SUPPORT','stage4-suitability-form','stage4-risk-scale','stage4-heat-result','stage4-compatibility-form','No binary safe / unsafe verdict','Decision support only','Phase 5 · not active yet'])if(!h.includes(t))throw new Error(`Stage4 UI missing ${t}`);
const screens=['today','journey','dog','handler','emergency','hazards','travel','supervision','community'];let last=-1;for(const n of screens){const i=h.indexOf(`data-screen="${n}"`);if(i<0||i<=last)throw new Error(`Stage4 broke chronological screen order at ${n}`);last=i;}
if(!a.startsWith("import { initStage3 } from './stage3.js';\nimport { initStage4 } from './stage4.js';"))throw new Error('Stage4 not linked after Stage3 import');
if(a.indexOf('await initStage3();')>a.indexOf('await initStage4();')||!a.includes('await initStage3();')||!a.includes('await initStage4();'))throw new Error('Stage4 init chronology broken');
for(const t of ["'/api/suitability'","'/api/compatibility'","'/api/heat'",'NOT ISSUED — expert policy gate pending'])if(!s.includes(t))throw new Error(`Stage4 client missing ${t}`);
if(s.includes('localStorage')||s.includes('sessionStorage')||s.includes('navigator.geolocation'))throw new Error('private browser storage/GPS introduced in Stage4');
if(!c.includes('Stage 4 — gated suitability')||!w.includes("'/stage4.js'")||!w.includes("startsWith('/api/')"))throw new Error('Stage4 PWA/style linkage missing');
if(!x.includes("appStage:'Stage 4'")||!x.includes('stage3.build_state')||!x.includes('stage4.build_state')||!x.includes('stage4.policy_state'))throw new Error('health does not link Stage1->Stage3->Stage4');
if(!h.includes('--')){} // no-op keeps file deliberately static-only.
console.log('Stage 4 UI audit PASS: nine screens retain order, Stage3 initializes before Stage4, explainable gated decision-support UI is linked, later stages remain disabled.');
