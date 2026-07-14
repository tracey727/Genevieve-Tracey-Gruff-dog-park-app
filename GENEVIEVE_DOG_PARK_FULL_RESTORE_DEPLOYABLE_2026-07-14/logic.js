(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  else root.GenevieveLogic=api;
})(typeof self!=='undefined'?self:this,function(){
  'use strict';
  const clamp=(n,min=0,max=100)=>Math.max(min,Math.min(max,Number(n)||0));
  const round=n=>Math.round(clamp(n)*10)/10;
  function riskBand(score){
    const value=round(score);
    if(value<=24)return{score:value,level:'green',label:'Green — lower risk',action:'Proceed only with normal supervision and current-condition checks.'};
    if(value<=49)return{score:value,level:'yellow',label:'Yellow — moderate risk',action:'Use caution, reduce pressure and monitor closely.'};
    if(value<=74)return{score:value,level:'amber',label:'Amber — high risk',action:'Change the plan, use staged controls or choose another time/place.'};
    return{score:value,level:'red',label:'Red — very high risk',action:'Do not proceed under the current conditions.'};
  }
  const dims=['sociability','reactivity','energy','playIntensity','tolerance','resourceSharing','vulnerability'];
  function interactionRisk(a,b,env={}){
    if(!a||!b||a.id===b.id)return null;
    const weights={sociability:1.1,reactivity:1.55,energy:1,playIntensity:1.25,tolerance:1.45,resourceSharing:1.25,vulnerability:.9};
    let distance=0,maxDistance=0;
    dims.forEach(key=>{distance+=Math.abs((Number(a[key])||5)-(Number(b[key])||5))*weights[key];maxDistance+=10*weights[key];});
    let risk=100*distance/maxDistance;
    risk+=Math.max(0,((Number(a.reactivity)||0)+(Number(b.reactivity)||0)-12))*2.2;
    risk+=Math.max(0,Math.abs((Number(a.playIntensity)||0)-(Number(b.tolerance)||0))-4)*2.3;
    risk+=Math.max(0,Math.abs((Number(b.playIntensity)||0)-(Number(a.tolerance)||0))-4)*2.3;
    risk+=Math.max(0,((Number(a.vulnerability)||0)+(Number(b.energy)||0)-14))*1.8;
    risk+=Math.max(0,((Number(b.vulnerability)||0)+(Number(a.energy)||0)-14))*1.8;
    const capacity=Math.max(1,Number(env.capacity)||20),population=Math.max(0,Number(env.population)||0),density=population/capacity;
    risk+=Math.max(0,density-.5)*38;
    risk+=Math.max(0,(Number(env.groupEnergy)||5)-6)*3.2;
    risk+=env.gateBusy?9:0;
    risk+=env.heatRisk?Math.max(0,(Number(env.heatRisk)-35))*.18:0;
    risk+=env.quiet? -4:0;
    risk=round(risk);
    return{...riskBand(risk),riskScore:risk,baseDistance:round(100*distance/maxDistance),density:round(density*100),reasons:[
      `Behavioural profile difference ${round(100*distance/maxDistance)}%`,
      `Park density ${round(density*100)}% of working capacity`,
      `Group energy ${Number(env.groupEnergy)||5}/10`,
      env.gateBusy?'Gate congestion added pressure':'No extra gate-pressure flag',
      env.heatRisk?`Current heat risk ${round(env.heatRisk)}%`:'No heat result supplied'
    ]};
  }
  function heatRisk(input={}){
    const t=Number(input.apparentTemperature)||0,h=Number(input.humidity)||0,uv=Number(input.uvIndex)||0;
    let risk=0;
    if(t<=18)risk+=2;else if(t<=23)risk+=10+(t-18)*2;else if(t<=28)risk+=20+(t-23)*4;else if(t<=33)risk+=40+(t-28)*6;else risk+=70+(t-33)*5;
    risk+=Math.max(0,h-55)*.22;
    risk+=Math.max(0,uv-3)*1.8;
    if(input.directSun)risk+=9;if(!input.shadeAvailable)risk+=11;if(!input.waterAvailable)risk+=13;if(input.hotSurface)risk+=18;if(input.vulnerableDog)risk+=14;
    risk=round(risk);
    const band=riskBand(risk);const advice=[];
    if(risk<=24)advice.push('Keep water available and continue checking the dog and ground.');
    if(risk>=25)advice.push('Use shade, carry cool fresh water and shorten the visit.');
    if(risk>=50)advice.push('Choose a cooler time, reduce exercise and avoid hot surfaces.');
    if(risk>=75)advice.push('Postpone the outing under the current conditions.');
    if(input.hotSurface)advice.push('Avoid asphalt, concrete or sand that feels hot.');
    if(input.vulnerableDog)advice.push('Use extra caution for a young, older, unwell or flat-faced dog.');
    return{...band,riskScore:risk,advice};
  }
  function puppyAssessment(input={}){
    let risk=10;const reasons=[];
    if(input.clearance==='none'){risk+=70;reasons.push('No clearance for public dog-park attendance.');}
    if(input.clearance==='controlled'){risk+=30;reasons.push('Controlled puppy class or playdate only.');}
    if(input.setting==='busy-dog-park'){risk+=28;reasons.push('Busy public dog park adds unpredictable group pressure.');}
    if(input.setting==='puppy-class'){risk-=8;reasons.push('Structured puppy preschool reduces uncontrolled exposure.');}
    if(input.setting==='calm-playdate'||input.setting==='quiet-enclosed'){risk-=5;reasons.push('Quieter controlled setting supports gradual exposure.');}
    if(input.mentor==='calm-adult'){risk-=8;reasons.push('Calm vaccinated adult mentor selected.');}
    if(input.mentor==='similar-puppy'){risk-=3;reasons.push('Similar-energy puppy selected.');}
    if(input.mentor==='high-energy-adult'){risk+=18;reasons.push('High-energy adult may overwhelm a young dog.');}
    if(input.mentor==='unknown-group'){risk+=24;reasons.push('Unknown mixed group adds uncertainty.');}
    risk=round(risk);return{...riskBand(risk),riskScore:risk,reasons};
  }
  function etiquetteRisk(signals=[]){
    const values={relaxed:-4,playBow:-4,sniffBreaks:-3,respondsRecall:-4,stiff:18,tucked:16,avoidance:15,obsessiveChasing:20,pinning:25,guarding:22,snapping:35,overAroused:17};
    let risk=12;signals.forEach(s=>risk+=values[s]||0);risk=round(risk);
    const actions=[];if(risk>=25)actions.push('Interrupt calmly and create more space.');if(risk>=50)actions.push('Leash, reset in a quiet area and consider leaving.');if(risk>=75)actions.push('End the interaction and leave the park safely.');if(risk<25)actions.push('Continue calm supervision and regular breaks.');
    return{...riskBand(risk),riskScore:risk,actions};
  }
  function departureRisk(input={}){
    let risk=0;const missing=[];
    if(!input.lead){risk+=35;missing.push('lead');}if(!input.bags){risk+=12;missing.push('waste bags');}if(!input.water){risk+=18;missing.push('water');}if(!input.idTag){risk+=18;missing.push('ID/microchip details');}if(!input.vaccination){risk+=24;missing.push('health/vaccination check');}
    if(input.temperament==='needs-space')risk+=15;if(input.temperament==='reactive')risk+=35;if(input.temperament==='unwell')risk+=65;
    risk=round(risk);return{...riskBand(risk),riskScore:risk,missing};
  }
  function aggregateRisk(values=[]){const clean=values.map(Number).filter(Number.isFinite);if(!clean.length)return riskBand(25);return riskBand(Math.max(...clean));}
  return{clamp,round,riskBand,interactionRisk,heatRisk,puppyAssessment,etiquetteRisk,departureRisk,aggregateRisk,dims};
});
