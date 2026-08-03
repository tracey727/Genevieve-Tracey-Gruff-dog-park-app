# GENEVIEVE Dog Parks test report

Build: `2026.08.03.46`  
Tested: 3 August 2026  
Target launch: 8 August 2026

## Result

- 142/142 repository smoke checks passed.
- 11/11 JavaScript files passed Node syntax checking.
- CSS parsed successfully and passed Prettier validation.
- `manifest.webmanifest`, `vercel.json` and `package.json` parsed as valid JSON.
- Nine key routes/assets returned HTTP 200 from a local static deployment.
- All HTML and service-worker file references resolve in the delivery.

## Verified

- Full production application retained: Today, Journey, Parks, Dogs, More, safety, compatibility, heat, check-in, travel, accessibility, emergency, membership and legal screens.
- Today remains the initial screen.
- Official embedded GA header artwork, GA icons and roots/journey artwork remain in place.
- Original green, gold, red and field colour tokens remain in place.
- Emergency control is outside the five-button page navigation and is persistent across screens.
- The global control requires a three-second hold and opens the full nearby-services hub; it does not call.
- Triple Zero has a second protected three-second hold and separate confirmation slide; pointer cancellation is handled.
- Nearby emergency vets, general vets, council animal management/ranger, pound/shelter, RSPCA, animal rescue, wildlife help and police searches use a manually entered place or explicitly requested current location.
- Current coordinates are not stored by GENEVIEVE and no service is contacted automatically.
- Four membership prices are unchanged.
- Missing Stripe links and native-store bridges are refused instead of opening an invented checkout.
- Missing Supabase credentials are represented as disabled, not live.
- PWA cache version was bumped and every required cached file now exists.
- Legal Centre contains ten linked launch-candidate documents.
- Vercel cache and basic security headers parse correctly.

## Required manual verification

Automated static checks cannot prove behaviour on every real phone, payment-provider account or store build. Before public use, test on at least one current iPhone/Safari and Android/Chrome device:

1. Install/refresh the PWA and confirm the new build marker.
2. Open every main tab and confirm the emergency dock never covers required content.
3. Confirm a short tap does nothing, interrupted holds cancel, a full three-second hold reveals confirmation, Cancel closes it, and the slider requests the dialler only when deliberately completed.
4. Test check-in, checkout, expiry, dog create/edit/delete, map hand-off, weather permission, export and local deletion.
5. Test offline reload after one connected visit.
6. Re-test all payment paths only after provider configuration is added.

No automated emergency call was placed and no real payment was attempted.
