(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  else root.GenevieveNotificationLogic=api;
})(typeof self!=='undefined'?self:this,function(){
  'use strict';

  function timeToMinutes(value){
    const match=String(value||'').match(/^(\d{2}):(\d{2})$/);
    if(!match)return null;
    const hours=Number(match[1]),minutes=Number(match[2]);
    if(hours>23||minutes>59)return null;
    return hours*60+minutes;
  }

  function isQuietHours(date,start,end){
    const startMinutes=timeToMinutes(start),endMinutes=timeToMinutes(end);
    if(startMinutes===null||endMinutes===null||startMinutes===endMinutes)return false;
    const current=date.getHours()*60+date.getMinutes();
    if(startMinutes<endMinutes)return current>=startMinutes&&current<endMinutes;
    return current>=startMinutes||current<endMinutes;
  }

  function daysUntil(value,nowValue=Date.now()){
    if(!value)return null;
    const due=new Date(`${value}T00:00:00`);
    if(Number.isNaN(due.getTime()))return null;
    const current=new Date(Number(nowValue));
    current.setHours(0,0,0,0);
    return Math.round((due.getTime()-current.getTime())/86400000);
  }

  function cooldownReady(lastSentAt,nowValue=Date.now(),cooldownMinutes=60){
    if(!lastSentAt)return true;
    const last=new Date(lastSentAt).getTime();
    if(!Number.isFinite(last))return true;
    return Number(nowValue)-last>=Math.max(0,Number(cooldownMinutes)||0)*60000;
  }

  function locationLabel(park,detail='park'){
    if(!park||detail==='off')return '';
    if(detail==='approximate')return park.suburb||park.state||'';
    return park.name||park.suburb||'';
  }

  function detectPlatform(userAgent='',platform='',maxTouchPoints=0){
    const ua=String(userAgent),devicePlatform=String(platform);
    if(/Android/i.test(ua))return 'Android';
    if(/iPhone|iPad|iPod/i.test(ua)||(/Mac/i.test(devicePlatform)&&Number(maxTouchPoints)>1))return 'iPhone / iPad';
    if(/Windows/i.test(ua)||/Win/i.test(devicePlatform))return 'Windows';
    if(/CrOS/i.test(ua))return 'ChromeOS';
    if(/Macintosh|Mac OS/i.test(ua)||/Mac/i.test(devicePlatform))return 'Mac';
    if(/Linux/i.test(ua)||/Linux/i.test(devicePlatform))return 'Linux';
    return 'This device';
  }

  function roleCanReceive(role,audiences){
    if(!Array.isArray(audiences)||!audiences.length)return true;
    return audiences.includes(role);
  }

  function deliveryLayer({secureContext=false,notifications=false,serviceWorker=false}={}){
    return secureContext&&notifications&&serviceWorker?'system-and-in-app':'in-app-only';
  }

  return{timeToMinutes,isQuietHours,daysUntil,cooldownReady,locationLabel,detectPlatform,roleCanReceive,deliveryLayer};
});
