GENEVIEVE APP™ DOG PARKS — CLEAN VERCEL DEPLOYMENT
Build 2026.08.03.52

THIS REPOSITORY IS THE DEPLOYABLE APP
- Keep all files and folders at the repository root.
- Vercel framework preset: Other.
- Root directory, build command, install command and output directory: leave blank.
- vercel.json supplies the one API-function setting plus cache and security headers.
- index.html is the entry page. There is no npm install or build step.

ONE SERVER-SIDE ROUTING SETTING IS REQUIRED FOR ANY AUSTRALIAN ADDRESS
1. Create an openrouteservice API key for the deployed app.
2. In Vercel Project Settings > Environment Variables add:
   OPENROUTESERVICE_API_KEY = the real routing key
3. Apply it to Production (and Preview if preview testing is needed), then redeploy.
4. Never put this key in config.js, index.html or any other public browser file.

The browser sends start, destination, required places and only the derived 1.5-hour or 2-hour break ceiling to the same-origin /api/trip-calculate function. It does not send the dog’s name or medical details to the routing provider.

If the server key or live route service is unavailable, GENEVIEVE uses the curated route estimate only for recognised locations. An unknown address receives a 9/10 red alert and no invented stop count.

VERIFICATION
1. This package passed 292 automated static, route-engine, DOM interaction and refresh-persistence checks before packaging.
2. Deploy the main branch in Vercel and add the server-side routing key above.
3. Confirm the footer says Dog Parks build 2026.08.03.52 and legal version 2026-08-03-trip-routing.
4. Calculate a local mainland trip, an interstate trip and a mainland-to-Tasmania trip.
5. Confirm every screen and Back one step opens at the top.
6. Open once online, refresh, install to the home screen, then test an offline reload.

LOCKED PRODUCT FACTS
- Today opens first.
- Today lets a person type a dog park, suburb or address; the entry survives refresh and opens matching Parks results at the top.
- Full official GA and roots header appears only on Today.
- Journey, Parks, Dogs and More are separate bottom toggles.
- Today’s visit steps and the full Grey Nomad planner are consolidated into one Journey page.
- Journey accepts an Australian address, suburb, town or authorised current location plus up to eight required places in order.
- With the server key configured, openrouteservice resolves Australian locations and calculates road geometry; Tasmania transitions insert the Geelong–Devonport ferry.
- Journey calculates dog-care breaks and road overnights from the route and saved dog profile. The person cannot choose a longer interval or guess the stop count.
- A calculated route coordinate is not represented as a verified stopping facility. The user must choose a lawful, signed, dog-safe stop at or before each marker.
- Trip attention colours use 1–2 green, 3–5 yellow, 6–7 amber and 8–10 red. They show planning attention, not predicted safety.
- Saved trip calculations include the rule version, timestamp, calculation mode and SHA-256 fingerprint.
- Dated factual trip findings save after refresh and export as JSON or CSV for the separate Animal patent testing record. The records do not themselves establish patent validity or grant.
- Every screen opens at the top, including Back one step and repeated bottom-toggle taps.
- Four advertised plans remain A$14.99, A$10.49, A$119.99 and A$83.99.
- Stripe payment links remain disabled until real verified public links are entered in config.js.
- The Emergency screen, hold logic, nearby-service logic and persistent Emergency control are byte-identical to V51.

The superseded deployment folders, V33–V39 repair layers, rollback scripts and duplicate GitHub Pages copy are not in this clean deployment root.
