(function(root,factory){
  const planner=factory();
  if(typeof module==='object'&&module.exports)module.exports=planner;
  if(root)root.GenevieveTripPlanner=planner;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const VERSION='2026.08.03.52';
  const STANDARD_BREAK_HOURS=2;
  const VULNERABLE_BREAK_HOURS=1.5;
  const DOG_FIRST_DRIVE_DAY_HOURS=8;
  const ROAD_SPEED_KMH=85;
  const FERRY={
    geelongTerminal:'Spirit of Tasmania Quay, 136 Corio Quay Road, North Geelong VIC 3215',
    devonportTerminal:'Spirit of Tasmania, Esplanade, East Devonport TAS 7310',
    crossingHours:'approximately 9–11 hours',
    operatorUrl:'https://www.spiritoftasmania.com.au/',
    petRulesUrl:'https://www.spiritoftasmania.com.au/terms-and-conditions/pets-and-kennels/',
    scheduleUrl:'https://www.spiritoftasmania.com.au/before-you-sail/sailing-schedule/'
  };

  const places=[
    {name:'Gold Coast QLD',terms:['gold coast','labrador','southport'],lat:-28.0167,lon:153.4000,tags:['coastal','fastest','scenic']},
    {name:'Brisbane QLD',terms:['brisbane'],lat:-27.4698,lon:153.0251,tags:['coastal','fastest']},
    {name:'Toowoomba QLD',terms:['toowoomba'],lat:-27.5598,lon:151.9507,tags:['inland','scenic']},
    {name:'Warwick QLD',terms:['warwick'],lat:-28.2187,lon:152.0347,tags:['inland']},
    {name:'Goondiwindi QLD',terms:['goondiwindi'],lat:-28.5472,lon:150.3070,tags:['inland']},
    {name:'Byron Bay NSW',terms:['byron bay'],lat:-28.6474,lon:153.6020,tags:['coastal','scenic']},
    {name:'Ballina NSW',terms:['ballina'],lat:-28.8644,lon:153.5658,tags:['coastal','fastest']},
    {name:'Grafton NSW',terms:['grafton'],lat:-29.6815,lon:152.9337,tags:['coastal','fastest']},
    {name:'Coffs Harbour NSW',terms:['coffs harbour','coffs'],lat:-30.2963,lon:153.1135,tags:['coastal','fastest','scenic']},
    {name:'Kempsey NSW',terms:['kempsey'],lat:-31.0780,lon:152.8300,tags:['coastal','fastest']},
    {name:'Port Macquarie NSW',terms:['port macquarie'],lat:-31.4333,lon:152.9000,tags:['coastal','fastest','scenic']},
    {name:'Taree NSW',terms:['taree'],lat:-31.9100,lon:152.4600,tags:['coastal','fastest']},
    {name:'Newcastle NSW',terms:['newcastle'],lat:-32.9283,lon:151.7817,tags:['coastal','fastest']},
    {name:'Gosford NSW',terms:['gosford'],lat:-33.4267,lon:151.3417,tags:['coastal','fastest']},
    {name:'Sydney NSW',terms:['sydney'],lat:-33.8688,lon:151.2093,tags:['coastal','fastest']},
    {name:'Campbelltown NSW',terms:['campbelltown'],lat:-34.0650,lon:150.8142,tags:['coastal','fastest']},
    {name:'Wollongong NSW',terms:['wollongong'],lat:-34.4278,lon:150.8931,tags:['coastal','scenic']},
    {name:'Nowra NSW',terms:['nowra'],lat:-34.8750,lon:150.6000,tags:['coastal','scenic']},
    {name:'Goulburn NSW',terms:['goulburn'],lat:-34.7547,lon:149.7202,tags:['inland','fastest']},
    {name:'Canberra ACT',terms:['canberra','belconnen'],lat:-35.2809,lon:149.1300,tags:['inland','scenic']},
    {name:'Yass NSW',terms:['yass'],lat:-34.8403,lon:148.9091,tags:['inland','fastest']},
    {name:'Gundagai NSW',terms:['gundagai'],lat:-35.0637,lon:148.1033,tags:['inland','fastest']},
    {name:'Batemans Bay NSW',terms:['batemans bay'],lat:-35.7082,lon:150.1742,tags:['coastal','scenic']},
    {name:'Narooma NSW',terms:['narooma'],lat:-36.2190,lon:150.1320,tags:['coastal','scenic']},
    {name:'Eden NSW',terms:['eden'],lat:-37.0631,lon:149.9039,tags:['coastal','scenic']},
    {name:'Lakes Entrance VIC',terms:['lakes entrance'],lat:-37.8810,lon:147.9810,tags:['coastal','scenic']},
    {name:'Bairnsdale VIC',terms:['bairnsdale'],lat:-37.8250,lon:147.6280,tags:['coastal','scenic']},
    {name:'Moree NSW',terms:['moree'],lat:-29.4658,lon:149.8416,tags:['inland']},
    {name:'Narrabri NSW',terms:['narrabri'],lat:-30.3278,lon:149.7827,tags:['inland']},
    {name:'Coonabarabran NSW',terms:['coonabarabran'],lat:-31.2739,lon:149.2770,tags:['inland','scenic']},
    {name:'Tamworth NSW',terms:['tamworth'],lat:-31.0927,lon:150.9320,tags:['inland']},
    {name:'Dubbo NSW',terms:['dubbo'],lat:-32.2569,lon:148.6011,tags:['inland','scenic']},
    {name:'Orange NSW',terms:['orange nsw','orange'],lat:-33.2836,lon:149.1000,tags:['inland','scenic']},
    {name:'Cowra NSW',terms:['cowra'],lat:-33.8330,lon:148.6960,tags:['inland']},
    {name:'Albury NSW',terms:['albury'],lat:-36.0737,lon:146.9135,tags:['inland','fastest']},
    {name:'Wangaratta VIC',terms:['wangaratta'],lat:-36.3553,lon:146.3257,tags:['inland','fastest']},
    {name:'Benalla VIC',terms:['benalla'],lat:-36.5510,lon:145.9840,tags:['inland','fastest']},
    {name:'Melbourne VIC',terms:['melbourne'],lat:-37.8136,lon:144.9631,tags:['coastal','inland','fastest','scenic']},
    {name:'Ballarat VIC',terms:['ballarat'],lat:-37.5622,lon:143.8503,tags:['inland','scenic']},
    {name:'Geelong VIC',terms:['geelong'],lat:-38.1499,lon:144.3617,tags:['coastal','inland','fastest','scenic']},
    {name:'Devonport TAS',terms:['devonport','tasmania'],lat:-41.1806,lon:146.3464,tags:['coastal','inland','fastest','scenic']},
    {name:'Launceston TAS',terms:['launceston'],lat:-41.4332,lon:147.1441,tags:['coastal','inland','fastest','scenic']},
    {name:'Campbell Town TAS',terms:['campbell town'],lat:-41.9290,lon:147.4920,tags:['coastal','inland','fastest','scenic']},
    {name:'Oatlands TAS',terms:['oatlands'],lat:-42.2990,lon:147.3720,tags:['coastal','inland','fastest','scenic']},
    {name:'Hobart TAS',terms:['hobart'],lat:-42.8821,lon:147.3272,tags:['coastal','inland','fastest','scenic']},
    {name:'Adelaide SA',terms:['adelaide'],lat:-34.9285,lon:138.6007,tags:['coastal','fastest']},
    {name:'Mount Gambier SA',terms:['mount gambier'],lat:-37.8284,lon:140.7804,tags:['coastal','scenic']},
    {name:'Perth WA',terms:['perth'],lat:-31.9523,lon:115.8613,tags:['coastal','fastest']},
    {name:'Albany WA',terms:['albany'],lat:-35.0269,lon:117.8837,tags:['coastal','scenic']},
    {name:'Darwin NT',terms:['darwin'],lat:-12.4634,lon:130.8456,tags:['inland','fastest']},
    {name:'Alice Springs NT',terms:['alice springs'],lat:-23.6980,lon:133.8807,tags:['inland','scenic']}
  ];

  const qldTasPresets={
    fastest:['Ballina NSW','Grafton NSW','Coffs Harbour NSW','Kempsey NSW','Port Macquarie NSW','Taree NSW','Newcastle NSW','Gosford NSW','Sydney NSW','Campbelltown NSW','Goulburn NSW','Yass NSW','Gundagai NSW','Albury NSW','Wangaratta VIC','Benalla VIC','Melbourne VIC','Geelong VIC','Devonport TAS','Launceston TAS','Campbell Town TAS','Oatlands TAS','Hobart TAS'],
    coastal:['Byron Bay NSW','Ballina NSW','Grafton NSW','Coffs Harbour NSW','Kempsey NSW','Port Macquarie NSW','Taree NSW','Newcastle NSW','Gosford NSW','Sydney NSW','Wollongong NSW','Nowra NSW','Batemans Bay NSW','Narooma NSW','Eden NSW','Lakes Entrance VIC','Bairnsdale VIC','Melbourne VIC','Geelong VIC','Devonport TAS','Launceston TAS','Campbell Town TAS','Oatlands TAS','Hobart TAS'],
    inland:['Toowoomba QLD','Warwick QLD','Goondiwindi QLD','Moree NSW','Narrabri NSW','Coonabarabran NSW','Dubbo NSW','Orange NSW','Cowra NSW','Canberra ACT','Yass NSW','Gundagai NSW','Albury NSW','Wangaratta VIC','Benalla VIC','Melbourne VIC','Geelong VIC','Devonport TAS','Launceston TAS','Campbell Town TAS','Oatlands TAS','Hobart TAS'],
    scenic:['Byron Bay NSW','Coffs Harbour NSW','Port Macquarie NSW','Newcastle NSW','Sydney NSW','Wollongong NSW','Nowra NSW','Batemans Bay NSW','Narooma NSW','Eden NSW','Lakes Entrance VIC','Bairnsdale VIC','Melbourne VIC','Geelong VIC','Devonport TAS','Launceston TAS','Campbell Town TAS','Oatlands TAS','Hobart TAS']
  };

  const styleLabels={fastest:'Fastest practical route',coastal:'Coastal route',inland:'Inland route',scenic:'Scenic route'};
  const normal=value=>String(value||'').trim().toLowerCase();
  const round=(value,placesCount=1)=>{const factor=10**placesCount;return Math.round(value*factor)/factor;};

  function placeFor(query){
    const lower=normal(query);
    return places.find(place=>place.terms.some(term=>lower.includes(term)))||null;
  }

  function endpointFor(plan,key){
    const query=String(plan?.[key]||'').trim();
    const rawLat=plan?.[`${key}Latitude`],rawLon=plan?.[`${key}Longitude`];
    const lat=rawLat===''||rawLat===null||rawLat===undefined?NaN:Number(rawLat);
    const lon=rawLon===''||rawLon===null||rawLon===undefined?NaN:Number(rawLon);
    if(Number.isFinite(lat)&&Number.isFinite(lon)&&Math.abs(lat)<=90&&Math.abs(lon)<=180){
      return {name:query||`${round(lat,5)}, ${round(lon,5)}`,terms:[],lat,lon,tags:['fastest','coastal','inland','scenic'],custom:true,mapQuery:`${lat},${lon}`};
    }
    const known=placeFor(query);
    return known?{...known,mapQuery:known.name}:null;
  }

  function regionFor(query,point){
    const lower=normal(query);
    if(/\b(tasmania|tas|hobart|devonport|launceston)\b/.test(lower)||(point&&point.lat<-39&&point.lon>143&&point.lon<150))return 'TAS';
    if(/\b(qld|queensland|gold coast|brisbane|labrador|southport|toowoomba)\b/.test(lower)||(point&&point.lat>-30&&point.lat<-9&&point.lon>137&&point.lon<154.5))return 'QLD';
    return point?'MAINLAND':'UNKNOWN';
  }

  function dogBreakPolicy(dog={}){
    const reasons=[];
    const lifeStage=normal(dog.lifeStage);
    if(lifeStage==='puppy')reasons.push('puppy life stage');
    if(lifeStage==='senior')reasons.push('senior life stage');
    if(String(dog.medical||'').trim())reasons.push('saved medical information');
    if(dog.supportNeeds&&dog.supportNeeds!=='none')reasons.push('saved support need');
    const vulnerable=reasons.length>0;
    return {
      hours:vulnerable?VULNERABLE_BREAK_HOURS:STANDARD_BREAK_HOURS,
      minutes:(vulnerable?VULNERABLE_BREAK_HOURS:STANDARD_BREAK_HOURS)*60,
      vulnerable,
      reasons,
      explanation:vulnerable
        ?`The 1.5-hour planning ceiling is applied because the profile includes ${reasons.join(', ')}.`
        :'The two-hour planning ceiling is applied automatically. Stop earlier for heat, stress, toileting, illness, traffic or driver fatigue.'
    };
  }

  function haversineKm(a,b){
    if(!a||!b)return Infinity;
    const values=[a.lat,a.lon,b.lat,b.lon].map(Number);
    if(values.some(value=>!Number.isFinite(value)))return Infinity;
    const [lat1,lon1,lat2,lon2]=values.map(value=>value*Math.PI/180),earth=6371;
    const deltaLat=lat2-lat1,deltaLon=lon2-lon1;
    const hav=Math.sin(deltaLat/2)**2+Math.cos(lat1)*Math.cos(lat2)*Math.sin(deltaLon/2)**2;
    return 2*earth*Math.asin(Math.sqrt(hav));
  }

  function roadFactor(style){return style==='scenic'?1.22:style==='coastal'?1.2:1.18;}
  function isFerryPair(a,b){
    const pair=[a?.name,b?.name];
    return pair.includes('Geelong VIC')&&pair.includes('Devonport TAS');
  }

  function genericPath(start,end,style){
    if(!start||!end)return [];
    const dx=end.lon-start.lon,dy=end.lat-start.lat,lengthSq=dx*dx+dy*dy||1;
    const candidates=places.map(place=>{
      const px=place.lon-start.lon,py=place.lat-start.lat;
      const t=(px*dx+py*dy)/lengthSq;
      const projectedLon=start.lon+t*dx,projectedLat=start.lat+t*dy;
      return {...place,t,offset:Math.hypot(place.lon-projectedLon,place.lat-projectedLat),mapQuery:place.name};
    }).filter(place=>place.name!==start.name&&place.name!==end.name&&place.t>0.025&&place.t<0.975&&place.offset<4.25&&(style==='scenic'||place.tags.includes(style)))
      .sort((a,b)=>a.t-b.t);
    return [start,...candidates,end];
  }

  function namedPoint(name){
    const point=places.find(place=>place.name===name);
    return point?{...point,mapQuery:point.name}:null;
  }

  function compactPoints(points){
    return points.filter(Boolean).filter((point,index,list)=>index===0||point.name!==list[index-1].name);
  }

  function qldTasPath(plan,style,start,end,direction){
    let names=[...(qldTasPresets[style]||qldTasPresets.fastest)];
    if(direction==='tas-to-mainland')names.reverse();
    const startIndex=names.indexOf(start.name);
    if(startIndex>=0)names=names.slice(startIndex+1);
    const endIndex=names.indexOf(end.name);
    if(endIndex>=0)names=names.slice(0,endIndex+1);
    const points=[start,...names.map(namedPoint)];
    if(points.at(-1)?.name!==end.name)points.push(end);
    return compactPoints(points);
  }

  function buildRoutePoints(plan,style){
    const start=endpointFor(plan,'from'),end=endpointFor(plan,'to');
    if(!start||!end)return {calculable:false,error:'Use current location or enter a supported Australian town shown in the suggestions for both From and To. GENEVIEVE will not invent a stop count without route coordinates.'};
    const startRegion=regionFor(plan.from,start),endRegion=regionFor(plan.to,end);
    const mainlandToTas=startRegion!=='TAS'&&endRegion==='TAS';
    const tasToMainland=startRegion==='TAS'&&endRegion!=='TAS';
    let points=[];
    if((startRegion==='QLD'&&endRegion==='TAS')||(startRegion==='TAS'&&endRegion==='QLD')){
      points=qldTasPath(plan,style,start,end,startRegion==='TAS'?'tas-to-mainland':'mainland-to-tas');
    }else if(mainlandToTas||tasToMainland){
      const geelong=namedPoint('Geelong VIC'),devonport=namedPoint('Devonport TAS');
      if(mainlandToTas){
        const mainland=genericPath(start,geelong,style);
        const island=end.name==='Devonport TAS'?[devonport]:genericPath(devonport,end,style);
        points=compactPoints([...mainland,...island]);
      }else{
        const island=start.name==='Devonport TAS'?[start]:genericPath(start,devonport,style);
        const mainland=genericPath(geelong,end,style);
        points=compactPoints([...island,...mainland]);
      }
    }else{
      points=genericPath(start,end,style);
    }
    return {calculable:points.length>=2,points,start,end,startRegion,endRegion,error:points.length>=2?'':'A route estimate could not be built from those locations.'};
  }

  function breakName(sectionPoints,desiredHour,cumulative,index){
    let afterIndex=cumulative.findIndex(value=>value>=desiredHour);
    if(afterIndex<1)afterIndex=Math.min(sectionPoints.length-1,Math.max(1,afterIndex));
    const before=sectionPoints[Math.max(0,afterIndex-1)],after=sectionPoints[Math.min(sectionPoints.length-1,afterIndex)];
    return {name:`Required safe rest-area break ${index+1}`,mapQuery:`rest area between ${before.name} and ${after.name}`,searchLocation:`${before.name} to ${after.name}`,synthetic:true};
  }

  function calculateRoadSection(points,style,policy,sectionIndex){
    const factor=roadFactor(style),cumulative=[0];
    let km=0;
    for(let index=1;index<points.length;index++){
      km+=haversineKm(points[index-1],points[index])*factor;
      cumulative.push(km/ROAD_SPEED_KMH);
    }
    const hours=km/ROAD_SPEED_KMH;
    const breakCount=Math.max(0,Math.ceil(hours/policy.hours)-1);
    const candidates=points.slice(1,-1).map((point,index)=>({point,hour:cumulative[index+1],index}));
    const stops=[];
    let previousCandidate=-1;
    for(let index=0;index<breakCount;index++){
      const desired=hours*(index+1)/(breakCount+1);
      let stop;
      if(candidates.length>=breakCount){
        const first=previousCandidate+1;
        const last=candidates.length-(breakCount-index);
        let bestIndex=first;
        for(let candidateIndex=first;candidateIndex<=last;candidateIndex++){
          if(Math.abs(candidates[candidateIndex].hour-desired)<Math.abs(candidates[bestIndex].hour-desired))bestIndex=candidateIndex;
        }
        previousCandidate=bestIndex;
        const chosen=candidates[bestIndex];
        stop={name:chosen.point.name,mapQuery:chosen.point.mapQuery||chosen.point.name,synthetic:false};
      }else{
        const unused=candidates.filter(candidate=>!stops.some(item=>item.name===candidate.point.name));
        const chosen=unused.sort((a,b)=>Math.abs(a.hour-desired)-Math.abs(b.hour-desired))[0];
        stop=chosen&&Math.abs(chosen.hour-desired)<=0.75
          ?{name:chosen.point.name,mapQuery:chosen.point.mapQuery||chosen.point.name,synthetic:false}
          :breakName(points,desired,cumulative,index);
      }
      stops.push({...stop,sectionIndex,plannedHour:round(desired,1),hoursFromPrevious:round(desired-(stops[index-1]?.plannedHour||0),1),overnight:false});
    }
    const overnightCount=Math.max(0,Math.ceil(hours/DOG_FIRST_DRIVE_DAY_HOURS)-1);
    const usedNightIndexes=new Set();
    for(let night=0;night<overnightCount&&stops.length;night++){
      const target=hours*(night+1)/(overnightCount+1);
      let best=-1;
      stops.forEach((stop,index)=>{
        if(usedNightIndexes.has(index))return;
        if(best<0||Math.abs(stop.plannedHour-target)<Math.abs(stops[best].plannedHour-target))best=index;
      });
      if(best>=0){stops[best].overnight=true;usedNightIndexes.add(best);}
    }
    return {
      type:'road',sectionIndex,start:points[0],end:points.at(-1),points,
      roadKm:round(km,0),driveHours:round(hours,1),roadDays:Math.max(1,Math.ceil(hours/DOG_FIRST_DRIVE_DAY_HOURS)),
      overnightCount,breakCount,stops
    };
  }

  function calculateVariant(plan,dog,style){
    const path=buildRoutePoints(plan,style),policy=dogBreakPolicy(dog);
    if(!path.calculable)return {style,label:styleLabels[style],calculable:false,error:path.error,policy};
    const parts=[];
    let roadPoints=[path.points[0]],sectionIndex=0;
    for(let index=1;index<path.points.length;index++){
      const previous=path.points[index-1],current=path.points[index];
      if(isFerryPair(previous,current)){
        if(roadPoints.length>1)parts.push(calculateRoadSection(roadPoints,style,policy,sectionIndex++));
        parts.push({type:'ferry',from:previous,to:current,direction:previous.name==='Geelong VIC'?'Geelong to Devonport':'Devonport to Geelong',...FERRY});
        roadPoints=[current];
      }else roadPoints.push(current);
    }
    if(roadPoints.length>1)parts.push(calculateRoadSection(roadPoints,style,policy,sectionIndex));
    const roadParts=parts.filter(part=>part.type==='road'),stops=roadParts.flatMap(part=>part.stops);
    const routeTowns=path.points.slice(1,-1).filter(point=>!['Geelong VIC','Devonport TAS'].includes(point.name)).map(point=>point.name);
    const summaryTowns=routeTowns.length<=6?routeTowns:routeTowns.filter((_,index)=>index===0||index===routeTowns.length-1||index%Math.ceil(routeTowns.length/5)===0).slice(0,6);
    return {
      style,label:styleLabels[style],calculable:true,recommended:style==='fastest',policy,parts,stops,
      requiredBreaks:stops.length,
      roadOvernights:roadParts.reduce((total,part)=>total+part.overnightCount,0),
      roadDays:roadParts.reduce((total,part)=>total+part.roadDays,0),
      roadKm:roadParts.reduce((total,part)=>total+part.roadKm,0),
      driveHours:round(roadParts.reduce((total,part)=>total+part.driveHours,0),1),
      hasFerry:parts.some(part=>part.type==='ferry'),ferryCount:parts.filter(part=>part.type==='ferry').length,summaryTowns,start:path.start,end:path.end
    };
  }

  function planRoutes(plan,dog){
    const chosen=styleLabels[plan?.routeStyle]?plan.routeStyle:'fastest';
    const firstPath=buildRoutePoints(plan,chosen);
    if(!firstPath.calculable)return {calculable:false,error:firstPath.error,policy:dogBreakPolicy(dog),options:[]};
    const isTasTrip=firstPath.startRegion==='TAS'||firstPath.endRegion==='TAS';
    const styles=isTasTrip?['fastest','coastal','inland','scenic']:[chosen,...['fastest','coastal','inland','scenic'].filter(style=>style!==chosen)];
    const options=styles.map(style=>calculateVariant(plan,dog,style)).filter(option=>option.calculable);
    const selected=options.find(option=>option.style===chosen)||options[0];
    return {calculable:Boolean(selected),selected,options,policy:selected?.policy||dogBreakPolicy(dog),error:selected?'':'A route estimate could not be calculated.'};
  }

  return Object.freeze({
    version:VERSION,places:Object.freeze(places.map(place=>Object.freeze({...place}))),ferry:Object.freeze({...FERRY}),
    constants:Object.freeze({STANDARD_BREAK_HOURS,VULNERABLE_BREAK_HOURS,DOG_FIRST_DRIVE_DAY_HOURS,ROAD_SPEED_KMH}),
    routeStyleLabel:value=>styleLabels[value]||'Calculated route',placeFor,endpointFor,dogBreakPolicy,planRoutes,calculateVariant
  });
});
