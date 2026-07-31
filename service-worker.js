const CACHE='genevieve-dog-parks-safety-compatibility-2026-07-31-v40-inline-ga';
const VERSION='2026.07.31.40';
const ASSETS=[
  './','./index.html','./styles.css?v=20260731.40','./config.js?v=20260731.40','./logic.js?v=20260731.40',
  './notification-logic.js?v=20260731.40','./app.js?v=20260731.40','./repair.js?v=20260731.40','./backend.js?v=20260731.40','./native-billing-bridge.js?v=20260731.40',
  './manifest.webmanifest?v=20260731.40','./genevieve-v40-boot.js?v=20260731.40','./genevieve-v40-repair.js?v=20260731.40','./assets/ga-master-icon-64-v35.png','./assets/ga-master-apple-touch-180-v35.png',
  './assets/ga-master-app-icon-192-v35.png','./assets/ga-master-app-icon-512-v35.png',
  './assets/genevieve-ga-logo-v35.png','./assets/ga-master-locked-2026-07-29.jpeg','./assets/genevieve-safety-from-roots-locked-2026-07-29.jpeg','./404.html',
  './legal/','./legal/legal.css','./legal/privacy-policy.html','./legal/terms-of-use.html','./legal/safety-disclaimer.html',
  './legal/refund-cancellation-policy.html','./legal/account-deletion.html','./legal/community-guidelines.html',
  './legal/subscription-terms.html','./legal/concession-pricing-policy.html','./legal/support.html','./legal/ip-notice.html'
];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE&&key.includes('genevieve')).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('message',event=>{if(event.data==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('notificationclick',event=>{
  event.notification.close();
  const target=event.action==='emergency'
    ?new URL('./#emergency',self.location.href).href
    :event.notification.data?.url||new URL('./#notifications',self.location.href).href;
  event.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(async clients=>{
    for(const client of clients){
      if('navigate' in client)await client.navigate(target);
      if('focus' in client)return client.focus();
    }
    if(self.clients.openWindow)return self.clients.openWindow(target);
    return undefined;
  }));
});
self.addEventListener('push',event=>{
  let payload={};
  try{payload=event.data?.json?.()||{};}catch{payload={body:event.data?.text?.()||''};}
  const title=payload.title||'GENEVIEVE safety alert';
  const options={
    body:payload.body||'Open GENEVIEVE to review the alert.',
    icon:'./assets/ga-master-app-icon-192-v35.png',
    badge:'./assets/ga-master-icon-64-v35.png',
    tag:payload.tag||'genevieve-push-alert',
    requireInteraction:Boolean(payload.critical),
    vibrate:payload.critical?[500,200,500,200,700]:[250,100,250],
    lang:'en-AU',
    timestamp:Date.now(),
    actions:payload.critical?[{action:'open',title:'Open alert'},{action:'emergency',title:'Emergency help'}]:[{action:'open',title:'Open GENEVIEVE'}],
    data:{url:payload.url||new URL('./#notifications',self.location.href).href}
  };
  event.waitUntil(self.registration.showNotification(title,options));
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;
  if(event.request.mode==='navigate'){
    event.respondWith(fetch(event.request,{cache:'no-store'}).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put('./index.html',copy));return response;}).catch(()=>caches.match('./index.html')));
    return;
  }
  event.respondWith(fetch(event.request).then(response=>{if(response&&response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));}return response;}).catch(()=>caches.match(event.request)));
});
