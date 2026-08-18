import {execFileSync} from 'node:child_process';
for(const f of ['stage5-engine-audit.mjs','stage5-data-audit.mjs','stage5-api-audit.mjs','stage5-ui-audit.mjs','stage5-package-audit.mjs'])execFileSync(process.execPath,[`tests/${f}`],{stdio:'inherit'});
console.log('Stage 5 integrated audit PASS: private visit, Owner Duty, one-shot boundary, Night Safety, safer occupancy privacy, UI and package layers link after Stages 1–4.');
