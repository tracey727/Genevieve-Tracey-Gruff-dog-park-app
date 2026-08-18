import '../config.js';
import './payment-layer.css';
import { secureGet } from './secureStore.js';

const LOGO='/assets/genevieve-roots-512.png';
const MEMBERSHIP_SESSION_KEY='genevieve:stripe:checkout_session';
const MEMBERSHIP_REFERENCE_KEY='genevieve:stripe:member_reference';
const STRIPE_PORTAL_LOGIN='https://billing.stripe.com/p/login/dRm7sM5Qi57R4FmgV01wY00';
const PLAN_COPY={
  standardMonthly:{label:'Standard Monthly',price:'$14.99 AUD',period:'per month'},
  concessionMonthly:{label:'Concession Monthly',price:'$10.49 AUD',period:'per month'},
  standardAnnual:{label:'Standard Annual',price:'$119.99 AUD',period:'per year'},
  concessionAnnual:{label:'Concession Annual',price:'$83.00 AUD',period:'per year'}
};

function paymentLinkFor(planKey){
  const value=window.GENEVIEVE_CONFIG?.paymentLinks?.[planKey];
  return typeof value==='string'&&/^https:\/\//i.test(value)?value.trim():'';
}
function savedMembershipSession(){return localStorage.getItem(MEMBERSHIP_SESSION_KEY)||''}
function saveMembershipSession(value){
  const id=String(value||'').trim();
  if(/^cs_[A-Za-z0-9_]+$/.test(id)) localStorage.setItem(MEMBERSHIP_SESSION_KEY,id);
}
function membershipReference(){
  let value=localStorage.getItem(MEMBERSHIP_REFERENCE_KEY)||'';
  if(/^[A-Za-z0-9_-]{8,120}$/.test(value)) return value;
  value=`member_${crypto.randomUUID().replaceAll('-','_')}`;
  localStorage.setItem(MEMBERSHIP_REFERENCE_KEY,value);
  return value;
}
function formatStripeDate(seconds){
  if(!Number.isFinite(Number(seconds))) return '';
  return new Date(Number(seconds)*1000).toLocaleDateString('en-AU',{day:'numeric',month:'short',year:'numeric'});
}

function showMessage(message){
  let el=document.querySelector('.genevieve-payment-return');
  if(!el){el=document.createElement('div');el.className='genevieve-payment-return';document.body.appendChild(el)}
  el.textContent=message;
  setTimeout(()=>el.remove(),6000);
}

async function startCheckout(planKey){
  const modal=document.getElementById('genevieve-payment-modal');
  const error=modal?.querySelector('.genevieve-pay-error');
  const buttons=[...(modal?.querySelectorAll('.genevieve-pay-choice')||[])];
  error?.classList.remove('show');
  buttons.forEach((b)=>{b.disabled=true});
  try{
    const direct=paymentLinkFor(planKey);
    if(direct){window.location.assign(direct);return}
    const handler=await secureGet('handler',{}).catch(()=>({}));
    const response=await fetch('/api/create-checkout-session',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({planKey,email:handler?.email||'',memberRef:membershipReference()})
    });
    const data=await response.json().catch(()=>({}));
    if(!response.ok||!data.url) throw new Error(data.error||'Payments are not connected yet.');
    window.location.assign(data.url);
  }catch(err){
    if(error){
      error.textContent=err?.message||'Secure checkout is temporarily unavailable. The rest of Genevieve is still working normally.';
      error.classList.add('show');
    }
    buttons.forEach((b)=>{b.disabled=false});
  }
}

async function openCustomerPortal(){
  const sessionId=savedMembershipSession();
  if(!sessionId){
    window.location.assign(STRIPE_PORTAL_LOGIN);
    return;
  }
  try{
    const response=await fetch('/api/create-portal-session',{
      method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId})
    });
    const data=await response.json().catch(()=>({}));
    if(!response.ok||!data.url) throw new Error(data.error||'Membership management is temporarily unavailable.');
    window.location.assign(data.url);
  }catch(error){showMessage(error?.message||'Membership management is temporarily unavailable.')}
}

function membershipStatusCopy(membership){
  const status=String(membership?.status||'unknown');
  let text='Stripe verified: Membership status unavailable';
  if(status==='trialing') text=`Stripe verified: 30-day trial active${membership.trialEnd?` until ${formatStripeDate(membership.trialEnd)}`:''}`;
  else if(status==='active') text='Stripe verified: Membership active';
  else if(status==='past_due') text='Stripe verified: Payment past due — update your payment method';
  else if(status==='unpaid') text='Stripe verified: Payment unpaid — membership needs attention';
  else if(status==='canceled') text='Stripe verified: Membership cancelled';
  else if(status==='incomplete'||status==='incomplete_expired') text='Stripe verified: Membership setup incomplete';
  else if(status==='paused') text='Stripe verified: Membership paused';
  else if(status==='pending') text='Stripe verified: Membership is still being created';
  if(membership?.cancelAtPeriodEnd) text+=` · cancellation scheduled${membership.currentPeriodEnd?` for ${formatStripeDate(membership.currentPeriodEnd)}`:''}`;
  if(membership?.refund?.status==='refunded') text+=` · refund recorded${membership.refund.amountAud?` $${membership.refund.amountAud.toFixed(2)} AUD`:''}`;
  return text;
}

async function refreshMembershipStatus(){
  const sessionId=savedMembershipSession();
  const membership=document.querySelector('.membership');
  const statusEl=membership?.querySelector('span');
  if(!sessionId){
    if(statusEl&&/not yet connected|checkout available/i.test(statusEl.textContent||'')) statusEl.textContent='Stripe connected · 30-day free trial available below.';
    return;
  }
  if(statusEl) statusEl.textContent='Verifying membership directly with Stripe…';
  try{
    const response=await fetch('/api/membership-status',{
      method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId})
    });
    const data=await response.json().catch(()=>({}));
    if(!response.ok||!data.membership) throw new Error(data.error||'Unable to verify membership.');
    if(statusEl) statusEl.textContent=membershipStatusCopy(data.membership);
  }catch(error){
    if(statusEl) statusEl.textContent='Membership saved on this device; live Stripe verification is temporarily unavailable.';
  }
}

function closeModal(){
  const modal=document.getElementById('genevieve-payment-modal');
  if(modal) modal.hidden=true;
  document.documentElement.style.overflow='';
}
function openModal(){
  const modal=ensureModal();
  modal.hidden=false;
  document.documentElement.style.overflow='hidden';
  modal.querySelector('.genevieve-pay-close')?.focus();
}

function ensureModal(){
  let modal=document.getElementById('genevieve-payment-modal');
  if(modal) return modal;
  modal=document.createElement('div');
  modal.id='genevieve-payment-modal';
  modal.hidden=true;
  modal.innerHTML=`<div class="genevieve-pay-backdrop" role="presentation">
    <section class="genevieve-pay-sheet" role="dialog" aria-modal="true" aria-labelledby="genevievePayTitle">
      <div class="genevieve-pay-head">
        <img src="${LOGO}" alt="GENEVIEVE App tree, roots and infinity logo">
        <div><small>GENEVIEVE APP™ MEMBERSHIP</small><h2 id="genevievePayTitle">Choose your secure membership</h2></div>
        <button class="genevieve-pay-close" type="button" aria-label="Close payments">×</button>
      </div>
      <p class="genevieve-pay-intro">Checkout is handled by Stripe. Eligible customers can use Apple Pay, Google Pay or a payment card on Stripe’s secure checkout page.</p>
      <div class="genevieve-wallets" aria-label="Accepted payment options">
        <div class="genevieve-wallet-badge"> Pay<br><small>Apple Pay</small></div>
        <div class="genevieve-wallet-badge">G Pay<br><small>Google Pay</small></div>
        <div class="genevieve-wallet-badge stripe">stripe<br><small>Card checkout</small></div>
      </div>
      <div class="genevieve-plan-grid">
        ${Object.entries(PLAN_COPY).map(([key,p])=>`<button type="button" class="genevieve-pay-choice" data-plan="${key}"><small>${p.label}</small><strong>${p.price}</strong><span>${p.period} · 30-day free trial for eligible new subscribers</span></button>`).join('')}
      </div>
      <div class="genevieve-pay-error" role="alert"></div>
      <p class="genevieve-pay-note"><b>Before subscribing:</b> 30 days free for eligible new subscribers. Then the selected price renews automatically each month or year until cancelled. Cancel before the trial ends to avoid the first charge. Deleting the app does not cancel a subscription.</p>
      <p class="genevieve-pay-legal">Payment details are entered with Stripe, not stored in Genevieve. <a href="/legal/subscription-terms.html">Subscription terms</a> · <a href="/legal/refund-cancellation-policy.html">Refund & cancellation policy</a></p>
    </section>
  </div>`;
  document.body.appendChild(modal);
  modal.querySelector('.genevieve-pay-close')?.addEventListener('click',closeModal);
  modal.querySelector('.genevieve-pay-backdrop')?.addEventListener('click',(e)=>{if(e.target===e.currentTarget)closeModal()});
  modal.querySelectorAll('.genevieve-pay-choice').forEach((button)=>button.addEventListener('click',()=>startCheckout(button.dataset.plan)));
  document.addEventListener('keydown',(e)=>{if(e.key==='Escape'&&!modal.hidden)closeModal()});
  return modal;
}

function makeManageButton(label,extraClass=''){
  const button=document.createElement('button');
  button.type='button';
  button.className=`genevieve-manage-membership ${extraClass}`.trim();
  button.textContent=label;
  button.addEventListener('click',openCustomerPortal);
  return button;
}

function injectMembershipControl(){
  const membership=document.querySelector('.membership');
  if(!membership) return;
  if(!membership.querySelector('.genevieve-pay-open')){
    const button=document.createElement('button');
    button.type='button';button.className='genevieve-pay-open';
    button.innerHTML='Pay securely / choose membership<span>Stripe · Apple Pay · Google Pay</span>';
    button.addEventListener('click',openModal);membership.appendChild(button);
  }
  if(!membership.querySelector('.genevieve-membership-actions')){
    const actions=document.createElement('div');
    actions.className='genevieve-membership-actions';
    actions.setAttribute('aria-label','Membership billing actions');
    if(savedMembershipSession()){
      actions.appendChild(makeManageButton('💳 Update Payment Method'));
      actions.appendChild(makeManageButton('❌ Cancel Subscription','danger'));
    }else{
      actions.appendChild(makeManageButton('Manage an existing Stripe membership'));
    }
    membership.appendChild(actions);
  }
  const status=membership.querySelector('span');
  if(status&&/not yet connected to a payment processor/i.test(status.textContent||'')) status.textContent='Stripe connected · 30-day free trial available below.';
}

function handleReturnState(){
  const params=new URLSearchParams(window.location.search);
  const state=params.get('payment');
  const sessionId=params.get('session_id');
  const membershipReturn=params.get('membership');
  if(state==='success'){
    if(sessionId) saveMembershipSession(sessionId);
    showMessage('✓ Stripe checkout completed. Genevieve is verifying your membership status.');
  }
  if(state==='cancelled'){
    const el=document.createElement('div');el.className='genevieve-payment-return cancel';
    el.textContent='Payment cancelled. Nothing was charged.';document.body.appendChild(el);setTimeout(()=>el.remove(),5000);
  }
  if(membershipReturn==='return') showMessage('Membership settings closed. Genevieve is refreshing your Stripe status.');
  if(state||membershipReturn){
    params.delete('payment');params.delete('session_id');params.delete('membership');
    const q=params.toString();history.replaceState({},'',`${location.pathname}${q?`?${q}`:''}${location.hash}`);
  }
}

window.addEventListener('DOMContentLoaded',()=>{
  ensureModal();handleReturnState();injectMembershipControl();refreshMembershipStatus();
  const observer=new MutationObserver(()=>injectMembershipControl());
  observer.observe(document.getElementById('root')||document.body,{childList:true,subtree:true});
});
