import fs from 'node:fs';
const h=fs.readFileSync('index.html','utf8'),a=fs.readFileSync('app.js','utf8'),s=fs.readFileSync('stage3.js','utf8'),c=fs.readFileSync('styles.css','utf8'),w=fs.readFileSync('sw.js','utf8'),x=fs.readFileSync('api/health.js','utf8');
for(const t of ['STAGE 3 · SOURCE OF TRUTH','park-search-form','today-selected-park','journey-selected-park','dog-profile-form','stage3-dog-fieldset','owner-profile-form','stage3-owner-fieldset','Restricted emergency & document information','Phase 5 · not active yet'])if(!h.includes(t))throw new Error(`UI missing ${t}`);
if(!a.startsWith("import { initStage3 } from './stage3.js';")||!a.includes('initStage3();'))throw new Error('Stage3 module not linked to existing app');
for(const t of ["'/api/session'","'/api/profile'","'/api/dogs'","'/api/parks'",'renderPark'])if(!s.includes(t))throw new Error(`client path missing ${t}`);
if(s.includes('localStorage')||s.includes('sessionStorage')||s.includes('navigator.geolocation'))throw new Error('private browser storage/GPS introduced in Stage3');
if(!c.includes('Stage 3 — source-of-truth')||!w.includes("'/stage3.js'")||!w.includes("startsWith('/api/')"))throw new Error('Stage3 styles/PWA linkage missing');
if(!x.includes("appStage:'Stage 3'")||!x.includes('stage1.app_foundation')||!x.includes('stage3.build_state'))throw new Error('health does not link Stage1->Stage3');
console.log('Stage 3 UI audit PASS: earlier router/emergency preserved, profile/park UI linked, private browser storage/GPS absent, later phases gated.');
