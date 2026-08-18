import assert from 'node:assert/strict';
import {boundaryDecision,derivePresenceStatus,getSolarState,OWNER_DUTY_MINUTES,publicAttendanceState,STAGE5_GATES,validateDutyMinutes} from '../lib/stage5-policy.js';

assert.deepEqual(OWNER_DUTY_MINUTES,[5,10,15,20]);
for(const n of OWNER_DUTY_MINUTES)assert.equal(validateDutyMinutes(n),n);
assert.throws(()=>validateDutyMinutes(30),/invalid-owner-duty-interval/);
const future={dutyDueAt:'2026-08-18T04:20:00Z',ownerLocationState:'INSIDE'};
assert.equal(derivePresenceStatus(future,new Date('2026-08-18T04:10:00Z')),'CONFIRMED_PRIVATE');
assert.equal(derivePresenceStatus(future,new Date('2026-08-18T04:21:00Z')),'SUPERVISION_CONFIRMATION_DUE');
assert.equal(derivePresenceStatus({...future,ownerLocationState:'LEFT'},new Date('2026-08-18T04:10:00Z')),'OWNER_LEFT_CHECKOUT_DUE');

const noPolicy=boundaryDecision({userLatitude:-27.47,userLongitude:153.02,accuracyM:10,parkLatitude:-27.47,parkLongitude:153.02});
assert.equal(noPolicy.decision,'UNKNOWN');assert.equal(noPolicy.preciseLocationStored,false);
const policy={verified:true,type:'CIRCLE',radiusM:150,maxAccuracyM:50};
const inside=boundaryDecision({userLatitude:-27.4700,userLongitude:153.0200,accuracyM:10,parkLatitude:-27.4700,parkLongitude:153.0200,boundaryPolicy:policy});
assert.equal(inside.decision,'IN_BOUNDARY');assert.equal(inside.preciseLocationStored,false);
const outside=boundaryDecision({userLatitude:-27.4800,userLongitude:153.0200,accuracyM:10,parkLatitude:-27.4700,parkLongitude:153.0200,boundaryPolicy:policy});
assert.equal(outside.decision,'OUTSIDE');
const poor=boundaryDecision({userLatitude:-27.4700,userLongitude:153.0200,accuracyM:80,parkLatitude:-27.4700,parkLongitude:153.0200,boundaryPolicy:policy});
assert.equal(poor.decision,'UNKNOWN');assert.equal(poor.accuracyState,'LOW_ACCURACY');
for(const result of [noPolicy,inside,outside,poor])for(const forbidden of ['latitude','longitude','userLatitude','userLongitude','distance'])assert.equal(Object.hasOwn(result,forbidden),false,`derived boundary result leaked ${forbidden}`);

const brisbaneDay=getSolarState({latitude:-27.47,longitude:153.03,timeZone:'Australia/Brisbane',now:new Date('2026-08-18T02:00:00Z')});
assert.equal(brisbaneDay.status,'CALCULATED');assert.equal(brisbaneDay.phase,'DAYLIGHT');assert.equal(brisbaneDay.nightPrivacy,false);
const brisbaneNight=getSolarState({latitude:-27.47,longitude:153.03,timeZone:'Australia/Brisbane',now:new Date('2026-08-18T12:00:00Z')});
assert.equal(brisbaneNight.status,'CALCULATED');assert.equal(brisbaneNight.nightPrivacy,true);
const unknownSolar=getSolarState({});assert.equal(unknownSolar.phase,'UNKNOWN');assert.equal(unknownSolar.nightPrivacy,true);assert.equal(publicAttendanceState({solarState:unknownSolar,policy:STAGE5_GATES}).state,'HIDDEN_SOLAR_UNKNOWN');
for(const sample of [
  [-33.87,151.21,'Australia/Sydney'],[-37.81,144.96,'Australia/Melbourne'],[-31.95,115.86,'Australia/Perth'],[-34.93,138.60,'Australia/Adelaide']
])assert.equal(getSolarState({latitude:sample[0],longitude:sample[1],timeZone:sample[2],now:new Date('2026-08-18T02:00:00Z')}).status,'CALCULATED',`solar unavailable for ${sample[2]}`);

const hiddenNight=publicAttendanceState({solarState:brisbaneNight,policy:STAGE5_GATES});assert.equal(hiddenNight.available,false);assert.equal(hiddenNight.state,'HIDDEN_NIGHT_SAFETY');
const hiddenDay=publicAttendanceState({solarState:brisbaneDay,policy:STAGE5_GATES});assert.equal(hiddenDay.available,false);assert.equal(hiddenDay.state,'HIDDEN_POLICY_PENDING');
assert.ok(!JSON.stringify(hiddenDay).match(/count|identity|arrival/i));
console.log('Stage 5 engine audit PASS: Owner Duty intervals, private presence expiry state, derived-only boundary decisions, Australian solar phases and fail-closed attendance gates are enforced.');
