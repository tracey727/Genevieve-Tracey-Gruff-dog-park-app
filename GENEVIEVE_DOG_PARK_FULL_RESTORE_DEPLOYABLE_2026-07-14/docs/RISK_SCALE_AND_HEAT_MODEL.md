# GENEVIEVE App™ Risk Scale and Dog Heat Model

Version: 2026.07.14.2  
Implemented: 14 July 2026

## Universal risk direction

All safety percentages produced by this build use the same direction:

- 0 means the lower-risk end;
- 100 means the highest-risk end;
- 0–24 is Green;
- 25–49 is Yellow;
- 50–74 is Amber; and
- 75–100 is Red.

This classifier is used by both the animal-interaction model and the dog heat model. The display bar runs Green → Yellow → Amber → Red from left to right.

## Interaction-risk conversion

The behavioural engine first calculates a compatibility value from weighted distance across:

- sociability;
- reactivity;
- energy;
- play intensity;
- tolerance;
- resource sharing; and
- vulnerability.

The base interaction risk is calculated as:

`base risk = 100 − behavioural compatibility`

Environmental risk is then added using current population density, group energy and reactivity pressure. The final score is clamped to the range 0–100 and classified through the universal risk bands.

Older locally saved records from the prior reversed display are migrated using:

`new risk = 100 − previous compatibility percentage`

The original percentage is retained in the migrated record for audit purposes.

## Dog heat-risk inputs

The heat model uses:

- apparent or “feels like” temperature;
- relative humidity;
- UV index;
- direct-sun exposure;
- reliable shade availability;
- cool fresh water availability;
- hot asphalt, concrete or sand; and
- dog-specific vulnerability.

The temperature component rises progressively rather than immediately becoming Red. Contextual modifiers are added for humidity, UV, direct sun, lack of shade, lack of water, hot surfaces and vulnerability. The final heat risk is clamped to 0–100 and uses the same universal classifier.

## Weather modes

1. **Manual mode:** The user enters current conditions. This always remains available.
2. **Current-weather mode:** After the user enables precise location and grants browser permission, approximate device coordinates are sent to the configured weather service to retrieve apparent temperature, humidity and UV. Coordinates are not written into the local evidence record by this build.

## Evidence records

Each interaction-risk or heat-risk check stores:

- timestamp;
- model version;
- dog and park identifiers;
- input values;
- final percentage;
- classification;
- score direction; and
- environmental or heat modifiers.

## Safety boundary

The model is precautionary decision support. It does not measure the dog’s internal body temperature, guarantee behaviour, diagnose heatstroke or replace direct supervision, official warnings or veterinary advice. Professional veterinary-safety and legal review are required before public marketing beyond decision-support wording.
