# GENEVIEVE App™ Dog Park Unified Build

## Master Linked Build Index and Integration Rules

**Owner:** Tracey Ann Kennedy  
**Record date:** 12 August 2026  
**Status:** Cumulative requirements and architecture record. These files are linked as one specification; they do not, by themselves, prove that code has been implemented or deployed.

## Binding integration rule

The canonical source files, Master Assembly Pack, permanent build-continuity record and controlled implementation order below form one GENEVIEVE Dog Park App build record and must be read in the numbered order shown. No later file replaces, simplifies, strips back, or silently overrides an earlier file. Every later capability, assembly output and build entry inherits all earlier brand, safety, privacy, consent, accessibility, data-integrity, audit, testing, rollback and release requirements.

If two requirements appear to conflict:

1. Preserve the verified existing application and production deployment.
2. Apply the stricter privacy and safety protection.
3. Give verified official closures and emergency directions precedence over community reports or favourable calculated data.
4. Use `UNKNOWN` or the safer restricted state when required data is missing, stale, conflicting, or unverified.
5. Stop and obtain Tracey’s decision where the conflict cannot be resolved without changing approved scope.

## Linked files in chronological order

1. [Sections 1–2 — Master Control and Solar/Night Safety](<01_Sections_1-2_Master_Control_and_Solar_Night_Safety.md>)  
   Establishes the unified build foundation and the Solar Cycle & Night Safety Engine, including server-side after-dark occupancy protection, Today-first navigation, official branding, emergency control, feature flags, audit requirements, testing, release gates, and rollback protection.

2. [Sections 3–4 — Feature Comparison and Scope](<02_Sections_3-4_Feature_Comparison_and_Scope.md>)  
   Compares external dog-app features against GENEVIEVE’s approved scope. Safe discovery, amenities, travel, professional-service, and lost-dog functions must remain governed by the foundation; unsafe public tracking, exact low-occupancy disclosure, and unrestricted social features cannot bypass it.

3. [Sections 5–7 — Capability Modules 1–9](<03_Sections_5-7_Capabilities_Modules_1-9.md>)  
   Defines Today, current status, park discovery and matching, complete park information, dog profiles, personalisation, dog-to-dog compatibility, Best Mates, voluntary check-in/out, one active visit per dog, idempotency, incognito use, expiry, and audit history.

4. [Capability Modules 10–16 — Supervision, Journey, Weather, Tides, Hazards and Incidents](<04_Capability_Modules_10-16_Supervision_Journey_Weather_Tides_Hazards_Incidents.md>)  
   Extends Modules 1–9 with supervision timers, safer public occupancy, Journey and Grey Nomad routing, weather and heat risk, live-tide and marine-safety requirements, the colour-alert hazard network, incident evidence, council notices, correction/closure history, and de-identified review.

5. [Capability Modules 17–23 — Emergency, Accessibility, Privacy, Council, PWA, Accounts and Legal](<05_Capability_Modules_17-23_Emergency_Accessibility_Privacy_Council_PWA_Accounts_Legal.md>)  
   Continues directly from File 04. It adds Lost & Found, the intent-validated emergency control, lone-walker protection, restricted offline emergency information, accessibility and communication support, privacy and data rights, council operations, installable/offline PWA requirements, account and membership controls, the billing-readiness gate, legal documents, and the external-feature gap matrix.

6. [Master Assembly Pack — Part 1: Registers, Journey, Navigation, Dependencies and Data Model](<06_Master_Assembly_Pack_Part_1_Registers_Journey_Navigation_Dependencies_Data_Model.md>)  
   Continues directly from File 05 and reconciles Files 01–05 into the first seven required Master Assembly Pack outputs: the canonical feature register, status register, duplicate/conflict register, unified user journey, controlled navigation map, module/dependency map, and shared data model/entity relationships. Its repeated copies of earlier requirements are supporting context and do not replace the canonical Files 01–05.

7. [Permanent New-Chat Start Order and Build Status](<07_NEW_CHAT_START_ORDER_AND_BUILD_STATUS.md>)  
   Continues from File 06 and controls cross-chat continuity. It records the exact new-chat instruction, source-of-truth precedence, beginner guidance for Windows/GitHub/Neon/Vercel, entry-counting rules, current completion status, unverified items, blockers, rollback point, status-update template and the single next chronological action.

8. [Safety Improvements and Controlled Complete-Build Order](<08_SAFETY_IMPROVEMENTS_AND_CONTROLLED_COMPLETE_BUILD_ORDER.md>)  
   Continues from Files 00–07 and records Tracey’s instruction to include five reviewed safety improvements in the complete build program, preserve three rejected ideas as prohibited scope, obtain three unresolved decisions, complete Master Assembly Pack items 8–18 as File 09, audit the real GitHub/Neon/Vercel app, and then implement and verify the application milestone by milestone on a protected non-production branch. It does not authorise production release.

## Cross-file dependency map

| Controlled system | Primary source | Mandatory links |
| --- | --- | --- |
| Master app, navigation, brand and emergency control | File 01 | Governs Files 02–05 and every screen or service |
| Solar phase and night privacy | File 01 | Occupancy, check-in, Best Mate alerts, lone-walker controls, Journey, beaches, weather, risk and audit in Files 03–05 |
| Feature scope and external comparisons | File 02 | May extend discovery, services, accounts or commercial features only through File 01 safeguards and File 05 release gates |
| Park registry, filters and alternatives | File 03 | Journey, tide, weather, hazards, accessible routes, Lost & Found and official notices in Files 04–05 |
| Dog profile and current-state separation | File 03 | Compatibility, heat vulnerability, swimming/mobility caution, supervision, emergency summaries and alternative routing in Files 03–05 |
| Compatibility and Best Mates | File 03 | Live conditions, dual consent, night suppression, privacy rights, voluntary visits and safe alternatives across Files 01, 03–05 |
| Check-in/out and visit integrity | File 03 | Server-side occupancy masking, supervision, lone-walker timers, stale-session expiry, PWA retries, one active visit per dog and audit across Files 01 and 04–05 |
| Journey and Grey Nomad planning | File 04 | Park registry, dog profile, solar phase, verified hours, weather, tides, hazards and accessibility across Files 01–05 |
| Weather, heat, tide and marine safety | File 04 | Risk explanations, provenance, freshness, `UNKNOWN` fallback, accessible routes, emergency controls, official closure precedence and alternative parks across Files 01, 03–05 |
| Hazard, incident and evidence lifecycle | File 04 | Lost & Found, emergency response, council support, community/official status separation, privacy, attachment integrity, correction, expiry, closure and immutable audit in File 05 |
| Emergency, lone-walker and accessibility controls | File 05 | Inherits navigation, profiles, location privacy, check-in, tide, risk, hazards, restricted-data and audit rules from Files 01–04 |
| Privacy rights, council support and offline PWA | File 05 | Links occupancy obfuscation, dual consent, de-identification, role-based audit, alert lifecycle, cached-data labelling, version recovery and idempotent retries across Files 01–04 |
| Accounts, membership, billing and legal controls | File 05 | Links identity, consent, deletion, subscriptions, payment readiness, legal-document versions, refunds, complaints and release verification across all files |
| Master Assembly Pack, Part 1 | File 06 | Consumes and reconciles Files 01–05; it adds architecture outputs 1–7 but does not authorise coding or supersede any canonical requirement |
| New-chat continuity and build status | File 07 | Requires future chats to load the master index, distinguish requirements from verified implementation, preserve chronological progress, guide Tracey at beginner level and update permanent status after every entry |
| Safety improvements and controlled implementation | File 08 | Adds SI-01 through SI-05, keeps three unsafe ideas prohibited, requires Tracey’s three remaining decisions, orders File 09 and Phase 0 verification, and authorises protected non-production implementation only after its gates |

## Shared single-source-of-truth rule

The implementation must use central, reusable services and policies rather than separate competing logic on different screens. At minimum, the linked build requires shared sources of truth for:

- park identity, coordinates, time zone, amenities, rules and verification status;
- solar-cycle calculation and next-transition data;
- public occupancy privacy and after-dark masking;
- dog profile, current status and restricted emergency/medical data;
- compatibility explanations and recommended controls;
- Journey stops, Grey Nomad needs and alternative routing;
- weather, heat, tide and environmental provenance/freshness;
- hazard status, verification, expiry, correction and closure;
- incident/evidence transactions and privacy-controlled exports;
- emergency gesture validation, lone-walker timers and restricted offline emergency summaries;
- accessibility, communication modes and non-colour warning labels;
- consent, data rights, role-based access and de-identification;
- council notices, assignment, action and human-reviewed closure;
- PWA caching, offline drafts, stale-data labelling and version recovery;
- account sessions, membership state, billing readiness and legal-document versions; and
- audit records, idempotency, database migrations and rollback.

No screen may create its own conflicting version of these rules.

## Continuous capability coverage

The linked capability specification is continuous from Module 1 through Module 23:

- Modules 1–9 are held in File 03.
- Modules 10–16 are held in File 04.
- Modules 17–23 are held in File 05 and continue directly from File 04.
- Files 01–02 provide the mandatory foundation, safety constraints and scope controls governing all 23 modules.
- File 06 reconciles those modules into the Master Assembly Pack; it does not introduce a separate application or a new capability-number sequence.

## Master Assembly Pack progress

File 06 contains the assembly instruction and Part 1 of the requested architecture pack.

Completed in File 06:

1. Canonical feature register.
2. Status register.
3. Duplicate and conflict register.
4. Unified user-journey map.
5. Controlled page and navigation map.
6. Module and dependency map.
7. Shared data model and entity relationships.

Still required before the Master Assembly Pack can be called complete:

8. State lifecycles.
9. API and external-integration register.
10. Identity, roles, permissions, consent and privacy architecture.
11. Precise-location and safe-occupancy protections.
12. Accessibility and communication architecture.
13. Offline, PWA, caching and failure-recovery architecture.
14. Security, audit, backup and rollback requirements.
15. Requirements-to-test traceability matrix.
16. Release gates and definition of done.
17. Open decisions requiring Tracey’s approval.
18. Chronological implementation plan for Phases 0–14.

The final implementation plan must state, for every phase, its inputs/dependencies, protected existing files, connected modules, migration order, integrations, safety/privacy controls, tests, acceptance evidence, rollback point, unchanged scope and completion gate.

File 08 is the binding order to complete outputs 8–18 as File 09 and then begin the controlled, verified build after its decision, audit and protection gates. File 08 is not itself the missing Master Assembly Pack output and is not evidence that code has been implemented.

## Verification status that must remain visible

“Received and locked” means the requirement has been recorded in this specification. It does **not** mean the feature has been coded, connected to a live provider, tested, or deployed.

The supplied records specifically identify these items as requiring live verification:

- production weather feeds;
- the live tide provider and Australian tide-station-to-beach mappings;
- the live magpie/swooping-bird module;
- the expanded Deaf/Auslan package; and
- payments, refunds, store billing and other live provider mappings.

Until verified, these functions must not claim to be live or safe and must use the approved unavailable/unknown state.

QR communication signage and BagStation stock/servicing remain proposed roadmap items. Unconfirmed external commercial or social features listed in File 05 remain outside the controlled core unless Tracey separately approves them through the same audit and release process.

## Mandatory build handoff

Before implementation, the builder must verify the active repository and latest working commit, complete the read-only pre-change audit, identify every proposed file change, work in a protected feature branch with production flags off, run all required automated and regression tests, provide evidence that privacy is enforced server-side, produce an integrated candidate preview, document rollback, and obtain Tracey’s approval before any production release.

File 06 originally authorised architecture assembly only. Tracey’s later written instruction in File 08 authorises completion of the architecture, read-only audit and protected non-production implementation after File 08’s gates. No production deployment, live-database change, destructive action, paid-provider activation or secret handling is authorised without a separate explicit approval.

## New-chat continuity rule

At the beginning of every new build chat, attach or select Files 00, 07 and 08 and use the exact continuation order contained in File 07. Chat memory is never a substitute for reading the permanent files and verifying the current repository/deployment evidence.

## Filing rule for the next document

The next permanent build record must use the `09_` prefix. Later records must continue chronologically (`10_`, `11_`, and so on), be placed in this folder, be added to the chronological list and dependency map above, and explicitly link to every earlier rule they inherit or affect.
