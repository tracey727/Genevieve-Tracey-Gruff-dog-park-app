# GENEVIEVE App™ — Chronological Screen Audit 1–6

Date: 18 August 2026
Branch: `agent/australia-master-consolidation-2026-08-18`
Blueprint authority: `Genevieve_App_Master_Blueprint.md`

This audit was completed after the Section 1 runtime/foundation repair and before changing Screen 7. Screens are reviewed in blueprint order so later screens are not allowed to depend on a broken earlier screen.

## Screen 1 — Today / Core Entry

**PASS with accuracy limits retained.**

Verified connections:
- personalised `G’day` greeting reads the encrypted local handler profile;
- Safety Score is calculated from weather, heat-sensitive breed flag, current selected-location hazards, crowd and Off Their Game state;
- the permanent 3-second emergency hold + slide remains above the active screen;
- Australian location text can be selected without pretending that an unmapped BOM station is local to it;
- Dynamic Location Alerts link the active dog’s heat sensitivity and current selected-location hazard feed;
- Check in saves locally first and applies the privacy decision before any community cloud sync;
- Report Hazard routes directly to Screen 6;
- after check-in, the primary action becomes Supervision and routes to Screen 8.

Accuracy safeguard retained: arbitrary Australian location searches are **not** marked council verified and are **not** assigned an unrelated BOM station.

## Screen 2 — Journey & Status

**PASS.**

Verified connections:
- selected location from Screen 1 is the Screen 2 location header;
- council-verification state is explicit rather than fabricated;
- live BOM observations are shown only for a mapped station;
- tide and water/algae fields remain visibly pending/unverified instead of displaying invented marine safety data;
- crowd counts derive from active local/live attendance events;
- Off Their Game only raises the dynamic crowd warning when high-energy share reaches 30%, and upgrades to red at 100%;
- the consolidated hazard feed consumes Screen 6 reports;
- the de-escalation shortcut routes to Screen 9;
- the travel shortcut routes to Screen 7.

## Screen 3 — Mate / Dog Profile

**PASS.**

Verified connections:
- searchable hardcoded offline breed index is present and includes 300+ entries;
- short-muzzled and double-coat heat sensitivity feeds Screen 1 Safety Score/heat advisory thresholds;
- size, energy baseline, In Training and Prefers Space states are retained;
- energy baseline becomes the anonymous attendance energy used by Screen 2 crowd mix;
- profile data is encrypted locally with the device-held AES-GCM key before any optional private cloud backup;
- optional insurance and vaccination details remain device-only and are only shared when the user deliberately creates the Screen 9 Digital Exchange QR.

## Screen 4 — Handler & Security

**PASS with privacy-preserving local operation.**

Verified connections:
- handler identity, phone, ICE and medical notes are encrypted locally;
- ICE and medical notes feed Screen 5 locally;
- Ghost Mode and Pack Only stop public attendance publication;
- Public Fuzzy Sync publishes anonymous session/location/energy state rather than handler identity;
- 10-minute check-in delay is queued locally before cloud publication;
- night ghosting is enforced by an offline solar-window calculation;
- APP/privacy terms acceptance is required before private cloud backup;
- Neon account backup is optional and the app continues to operate locally without an account;
- private cloud tables are protected by owner-scoped RLS.

Design decision retained: local safety/profile storage is not blocked behind account creation or cloud consent. Cloud backup remains gated by acceptance.

## Screen 5 — Emergency Assistance Overlay

**PASS.**

Verified connections:
- global emergency hold/slide opens Screen 5 without discarding app state;
- `000` is hardcoded for Emergency Services;
- Animal Poisons Helpline `1300 869 738` is hardcoded in the local emergency layer;
- the saved Screen 4 ICE contact is callable from Screen 5;
- Screen 4 medical notes populate the device-only bystander medical vault;
- vet, ranger, GP and hospital lookups clearly require a mapping service and are not misrepresented as offline turn-by-turn routing.

## Screen 6 — Hazard / Threat Registry

**PASS.**

Verified connections:
- all four blueprint categories remain: Snake/Wildlife, Council/Infrastructure, Baiting/Poison, Altercation/Incident;
- GPS is captured when permission/signal is available, while local selected-location reporting can still be retained if GPS is unavailable;
- Now / 15 Minutes Ago time options are present;
- reports are saved locally before cloud transmission;
- same-device duplicate attempts inside the 30m / 60-minute window are rejected rather than inflating verification;
- independent matching reports are consolidated into one Verified Hazard representation;
- repeated rejected duplicates drive the Screen 9 reporting restriction;
- public hazard records omit handler identity;
- Screen 1 and Screen 2 consume the consolidated active hazard feed.

## Gate to Screen 7

Screens 1–6 remain cross-linked and no blocking defect was found that requires a behavioural rewrite before Screen 7. The major outstanding national-use gap is Screen 7: its repaired Australia-wide route calculation endpoint is now runtime-safe, but the React screen still only opens a generic map search and does not yet expose that national calculation engine. Screen 7 is therefore the next build section.
