import './config.js';
import './ui-enhancements.css';

const OFFICIAL_LOGO = '/assets/genevieve-official-logo.jpeg';
const PORTAL_URL = 'https://billing.stripe.com/p/login/dRm7sM5Qi57R4FmgV01wY00';

const HAZARDS = [
  {
    title: 'Snake / Wildlife',
    detail: 'Wildlife encounter or sighting',
    asset: '/assets/hazard-snake-wildlife.svg'
  },
  {
    title: 'Council / Infrastructure',
    detail: 'Gate, fence, surface or facility concern',
    asset: '/assets/hazard-council-infrastructure.svg'
  },
  {
    title: 'Baiting / Poison Threat',
    detail: 'Suspected bait, toxin or contamination',
    asset: '/assets/hazard-bait-poison.svg'
  },
  {
    title: 'Altercation / Incident',
    detail: 'Safety incident requiring a record',
    asset: '/assets/hazard-altercation-incident.svg'
  }
];

const PLANS = [
  { key: 'standardMonthly', name: 'Standard Monthly', price: 'A$14.99', period: 'per month', status: 'connected' },
  { key: 'concessionMonthly', name: 'Concession Monthly', price: 'A$10.49', period: 'per month', status: 'connected' },
  { key: 'standardAnnual', name: 'Standard Annual', price: 'A$119.99', period: 'per year', status: 'pending' },
  { key: 'concessionAnnual', name: 'Concession Annual', price: 'A$83.00', period: 'per year', status: 'pending' }
];

function paymentLink(key) {
  const value = window.GENEVIEVE_CONFIG?.paymentLinks?.[key];
  return typeof value === 'string' && /^https:\/\/buy\.stripe\.com\//i.test(value.trim()) ? value.trim() : '';
}

function reinforceOfficialLogo() {
  const logo = document.querySelector('.brand-header img');
  if (!logo) return;
  logo.src = OFFICIAL_LOGO;
  logo.alt = 'GENEVIEVE App official tree, infinity and roots logo';
  logo.decoding = 'async';
}

function upgradeHazardCards() {
  const buttons = [...document.querySelectorAll('[data-screen="hazards"] .threat-grid button')];
  if (buttons.length !== HAZARDS.length) return;

  buttons.forEach((button, index) => {
    const hazard = HAZARDS[index];
    button.className = 'hazard-professional-card';
    button.disabled = true;
    button.setAttribute('aria-label', `${hazard.title}. ${hazard.detail}. Reporting remains gated until moderation and verification are active.`);
    button.innerHTML = `
      <img src="${hazard.asset}" width="84" height="84" alt="" aria-hidden="true" />
      <span class="hazard-professional-copy">
        <strong>${hazard.title}</strong>
        <small>${hazard.detail}</small>
      </span>`;
  });
}

function planMarkup(plan) {
  const link = paymentLink(plan.key);
  const enabled = plan.status === 'connected' && Boolean(link);
  const control = enabled
    ? `<a class="stripe-plan-action" href="${link}" target="_blank" rel="noopener noreferrer" data-live-stripe="true">Open secure Stripe checkout</a>`
    : '<button class="stripe-plan-action pending" type="button" disabled>Checkout verification pending</button>';

  return `<article class="stripe-plan-card" data-stripe-plan="${plan.key}" data-plan-status="${enabled ? 'connected' : 'pending'}">
    <span class="stripe-plan-status">${enabled ? 'LIVE STRIPE CONNECTED' : 'ANNUAL CHECKOUT GATED'}</span>
    <h3>${plan.name}</h3>
    <p class="stripe-plan-price">${plan.price} <small>${plan.period}</small></p>
    <p>30-day free trial for eligible new subscribers. Payment details stay with Stripe.</p>
    ${control}
  </article>`;
}

function injectStripeMembership() {
  const handler = document.querySelector('[data-screen="handler"]');
  if (!handler || document.querySelector('#stripe-membership-panel')) return;

  const panel = document.createElement('article');
  panel.id = 'stripe-membership-panel';
  panel.className = 'panel stripe-membership-panel';
  panel.innerHTML = `
    <div class="stripe-membership-heading">
      <div>
        <span class="stripe-verified-kicker">STRIPE · SECURE BILLING</span>
        <div class="panel-title">Membership & billing</div>
      </div>
      <span class="stripe-connected-badge">Connected</span>
    </div>
    <p>Checkout opens on Stripe's secure hosted page. Billing is isolated from GENEVIEVE safety functions, so a payment issue cannot block emergency access, hazard screens, private check-in or boundary safeguards.</p>
    <div class="stripe-preview-warning"><strong>Preview uses live Stripe links.</strong> Do not complete checkout unless you intentionally want to start a real subscription.</div>
    <div class="stripe-plan-grid">${PLANS.map(planMarkup).join('')}</div>
    <p class="microcopy">Monthly checkout is connected at the verified approved prices. Annual checkout remains deliberately gated while the live Stripe objects are corrected; GENEVIEVE will not silently substitute a different price.</p>
    <a class="stripe-portal-link" href="${PORTAL_URL}" target="_blank" rel="noopener noreferrer">Manage an existing membership with Stripe</a>`;

  handler.appendChild(panel);
}

function applyEnhancements() {
  reinforceOfficialLogo();
  upgradeHazardCards();
  injectStripeMembership();
}

applyEnhancements();
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', applyEnhancements, { once: true });
