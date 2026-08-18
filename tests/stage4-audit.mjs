import {execFileSync} from 'node:child_process';
for(const f of ['tests/stage4-engine-audit.mjs','tests/stage4-data-audit.mjs','tests/stage4-api-audit.mjs','tests/stage4-ui-audit.mjs','tests/stage4-package-audit.mjs'])execFileSync(process.execPath,[f],{stdio:'inherit'});
console.log('Stage 4 integrated audit PASS: engine, data, API, UI and package layers link after Stages 1–3 without activating later phases.');
