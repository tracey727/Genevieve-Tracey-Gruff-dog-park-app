# GENEVIEVE App™ Dog Park — Stage 1 + Stage 2 + Stage 3 Linked Candidate

This package extends the user-supplied Stage 1+2 build without replacing its protected baseline.

**Stage 1:** structural/safety shell + Neon foundation.  
**Stage 2:** chronological nine-screen UX/UI.  
**Stage 3:** automatic private session, owner profile, dog profiles with restricted-data separation, park provenance/freshness/search, and selected park carried Today → Journey.

Run `npm install` then `npm test`. A pass must show Stage 1, Stage 2 and every Stage 3 audit passing in order.

Database migration order: `db/V001_stage1_foundation.sql` then `db/V002_stage3_source_of_truth.sql`. `DATABASE_URL` stays server-side and is not included.

This is an **integrated candidate**, not permission to overwrite production. Later phases remain present in the included blueprint but are not falsely labelled complete.
