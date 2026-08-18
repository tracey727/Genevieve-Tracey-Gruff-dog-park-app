import fs from 'node:fs';
for(const f of ['docs/STAGE3_STRUCTURE.md','docs/MASTER_BLUEPRINT_COVERAGE.md','docs/audits/STAGE2_BASELINE_MANIFEST.sha256','docs/audits/STAGE3_BUILD_AUDIT_LOG.md','docs/reference/GENEVIEVE_Dog_Park_COMPLETE_MASTER_BLUEPRINT_2026-08-15.docx','docs/reference/GENEVIEVE_Dog_Park_Master_Blueprint_Archive_Record_2026-08-16.txt','docs/reference/00_GENEVIEVE_Dog_Park_Linked_Master_Index.md','LINKED_STAGE1_STAGE2_STAGE3_README.md'])if(!fs.existsSync(f)||!fs.statSync(f).size)throw new Error(`missing/empty ${f}`);
const c=fs.readFileSync('docs/MASTER_BLUEPRINT_COVERAGE.md','utf8');for(let i=0;i<=14;i++)if(!c.includes(`| ${i} |`))throw new Error(`Phase ${i} missing`);
console.log('Stage 3 package audit PASS: durable references present and master Phases 0–14 represented.');
