# GENEVIEVE App™ — Dog Park Stages 1–5 linked

Premium Australian dog-park safety and compatibility decision-support candidate, linked chronologically through Stage 5.

## Current linked scope

Stages 1–4 remain preserved beneath Stage 5. Stage 5 adds private voluntary check-in/out, one active visit per dog, Owner Duty supervision confirmation, transient one-shot boundary decisions, park-local solar state, Night Safety and safer-occupancy privacy gates.

Public attendance is intentionally hidden because the blueprint's low-attendance timing/threshold policy is still pending. At night, attendance is hidden regardless. Precise user GPS is never stored by Stage 5.

## Database order

`V001_stage1_foundation.sql` → `V002_stage3_source_of_truth.sql` → `V003_stage4_decision_support.sql` → `V004_stage5_presence_privacy.sql`

Never rewrite an applied migration. Apply V004 only to the intended database branch after confirming backup/rollback and current migration state.

## Verification

Run:

```bash
npm test
```

The package audit covers Stage 1 through Stage 5 chronology, engine/privacy rules, API boundaries, UI linkage, secret scanning and rollback evidence. Database/staging/live-device verification remains a separate deployment gate.
